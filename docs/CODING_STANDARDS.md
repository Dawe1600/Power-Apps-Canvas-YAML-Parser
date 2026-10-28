# CODING_STANDARDS.md - Standardy Kodu i Architektury Walidatora

Dokument ten definiuje twarde standardy inżynierskie obowiązujące podczas implementacji ticketów oraz przeglądów kodu (`/code-review` — oś **Standards**) w repozytorium **Power-Apps-Canvas-YAML-Parser**.

---

## 1. Czyste Jądro vs Brzeg I/O (Pure Core, Imperative Shell)

- Funkcje `validateYaml(yamlText, options)` oraz `validateFx(fxText, options)` i wszystkie moduły reguł w `src/rules/*.mjs` muszą być **w 100% czystymi, deterministycznymi, synchronicznymi funkcjami** operującymi wyłącznie na danych w pamięci (stringach, tokenach i drzewie AST).
- **Zakaz operacji I/O w `src/rules/`**: Żaden moduł reguł nie może importować `node:fs` ani odczytywać plików z dysku.
- Operacje dyskowe (`node:fs`, `node:path`) oraz wyjścia procesowe (`process.exit`, `process.stdout`) są dozwolone wyłącznie na brzegu architektury:
  - w `validateProject(projectDir, options)` (`src/project-validator.mjs`),
  - w interfejsie CLI (`bin/pa-yaml-validator.mjs`).

---

## 2. Deklaratywne Schematy zamiast Kaskad Warunkowych (Data over Code)

- Wszystkie listy dozwolonych typów kontrolek (`PA2002`), macierze właściwości OpenAjax (`in`/`out`, `hidden`, warianty `AutoLayout`/`ManualLayout`, `autoBorderRadius` dla `PA2108`), słowniki halucynacji AI oraz mapowania polskich nazw funkcji Power Fx (`PFX006`) muszą mieszkać jako **niemutowalne, deklaratywne struktury danych** (`Object.freeze`, `Set`, `Map`) w katalogu `src/schemas/`.
- Kod walidatorów w `src/rules/` odpytuje te struktury danych zamiast budować wielopoziomowe kaskady `switch`/`if-else` z zahardkodowanymi nazwami właściwości lub kontrolek.

---

## 3. Dokładność Pozycyjna 1-based `(line, column)` bez Zgadywania (`indexOf`)

- Każdy obiekt `Diagnostic` musi wskazywać dokładny 1-based numer wiersza (`line`) i kolumny (`column`) w oryginalnym pliku źródłowym.
- **Zakaz globalnego `text.indexOf(...)`**: Wyliczanie pozycji błędu przez wyszukanie podciągu w całym tekście dokumentu jest zabronione (zwraca pierwsze wystąpienie w pliku zamiast faktycznego miejsca błędu).
- Pozycje w strukturze YAML wyliczamy za pomocą `LineCounter` i offsetów `range` węzłów AST z pakietu `yaml`.
- Pozycje wewnątrz formuł Power Fx (zarówno dla skalarów inline `Prop: =...`, jak i wieloliniowych bloków `|-`) przeliczamy przez dedykowany mapper offsetów uwzględniający pozycję startową skalara i wcięcia poszczególnych linii bloku `|-`.

---

## 4. Odporność Potoku i Jednolity Kontrakt Diagnostyczny (Fault-Tolerant Pipeline)

- Pojedynczy błąd składniowy w jednej właściwości, formule lub kontrolce **nie może przerywać walidacji** pozostałych właściwości i kontrolek w pliku ani rzucać nieobsłużonego wyjątku.
- Walidator zawsze agreguje komplet wykrytych problemów i zwraca ustrukturyzowany obiekt zgodny z [ADR-0001](./adr/0001-multi-layer-nodejs-validator-architecture.md):
  ```js
  {
    valid: boolean,
    mode: "pa-module" | "control-snippet" | "fx-script",
    diagnostics: Diagnostic[],
    metadata: { controlNames: string[], screenNames: string[], referencedCollections: string[], initializedCollections: string[] }
  }
  ```
- Każdy element `Diagnostic` o poziomie `error` lub `warning` musi zawierać zwięzłe, praktyczne pole `hint` podpowiadające dokładną poprawkę dla twórcy lub agenta AI.

---

## 5. Standardy Node.js ESM i Testów (`node:test`)

- **Czysty ES Modules (`"type": "module"`)**: Wszystkie pliki źródłowe i testowe używają rozszerzenia `.mjs` oraz jawnych ścieżek z rozszerzeniem `.mjs` w instrukcjach `import`.
- **Minimalizm zależności**: Jedyną zewnętrzną zależnością produkcyjną (`dependencies`) jest `yaml` (`eemeli/yaml`). Nie dodajemy ciężkich frameworków CLI ani zewnętrznych runnerów testowych.
- **Standard testów (`tests/*.test.mjs`)**:
  - Używamy wbudowanego `node:test` (`describe`, `it`) oraz `node:assert/strict`.
  - Każda reguła diagnostyczna musi posiadać testy sprawdzające:
    1. Przypadek negatywny (wykrycie dokładnego `code`, `severity`, `line` oraz `column`),
    2. Przypadek pozytywny (brak fałszywych alarmów — `valid: true`, `diagnostics.length === 0` — na poprawnym kodzie, np. ze znakami `{`, `: `, `;` wewnątrz bloku `|-` lub wewnątrz literału tekstowego Power Fx `"..."`).
