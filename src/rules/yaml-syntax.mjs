import { parseDocument, LineCounter, visit } from 'yaml';

/**
 * Validates YAML syntax, plain scalar hazards, and indentation.
 * Pure function: operates only on in-memory strings.
 *
 * @param {string} yamlText
 * @param {object} [options]
 * @returns {import('../types.js').Diagnostic[]}
 */
export function validateYamlSyntax(yamlText, options = {}) {
  const diagnostics = [];
  const lines = yamlText.split(/\r?\n/);
  const hazardLines = new Set();
  const indentationLines = new Set();

  let insideBlockScalar = false;
  let blockScalarBaseIndent = -1;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (insideBlockScalar) {
      if (trimmed.length === 0) {
        continue;
      }
      const currentIndent = line.search(/\S/);
      if (currentIndent > blockScalarBaseIndent) {
        // Still inside block scalar
        continue;
      } else {
        // Exited block scalar
        insideBlockScalar = false;
        blockScalarBaseIndent = -1;
      }
    }

    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }

    // Check for tab indentation
    const leadingWhitespaceMatch = line.match(/^[\s]*/);
    const leadingWhitespace = leadingWhitespaceMatch ? leadingWhitespaceMatch[0] : '';
    const tabIndex = leadingWhitespace.indexOf('\t');
    if (tabIndex !== -1) {
      indentationLines.add(lineNumber);
      diagnostics.push({
        code: 'PA1001',
        severity: 'error',
        message: 'Wcięcie zawiera tabulator (\\t). YAML w Power Apps nie zezwala na tabulatory we wcięciach.',
        line: lineNumber,
        column: tabIndex + 1,
        lineText: line,
        hint: 'Zastąp wszystkie tabulatory spacjami (użyj wielokrotności 2 spacji).'
      });
      continue;
    }

    // Check for odd-space indentation (must be multiples of 2 spaces)
    const leadingSpaceCount = leadingWhitespace.length;
    if (leadingSpaceCount % 2 !== 0) {
      indentationLines.add(lineNumber);
      const roundedDown = leadingSpaceCount - 1;
      const roundedUp = leadingSpaceCount + 1;
      diagnostics.push({
        code: 'PA1001',
        severity: 'error',
        message: `Nieprawidłowe wcięcie: znaleziono nieparzystą liczbę spacji (${leadingSpaceCount}). Wcięcia muszą być wielokrotnością 2 spacji.`,
        line: lineNumber,
        column: leadingSpaceCount + 1,
        lineText: line,
        hint: `Zmień wcięcie na wielokrotność 2 spacji (np. ${roundedDown} lub ${roundedUp} spacje).`
      });
    }

    // Check if this line starts a block scalar: e.g. "Text: |-" or "Text: |"
    const blockScalarMatch = line.match(/^(\s*)([A-Za-z0-9_]+):\s*\|[-+]?\s*(?:#.*)?$/);
    if (blockScalarMatch) {
      insideBlockScalar = true;
      blockScalarBaseIndent = blockScalarMatch[1].length;
      continue;
    }

    // Check for unquoted special YAML indicators at the start of a scalar (@, `, *, &, !, %)
    const specialIndicatorMatch = line.match(/^(\s*)([A-Za-z0-9_]+):\s*([@`*&!%])(.*)$/);
    if (specialIndicatorMatch) {
      const propKey = specialIndicatorMatch[2];
      const specialChar = specialIndicatorMatch[3];
      const rest = specialIndicatorMatch[4];
      const charIndex = line.length - (specialChar.length + rest.length);

      hazardLines.add(lineNumber);
      diagnostics.push({
        code: 'PA1001',
        severity: 'error',
        message: `Niedozwolony znak specjalny YAML ('${specialChar}') na początku niescytowanej wartości. Wskaźniki YAML (@, \`, *, &, !, %) nie mogą rozpoczynać wartości.`,
        line: lineNumber,
        column: charIndex + 1,
        lineText: line,
        hint: `Ujmij wartość w cudzysłów (np. "${specialChar}${rest.trim()}") lub poprzedź znakiem równości jeśli to formuła Power Fx.`
      });
      continue;
    }

    // Check for inline formula scalar: e.g. "Text: =..."
    const inlineFormulaMatch = line.match(/^(\s*)([A-Za-z0-9_]+):\s*(=.*)$/);
    if (inlineFormulaMatch) {
      const leadingSpaces = inlineFormulaMatch[1];
      const propKey = inlineFormulaMatch[2];
      const formula = inlineFormulaMatch[3];
      const formulaStartIndex = line.length - formula.length;

      // Check for Plain Scalar Hazard: contains '{', '}', or ': '
      let hazardIndex = -1;
      let hazardReason = '';

      for (let j = 0; j < formula.length; j++) {
        const char = formula[j];
        if (char === '{' || char === '}') {
          hazardIndex = formulaStartIndex + j;
          hazardReason = char;
          break;
        }
        if (char === ':' && (j + 1 === formula.length || /\s/.test(formula[j + 1]))) {
          hazardIndex = formulaStartIndex + j;
          hazardReason = ': ';
          break;
        }
      }

      if (hazardIndex !== -1) {
        hazardLines.add(lineNumber);
        diagnostics.push({
          code: 'PA1001',
          severity: 'error',
          message: `Plain Scalar Hazard: Formuła inline zawiera '${hazardReason}', co powoduje błąd skanera YamlDotNet w Power Apps Studio.`,
          line: lineNumber,
          column: hazardIndex + 1,
          lineText: line,
          hint: `Użyj bloku wieloliniowego '|-' dla tej właściwości, np.:\n${leadingSpaces}${propKey}: |-\n${leadingSpaces}  ${formula.trim()}`
        });
      }
    }
  }

  // Parse with yaml parser to catch other YAML syntax errors
  const lineCounter = new LineCounter();
  const doc = parseDocument(yamlText, { lineCounter, uniqueKeys: true });

  for (const err of doc.errors) {
    const pos = err.linePos ? err.linePos[0] : { line: 1, col: 1 };
    // Skip if line or previous line was already diagnosed with Plain Scalar Hazard or Indentation error
    if (hazardLines.has(pos.line) || hazardLines.has(pos.line - 1) || indentationLines.has(pos.line)) {
      continue;
    }

    const lineText = lines[pos.line - 1] ?? '';

    if (err.code === 'DUPLICATE_KEY') {
      const match = lineText.match(/^\s*([A-Za-z0-9_]+):/);
      const keyName = match ? match[1] : 'klucz';
      diagnostics.push({
        code: 'PA1001',
        severity: 'error',
        message: `Wykryto zduplikowany klucz mapowania YAML: "${keyName}". Klucze w tym samym bloku muszą być unikalne.`,
        line: pos.line,
        column: pos.col,
        lineText,
        hint: `Usuń zduplikowany wpis "${keyName}" lub zmień nazwę właściwości/kontrolki na unikalną.`
      });
      continue;
    }

    diagnostics.push({
      code: 'PA1001',
      severity: 'error',
      message: `Błąd składni YAML: ${err.message.split('\n')[0]}`,
      line: pos.line,
      column: pos.col,
      lineText,
      hint: 'Popraw błąd składniowy YAML, upewniając się, że struktura wcięć i znaki specjalne są poprawne.'
    });
  }

  // Detect empty or null structural blocks (Properties: {}, Properties: null, Children: [], Children: null)
  if (doc.contents) {
    visit(doc, {
      Pair(_, pair) {
        const key = pair.key?.value;
        if (key === 'Properties' || key === 'Children') {
          const val = pair.value;
          let isEmpty = false;
          if (val === null || val === undefined) {
            isEmpty = true;
          } else if (Array.isArray(val.items)) {
            isEmpty = val.items.length === 0;
          } else {
            isEmpty = val.value === null || val.value === undefined || (val.value === '' && val.type === 'PLAIN');
          }

          if (isEmpty) {
            const keyRange = pair.key?.range;
            const pos = keyRange && lineCounter ? lineCounter.linePos(keyRange[0]) : { line: 1, col: 1 };
            const lineText = lines[pos.line - 1] ?? '';
            diagnostics.push({
              code: 'PA1001',
              severity: 'error',
              message: `Pusty lub null blok "${key}:". Blok ${key} nie może być pusty ani zdefiniowany jako ${key === 'Properties' ? '{}' : '[]'}.`,
              line: pos.line,
              column: pos.col,
              lineText,
              hint: `Usuń blok "${key}:" jeśli nie zawiera definicji, lub dodaj odpowiednie wpisy.`
            });
          }
        }
      }
    });
  }

  return diagnostics;
}
