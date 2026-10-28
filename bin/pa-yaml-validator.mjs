#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { validateYaml } from '../src/index.mjs';

function printHelp() {
  console.log(`
Użycie:
  pa-yaml-validator <ścieżki...> [opcje]

Opcje:
  --json                 Zwraca wynik walidacji w formacie JSON
  --strict               Traktuje ostrzeżenia jako błędy
  --mode <tryb>          Wymusza tryb: auto | pa-module | control-snippet | fx (domyślnie: auto)
  --help, -h             Wyświetla tę pomoc
`);
}

function parseCliArgs(args) {
  const options = {
    json: false,
    strict: false,
    mode: 'auto',
    help: false,
    files: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--mode' && i + 1 < args.length) {
      options.mode = args[++i];
    } else if (arg.startsWith('--mode=')) {
      options.mode = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (!arg.startsWith('-')) {
      options.files.push(arg);
    }
  }

  return options;
}

function resolveFiles(filePaths) {
  const resolved = [];

  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
      console.error(`Błąd: Nie znaleziono pliku lub katalogu: ${filePath}`);
      continue;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(filePath, { recursive: true });
      for (const entry of entries) {
        if (typeof entry === 'string' && (entry.endsWith('.pa.yaml') || entry.endsWith('.yaml') || entry.endsWith('.YAML'))) {
          resolved.push(path.join(filePath, entry));
        }
      }
    } else {
      resolved.push(filePath);
    }
  }

  return resolved;
}

function main() {
  const cliArgs = process.argv.slice(2);
  const options = parseCliArgs(cliArgs);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.files.length === 0) {
    console.error('Błąd: Nie podano żadnych plików do walidacji. Użyj --help, aby zobaczyć instrukcję.');
    process.exit(1);
  }

  const files = resolveFiles(options.files);
  if (files.length === 0) {
    console.error('Błąd: Nie znaleziono plików YAML do walidacji.');
    process.exit(1);
  }

  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (err) {
      console.error(`Nie można odczytać pliku ${file}: ${err.message}`);
      totalErrors++;
      results.push({
        file,
        valid: false,
        diagnostics: [
          {
            code: 'CLI_IO_ERROR',
            severity: 'error',
            message: `Nie można odczytać pliku: ${err.message}`,
            line: 1,
            column: 1,
            lineText: '',
            hint: 'Upewnij się, że plik istnieje i masz uprawnienia do jego odczytu.'
          }
        ]
      });
      continue;
    }

    const res = validateYaml(content, { mode: options.mode });
    const errors = res.diagnostics.filter(d => d.severity === 'error');
    const warnings = res.diagnostics.filter(d => d.severity === 'warning');

    totalErrors += errors.length;
    totalWarnings += warnings.length;
    if (options.strict && warnings.length > 0) {
      totalErrors += warnings.length;
    }

    results.push({
      file,
      valid: res.valid && (!options.strict || warnings.length === 0),
      mode: res.mode,
      diagnostics: res.diagnostics,
      metadata: res.metadata
    });
  }

  const allValid = totalErrors === 0;

  if (options.json) {
    const output = {
      valid: allValid,
      filesChecked: files.length,
      errors: totalErrors,
      warnings: totalWarnings,
      results
    };
    console.log(JSON.stringify(output, null, 2));
    process.exit(allValid ? 0 : 1);
  }

  // Human-readable formatting
  for (const r of results) {
    if (r.diagnostics.length === 0) {
      console.log(`✓ ${r.file} - poprawny (0 błędów)`);
      continue;
    }

    console.log(`\nPlik: ${r.file}`);
    for (const d of r.diagnostics) {
      const prefix = d.severity === 'error' ? '❌ Błąd' : '⚠️ Ostrzeżenie';
      console.log(`  ${prefix} [${d.code}] wiersz ${d.line}, kolumna ${d.column}:`);
      console.log(`    ${d.message}`);
      if (d.lineText) {
        console.log(`    > ${d.line} | ${d.lineText}`);
      }
      if (d.hint) {
        console.log(`    💡 Hint: ${d.hint}`);
      }
      console.log();
    }
  }

  console.log(`\nPodsumowanie: Sprawdzono ${files.length} ${files.length === 1 ? 'plik' : 'plików'}. Błędów: ${totalErrors}, ostrzeżeń: ${totalWarnings}.`);

  process.exit(allValid ? 0 : 1);
}

main();
