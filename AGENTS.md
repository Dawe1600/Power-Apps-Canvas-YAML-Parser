# AGENTS.md - Power Apps Canvas YAML & Power Fx Static Validator

Statyczny walidator składni YAML (PaYaml Schema v3.0), szablonów kontrolek OpenAjax (`PA2108`) oraz formuł Power Fx dla kodu wklejanego do Power Apps Studio i plików `.pa.yaml` / `.YAML` / `.fx`.

---

## 1. Mapa Projektu i Kontrakt Publiczny

Docelowa struktura modułów (czysta architektura Node.js ESM, `"type": "module"`):

- **`bin/pa-yaml-validator.mjs`** — CLI (`pa-yaml-validator <path...> [--json] [--strict] [--mode auto|pa-module|control-snippet|fx]`).
- **`src/index.mjs`** — główne API programistyczne eksportujące `validateYaml(yamlText, options)`, `validateFx(fxText, options)`, `validateProject(projectDir, options)`.
- **`src/schemas/`** — niemutowalne słowniki danych: 116 typów kontrolek, macierz OpenAjax (`Templates.json`), mapa halucynacji AI i polskie nazwy funkcji Power Fx.
- **`src/rules/`** — 6 warstw reguł walidacyjnych (`yaml-syntax.mjs`, `schema-structure.mjs`, `control-registry.mjs`, `property-matrix.mjs`, `powerfx-parser.mjs`, `semantic-rules.mjs`).
- **`src/project-validator.mjs`** — walidacja międzyplikowa (`SEM001`, `SEM005`, `PROJ001`, `PROJ002`).
- **`tests/`** — testy jednostkowe i integracyjne (`node --test`).

---

## 2. Wskaźniki Kontekstowe (Context Pointers)

Sięgaj do poniższych dokumentów w zależności od wykonywanego zadania:

- **Kody błędów, poziomy ważności (`error`/`warning`), wyzwalacze i treści podpowiedzi (`hint`)**: przeczytaj [`docs/ERROR_CATALOG.md`](./docs/ERROR_CATALOG.md) przed implementacją dowolnej reguły `PAxxxx`, `PFXxxx`, `SEMxxx` lub `PROJxxx`.
- **Dokładne listy właściwości OpenAjax (`in`/`out`, `hidden="true"`, warianty, `autoBorderRadius`) oraz 116 typów kontrolek**: przeczytaj [`docs/reference/OPENAJAX_TEMPLATES_MATRIX.md`](./docs/reference/OPENAJAX_TEMPLATES_MATRIX.md) przy pracy nad `src/schemas/` i regułami `PA1011`, `PA2002`–`PA2108` (Tickety #4–#6).
- **Standardy kodu, czystość funkcji w `src/rules/`, wyliczanie pozycji `(line, column)` i kryteria `/code-review`**: przeczytaj [`docs/CODING_STANDARDS.md`](./docs/CODING_STANDARDS.md) przed pisaniem kodu i recenzją zmian.
- **Słownik pojęć domenowych (`Plain Scalar Hazard`, `Control Variant`, `Invariant Formula`, `Regional Formula`, `Global Scope`)**: przeczytaj [`GLOSSARY.md`](./GLOSSARY.md).
- **Decyzje architektoniczne i kontrakt obiektu `Diagnostic`**: przeczytaj [`docs/adr/0001-multi-layer-nodejs-validator-architecture.md`](./docs/adr/0001-multi-layer-nodejs-validator-architecture.md).
- **Główna specyfikacja i drzewo 10 ticketów**: Issue [#1](https://github.com/Dawe1600/Power-Apps-Canvas-YAML-Parser/issues/1) (dzieci: [#2](https://github.com/Dawe1600/Power-Apps-Canvas-YAML-Parser/issues/2)–[#11](https://github.com/Dawe1600/Power-Apps-Canvas-YAML-Parser/issues/11)).

---

## 3. Twarde Reguły Wykonawcze i Środowiskowe

- **Granica repozytoriów (Ścisłe Read-Only dla korpusów zewnętrznych)**:
  Cały kod i testy tworzymy wyłącznie w `C:\Programowanie\Power-Apps-Canvas-YAML-Parser`. Repozytoria produkcyjne `C:\Programowanie\e-Problem` oraz `C:\Programowanie\e-Zamówienia` (wraz z rozpakowanymi archiwami `.msapp` w `C:\Programowanie\e-Zamówienia\.temp_msapp_extract` i `.temp_ebadania_extract`) służą **wyłącznie do odczytu** jako korpusy weryfikacyjne.
- **Brak flagi `--fix`**: Walidator jest narzędziem wyłącznie diagnostycznym (zwraca precyzyjne lokalizacje `line:column` oraz `hint`); nie implementujemy automatycznego przepisywania plików.
- **Język commitów**: Wiadomości commitów (`git commit`) piszemy **po polsku** ze wskazaniem numeru ticketu (np. `feat(pa1001): wykrywanie pułapek plain scalar i błędów wcięć (#2)`).
- **Środowisko Windows PowerShell**:
  - Polecenia wieloetapowe łączymy średnikiem `;` (operator `&&` powoduje błąd składni w Windows PowerShell 5.1).
  - Przy wieloliniowych opisach lub komentarzach w `gh issue` używamy flagi `--body-file <ścieżka>` zamiast przekazywania długich stringów bezpośrednio w linii poleceń.

---

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` + `docs/adr/`). See `docs/agents/domain.md`.
