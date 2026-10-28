# Error Catalog (`docs/ERROR_CATALOG.md`)

Complete reference of all diagnostic codes, triggers, root causes, and remediation hints supported by **Power Apps Canvas YAML Parser**.

This catalog is derived from primary-source analysis of:
1. `Microsoft.PowerPlatform.PowerApps.YamlValidator.dll` (`pa.yaml-schema.json`, `control-type-schema.json`, `control-property-schema.json`)
2. `Microsoft.PowerPlatform.Formulas.Tools.dll` (`YamlLexer`, `ErrorCode` enum, `commonStyleProperties.xml`)
3. Unpacked `.msapp` OpenAjax `<widget>` control templates (`References/Templates.json` & `Controls/*.json`)
4. Official Microsoft Power Apps YAML Schema v3.0 (`pa.schema.yaml`)
5. Production error patterns in `e-Problem` and `e-Zamówienia`

---

## Diagnostic Layers Overview

| Prefix | Layer | Description |
| :--- | :--- | :--- |
| **`PA1xxx`** | **Layer 1: YAML & Schema v3.0** | `YamlDotNet` scanner failures, Plain Scalar Hazards, indentation, quoting, and Schema v3.0 structural rules. |
| **`PA2xxx`** | **Layer 2: Control Templates & Variants** | Unknown/hidden/output-only properties (`PA2108`), hallucinated AI properties, Variant overrides, and parent-child nesting rules. |
| **`PA3xxx`** | **Layer 3: Schema Version & Round-Trip** | Legacy v1/v2 `As` syntax, non-round-trippable YAML comments/constructs, and Studio paste restrictions. |
| **`PFXxxx`** | **Layer 4: Power Fx AST & Grammar** | Tokenization, unbalanced delimiters, unclosed literals, Invariant vs Regional separator traps (`;;`, `;` in records), and unknown/localized function names. |
| **`SEMxxx`** | **Layer 5: Studio Runtime & Semantics** | Global Scope duplicate identifiers, `Navigate()` in `OnVisible`, `Select(Parent)` in `GroupContainer`, `Clear()` without schema, `App.Formulas` purity, and SharePoint type mismatches. |
| **`PROJxxx`** | **Layer 6: Project Cross-File Rules** | Optional project-level checks: `fxTheme` token consistency across `app/*.YAML` and `fx/App.Formulas.fx`, data source quoting, and delegation rules. |

---

## Layer 1: YAML & Schema v3.0 (`PA1xxx`)

### `PA1001` — `YamlInvalidSyntax` (Scanner / Plain Scalar Hazard)
- **Severity**: `error`
- **Root Cause**: Power Apps Studio uses `YamlDotNet` to scan YAML before deserializing `PaModule`. Certain constructs that look harmless in text trigger fatal scanner errors:
  1. **Inline Plain Scalar Hazard (`{`, `}`, `: `)**: An inline property formula (`Property: =...`) contains `{`, `}`, or `: ` (colon followed by whitespace) on the same line without a `|-` block scalar. `YamlDotNet` interprets `{` as a YAML flow mapping and `: ` as a nested YAML key-value mapping (`While scanning a plain scalar value, found invalid mapping`).
  2. **Tab Indentation (`\t`)**: Any tab character used for indentation.
  3. **Odd / Misaligned Indentation**: Indentation not a multiple of 2 spaces or misaligned sibling keys.
  4. **Duplicate YAML Map Keys**: Duplicate property names inside the same `Properties:` block or duplicate screen names under `Screens:`.
  5. **Empty Structural Blocks**: `Properties: {}`, `Properties:` with null body, or `Children: []` / null body.
  6. **YAML Special Indicator at Start of Unquoted Scalar**: Starting a non-formula scalar with `@`, `` ` ``, `*`, `&`, `!`, `%`.
- **Examples**:
  ```yaml
  # ❌ BAD (PA1001 - inline colon + space inside plain scalar)
  Text: ="Placówka: " & ThisItem.Title

  # ❌ BAD (PA1001 - inline curly braces in plain scalar)
  OnSelect: =UpdateContext({ locVisible: true })

  # ✅ GOOD (Block Scalar neutralizes plain scalar hazards)
  Text: |-
    ="Placówka: " & ThisItem.Title
  OnSelect: |-
    =UpdateContext({ locVisible: true })
  ```

### `PA1002` — `MissingFormulaPrefix`
- **Severity**: `error`
- **Root Cause**: Every non-null value inside a `Properties:` map in Schema v3.0 MUST start with `=` (`pfx-formula` pattern `^=.*`).
  - Common AI mistake: `Width: 200`, `Visible: true`, `Text: "Hello"`.
- **Hint**: Prefix the property value with `=` (`Width: =200`, `Visible: =true`, `Text: ="Hello"`).

### `PA1003` — `QuotedFormulaScalar`
- **Severity**: `error`
- **Root Cause**: Wrapping the entire `=` formula in outer double or single quotes (e.g., `Width: "=230"` or `Text: '="Hello"'`). Studio either fails to parse the formula or treats it as a broken literal (`YamlLexer.UnsupportedSingleQuote`).
- **Hint**: Remove outer quotes around `=`; use `Width: =230` or a `|-` Block Scalar.

### `PA1004` — `InvalidRootStructure`
- **Severity**: `error`
- **Root Cause**: Document root does not match either:
  - A valid **PaModule Document** (`App`, `Screens`, `ComponentDefinitions`, `DataSources`, `EditorState` with `additionalProperties: false`), or
  - A valid **Control Snippet** (single control mapping or sequence of `- ControlName:` items).

### `PA1005` — `InvalidControlSequenceItem`
- **Severity**: `error`
- **Root Cause**: An item inside `Children:` is not a single-key map `{ ControlName: { Control: ... } }` (e.g., missing `- ` sequence dash, or placing `Control:` directly inside `Children:` without a control name key).

### `PA1011` — `MissingRequiredControlAttribute` (`Control` / `Variant` / `ComponentName`)
- **Severity**: `error`
- **Root Cause**:
  1. Control definition is missing the required `Control:` key.
  2. `Gallery` (`Gallery@2.15.0`) is missing the required `Variant:` key (e.g., `BrowseLayout_Vertical_TwoTextOneImageVariant_ver5.0`, `BrowseLayout_Vertical_TwoTextVariant_ver5.0`, `FlexibleHeight`).
  3. `GroupContainer` (`GroupContainer@1.5.0`) is missing the required `Variant:` key (`AutoLayout` or `ManualLayout`).
  4. `CanvasComponent` or `CodeComponent` is missing the required `ComponentName:` key.

---

## Layer 2: Control Templates, Variants & Nesting (`PA2xxx`)

### `PA2002` — `InvalidControlTypeFormat`
- **Severity**: `error`
- **Root Cause**: `Control:` value does not match Schema v3.0 pattern `^([A-Z][a-zA-Z0-9]*/)?[A-Z][a-zA-Z0-9]*(@\d+\.\d+\.\d+)?$`, uses a disallowed type (`AppInfo`, `HostControl`, `Screen`, `AppTest`, `TestCase`, `TestSuite`), or is not a recognized Power Apps control type.

### `PA2003` — `InvalidControlNesting`
- **Severity**: `error`
- **Root Cause**:
  1. `Children:` specified on a leaf control that does not support nested controls (`supportsNestedControls="false"`, e.g., `Label`, `Classic/Button`, `Button`, `Classic/TextInput`, `Classic/DropDown`, `Classic/Icon`, `Image`, `AddMedia`, `HtmlViewer`, `Rectangle`, `Circle`).
  2. `Form` / `FormViewer` containing direct children that are not `DataCard` / `TypedDataCard`.
  3. `Gallery` nested inside another `Gallery` beyond `replicationLimit="1"`.

### `PA2004` — `OrphanContainerChildProperty`
- **Severity**: `warning`
- **Root Cause**: Using Auto-Layout Container Child Properties (`AlignInContainer`, `FillPortions`, `LayoutMinWidth`, `LayoutMinHeight`, `LayoutMaxWidth`, `LayoutMaxHeight`) on a control whose immediate parent is NOT an `AutoLayout` `GroupContainer` (e.g., direct child of a `Screen`, `Gallery`, or `ManualLayout` `GroupContainer`).

### `PA2108` — `UnknownOrDisallowedControlProperty`
- **Severity**: `error`
- **Root Cause**: A property inside `Properties:` is invalid for the specific `Control@Version` and `Variant` due to one of 4 mechanisms discovered in `Templates.json`:

#### Mechanism A: Hallucinated / Classic vs Modern Property Confusion
| Invalid Property (`PA2108`) | Target Control | Correct Property & Explanation |
| :--- | :--- | :--- |
| `FontSize` | `Label`, `Classic/Button`, `Classic/TextInput`, `Classic/DropDown`, `AddMedia`, `HtmlViewer` | Use **`Size`** on Classic controls (`FontSize` only exists on Modern PCF controls like `Button@0.0.45`, `Text`). |
| `Size` | `Button@0.0.45`, `Text` (Modern), `Classic/Icon` | Modern controls use **`FontSize`**; `Classic/Icon` uses **`Width`** and **`Height`**. |
| `TextColor` / `FontColor` | Classic controls (`Label`, `Classic/Button`, `Classic/TextInput`, `Classic/DropDown`) | Use **`Color`** (`FontColor` only exists on Modern `Button@0.0.45` / `Text`). |
| `Color` / `Fill` | `Button@0.0.45` (Modern PCF) | Modern `Button` uses **`FontColor`**, **`BasePaletteColor`**, and **`Appearance`**. |
| `BackgroundColor` / `BgColor` | All controls | Use **`Fill`**. |
| `BorderRadius` / `CornerRadius` | All controls | Use **`RadiusTopLeft`**, **`RadiusTopRight`**, **`RadiusBottomLeft`**, **`RadiusBottomRight`** (only on controls with `autoBorderRadius`). |
| `ClearButton` | `Classic/TextInput@2.3.2` | Property does not exist (`PA2108`). The XML property is `Clear`. |
| `Placeholder` / `PlaceholderText` | `Classic/TextInput@2.3.2`, `AddMedia@2.2.1` | Use **`HintText`** on `Classic/TextInput`; `PlaceholderText` is `hidden="true"` on `AddMedia`. |
| `VerticalOverflow` / `HorizontalOverflow` | `GroupContainer@1.5.0` | Use **`LayoutOverflowY`** and **`LayoutOverflowX`** (`=LayoutOverflow.Scroll` or `.Hide`). |
| `OnClick` / `OnPress` | All controls | Use **`OnSelect`**. |
| `IsVisible` / `Hidden` | All controls | Use **`Visible`**. |
| `Enabled` / `Disabled` / `IsEnabled` | All controls | Use **`DisplayMode`** (`=DisplayMode.Edit`, `.Disabled`, `.View`). |

#### Mechanism B: Controls Without `autoBorderRadius` (Disallowed `Radius*`)
Setting `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, or `RadiusBottomRight` throws **`PA2108`** on:
- `Label@2.5.1` *(wrap in `GroupContainer` or use `Classic/Button` with `DisplayMode.View`)*
- `Classic/DropDown@2.3.1` *(wrap in `ManualLayout` `GroupContainer` with `Radius*`)*
- `AddMedia@2.2.1`
- `Gallery@2.15.0`
- `Classic/Icon@2.5.0`
- `HtmlViewer@2.1.0`
- `Rectangle@2.3.0`
- `Screen`

*(Controls that **DO** support `Radius*`: `GroupContainer@1.5.0`, `Classic/Button@2.2.0`, `Classic/TextInput@2.3.2`, `Image@2.2.3`).*

#### Mechanism C: Hidden Properties (`hidden="true"` in Base Template or Variant Override)
- **`Gallery@2.15.0`**:
  - `Layout` (`hidden="true"` — orientation is controlled via `Variant`).
  - `DisabledBorderColor`, `PressedBorderColor`, `HoverBorderColor`, `DisabledFill`, `PressedFill`, `HoverFill` (`hidden="true"`).
  - `Reset`, `AutoHeight`, `MaxTemplateSize`, `TemplateMaximumWidth`, `SelectionTracksMove` (`hidden="true"` in standard variants).
- **`GroupContainer@1.5.0`**:
  - `DisplayMode` (`hidden="true"`).
  - `OnSelect` (does not exist on `GroupContainer`).
  - When `Variant: ManualLayout`: `LayoutDirection`, `LayoutAlignItems`, `LayoutJustifyContent`, `LayoutGap`, `LayoutOverflowX`, `LayoutOverflowY`, `LayoutWrap`, `LayoutGridColumns`, `LayoutGridRows`, `LayoutGridColumnMinWidth`, `LayoutGridRowMinHeight` are ALL `hidden="true"`!
  - When `Variant: AutoLayout`: `ChildTabPriority`, `LayoutGridColumns`, `LayoutGridRows`, `LayoutGridColumnMinWidth`, `LayoutGridRowMinHeight` are `hidden="true"`.
- **`AddMedia@2.2.1`**:
  - `PaddingTop`, `PaddingBottom`, `PaddingLeft`, `PaddingRight` (does not exist — `AddMedia` only supports single `Padding`!).
  - `PlaceholderText` (`hidden="true"`).
- **`Classic/DropDown@2.3.1`**:
  - `ChevronWidth`, `FlyoutMaximumHeight` (`hidden="true"`).
  - `DefaultSelectedItems` (only on `ComboBox`; `DropDown` uses `Default`).
- **`HtmlViewer@2.1.0`**:
  - `PressedBorderColor` (`hidden="true"`).
- **`Label@2.5.1`**:
  - `IsErrorMessage` (`hidden="true"`).
- **`Screen`**:
  - `X`, `Y`, `Visible`, `PaddingTop`, `PaddingBottom`, `PaddingLeft`, `PaddingRight`.

#### Mechanism D: Output-Only Properties (`direction="out"` in `Templates.json`)
Cannot be assigned in `Properties:` block of a YAML control:
- **`Classic/TextInput@2.3.2`**: `Text` *(Output-only! Use `Default: ="..."` in YAML to set initial text)*.
- **`Gallery@2.15.0`**: `AllItems`, `AllItemsCount`, `Selected`, `VisibleIndex`, `TemplateWidth`, `TemplateHeight`, `HorizontalScrollPosition`, `Valid`.
- **`Classic/DropDown@2.3.1`**: `Selected`, `SelectedText`.
- **`Classic/Button@2.2.0`**: `Pressed`.
- **`AddMedia@2.2.1`**: `Error`, `Media`, `FileName`.
- **`Image@2.2.3`**: `EXIFOrientation`, `OriginalWidth`, `OriginalHeight`, `DisplayedWidth`, `DisplayedHeight`, `OffsetX`, `OffsetY`.
- **`Screen`**: `Size`, `Orientation`, `Printing`.

---

## Layer 3: Schema Version & Round-Trip (`PA3xxx`)

### `PA3001` — `LegacyAsSyntaxDisallowed`
- **Severity**: `error`
- **Root Cause**: Using legacy v1/v2 `As` syntax (e.g., `lblHeader As label:` or `scrHome As screen:`) instead of Schema v3.0 `Control: Type@Version`.

### `PA3002` — `UnsupportedYamlCommentPosition` (`YamlWontRoundTrip`)
- **Severity**: `warning`
- **Root Cause**: Placing YAML `#` comments inside `Properties:` or mid-control where `YamlLexer` cannot round-trip them (`UnsupportedComment`).
- **Hint**: Use Power Fx comments (`// ...` or `/* ... */`) inside a `|-` Block Scalar.

### `PA3003` — `UnpasteableAppRootWarning`
- **Severity**: `info` / `warning` (when validating for Studio Tree View paste)
- **Root Cause**: Power Apps Studio's "Paste code" in Tree View only accepts `Screens:` or control snippets, not the top-level `App:` block (`App.OnStart` and `App.Formulas` must be pasted into their respective Studio formula bars).

---

## Layer 4: Power Fx AST & Grammar (`PFXxxx`)

### `PFX001` — `UnbalancedDelimiters`
- **Severity**: `error`
- **Root Cause**: Unclosed or mismatched parentheses `()`, curly braces `{}`, or square brackets `[]` in a Power Fx expression (outside string literals and comments), reported with exact file line and column.

### `PFX002` — `UnclosedLiteralOrComment`
- **Severity**: `error`
- **Root Cause**: Unclosed string literal (`"...`), unclosed single-quoted identifier (`'...`), or unclosed block comment (`/* ...`).

### `PFX003` — `DoubleSemicolonInYaml`
- **Severity**: `error`
- **Root Cause**: Using regional double semicolon `;;` inside a `.pa.yaml` / `.YAML` file. YAML files must strictly use Invariant Formula syntax (single `;` for statement chaining).

### `PFX004` — `SemicolonInRecordOrTableLiteral`
- **Severity**: `error`
- **Root Cause**: Using a semicolon `;` instead of a comma `,` to separate fields inside a record literal `{ Key1: Val1; Key2: Val2 }` or argument list in an Invariant Formula. When pasted into Polish Studio, Studio converts `;` to `;;` inside the record, corrupting the syntax.

### `PFX005` — `RegionalFormulaDelimiterMismatch` (for `.fx` files)
- **Severity**: `error`
- **Root Cause**: In regional `.fx` files (`App.Formulas.fx`), top-level Named Formula declarations must be separated by `;;` (not single `;`).

### `PFX006` — `LocalizedOrUnknownFunctionName`
- **Severity**: `error`
- **Root Cause**: Using localized Polish/regional function names in YAML (e.g., `Jeżeli`, `Filtruj`, `Wyszukaj`, `Tekst`, `Nawiguj`, `AktualizujKontekst`) instead of canonical English Power Fx function names (`If`, `Filter`, `LookUp`, `Text`, `Navigate`, `UpdateContext`).

### `PFX007` — `EmptyFormulaExpression`
- **Severity**: `warning`
- **Root Cause**: A property has a bare `=` with no expression (`Default: =`). Should either be omitted or set to an explicit blank (`=""` or `=Blank()`).

---

## Layer 5: Studio Runtime & Semantics (`SEMxxx`)

### `SEM001` — `DuplicateGlobalIdentifier` (`DuplicateSymbolError`)
- **Severity**: `error`
- **Root Cause**: Two screens, or two controls (within the same screen or across different screens in the project), share the exact same name. All controls in Power Apps Canvas share a single flat Global Scope.

### `SEM002` — `ReservedControlIdentifier`
- **Severity**: `error`
- **Root Cause**: Naming a screen or control after a reserved Power Fx keyword or object (`App`, `Parent`, `Self`, `ThisItem`, `ThisRecord`, `Screens`, `Properties`, `Children`, `Control`, `Variant`, `true`, `false`, `Blank`).

### `SEM003` — `NavigateInOnVisible`
- **Severity**: `error`
- **Root Cause**: Calling `Navigate(...)` inside a Screen's `OnVisible` property. Disallowed in modern Power Apps Studio; navigation must occur in user actions (`OnSelect`), `Timer.OnTimerEnd`, or `App.StartScreen`.

### `SEM004` — `SelectParentInGroupContainer`
- **Severity**: `error`
- **Root Cause**: Calling `Select(Parent)` on a control whose immediate parent is a `GroupContainer`. Because `GroupContainer` does not have an `OnSelect` property, Power Apps Studio throws: *"Select action on a control that does not have an OnSelect property"*.

### `SEM005` — `UninitializedCollectionClear`
- **Severity**: `warning` / `error`
- **Root Cause**: Calling `Clear(colName)` in `OnVisible` or `OnStart` without initializing `colName`'s record schema via `ClearCollect(colName, ...)` in the app, causing cascading type errors on all `ThisItem.<Field>` references.

### `SEM006` — `ImpureOrConnectorCallInAppFormulas`
- **Severity**: `error`
- **Root Cause**: Using behavioral/side-effect functions (`Set`, `UpdateContext`, `Collect`, `ClearCollect`, `Clear`, `Patch`, `Remove`, `Navigate`, `Notify`, `Reset`) or disallowed connector action calls (like `Office365Users.MyProfileV2()`) inside `App.Formulas`.

### `SEM007` — `SharePointImageValueAccess`
- **Severity**: `error`
- **Root Cause**: Accessing `.Value` on a SharePoint Image column (e.g., `Zdjecie.Value` or `Photo.Value`). SharePoint Image columns expose `.Full`, `.Large`, `.Medium`, `.Small`, or the direct record, never `.Value`.

### `SEM008` — `CoalesceTypeMismatch`
- **Severity**: `error`
- **Root Cause**: Mixing incompatible types in `Coalesce(...)`, such as passing both `ThisItem.Column.Value` (Text) and `ThisItem.Column` (Choice Record) to `Coalesce(ThisItem.TypZgloszenia.Value, ThisItem.TypZgloszenia)`.

### `SEM009` — `CircularPropertyReference`
- **Severity**: `error`
- **Root Cause**: A control property directly references itself (`Height: =Self.Height` or `ctrlName.Width` inside `ctrlName`'s `Width`), or a Gallery's `Items` references `Self.Selected` / `galName.Selected`.

---

## Layer 6: Project Cross-File Rules (`PROJxxx`)

### `PROJ001` — `UndefinedThemeToken`
- **Severity**: `error`
- **Root Cause**: A screen references `fxTheme.<TokenName>` that is not defined in `fx/App.Formulas.fx` or `app/App.YAML`.

### `PROJ002` — `NonDelegableMaxIdPattern`
- **Severity**: `warning`
- **Root Cause**: Using non-delegable `Max(DataSource, ID)` instead of delegable descending sort `First(Sort(DataSource, ID, SortOrder.Descending)).ID`.
