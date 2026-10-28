# 0001: Multi-Layer Node.js Validator with OpenAjax Control Schemas and Custom Power Fx AST

We are building the Power Apps Canvas YAML validator in pure Node.js (ESM) using a six-layer validation pipeline (`PA1xxx` YAML/Schema v3.0, `PA2xxx` Control Templates & Variants, `PA3xxx` Round-Trip/Version, `PFXxxx` Power Fx Lexer/AST, `SEMxxx` Studio Semantics, and `PROJxxx` Project Cross-File Rules) rather than wrapping `pac canvas validate` or `Microsoft.PowerPlatform.PowerApps.YamlValidator.dll`.

## Context & Findings

Decompilation and inspection of Microsoft's official `pac` CLI (`v2.4.1`) revealed that `Microsoft.PowerPlatform.PowerApps.YamlValidator.dll`:
1. Embeds an outdated schema that does not match Schema v3.0 (`Screens:` / `App:` root structure).
2. Validates properties against a flat union list (`control-property-schema.json`) that fails to catch per-control `PA2108` errors (such as `RadiusTopLeft` on `AddMedia@2.2.1` or `Classic/DropDown@2.3.1`, `Layout` on `Gallery@2.15.0`, `LayoutDirection` on `ManualLayout` `GroupContainer@1.5.0`, or output-only `Text` on `Classic/TextInput@2.3.2`).
3. Does not detect `YamlDotNet` plain scalar hazards (`PA1001` when `{`, `}`, or `: ` appear inline after `=`), Power Fx syntax errors, or Studio semantic errors (`Navigate` in `OnVisible`, `Select(Parent)` in `GroupContainer`).

## Decision

1. **Zero-.NET Runtime Dependency**: The validator is implemented in Node.js (ESM) so it can be imported directly into `node:test` suites and executed via CLI in milliseconds.
2. **Ground-Truth Control Matrix from OpenAjax Templates**: Layer 2 (`PA2108` / `PA1011`) encodes the exact input, output-only (`direction="out"`), hidden (`hidden="true"`), and variant-overridden property rules extracted from Microsoft's `.msapp` `References/Templates.json` and `commonStyleProperties.xml`, paired with a hybrid fallback for uncommon controls and an AI hallucination dictionary.
3. **Dedicated Power Fx Tokenizer & Recursive Descent Parser**: Layer 4 tokenizes formulas starting after `=` (tracking line/column offsets inside both inline scalars and `|-` Block Scalars) to catch unbalanced delimiters, unclosed literals, `;` inside `{...}` records, `;;` in YAML, and localized function names without false positives inside string literals or comments.
