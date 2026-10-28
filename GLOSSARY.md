# Power Apps Canvas YAML Parser

Static validation and structural analysis domain for Microsoft Power Apps Canvas source code (`PaYaml` v3.0) and Power Fx expressions pasted into Power Apps Studio.

## Document Modes

**PaModule Document**:
A complete top-level Power Apps Canvas YAML source file adhering to Schema v3.0, containing one or more root sections (`App`, `Screens`, `ComponentDefinitions`, `DataSources`, `EditorState`).
_Avoid_: Full YAML file, screen file, app file

**Control Snippet**:
A standalone YAML fragment representing a single control definition or an array of control definitions intended for direct copy-pasting into Power Apps Studio's Tree View ("Paste code").
_Avoid_: Partial YAML, fragment, widget snippet

**Formula Script**:
A standalone `.fx` file containing pure Power Fx code (such as `App.Formulas.fx` or `OnStart.fx`) written for direct pasting into the Power Apps Studio formula bar.
_Avoid_: Fx file, raw formula

## YAML & Structural Concepts

**Formula Scalar**:
A YAML scalar value inside a `Properties` map that represents a Power Fx expression and is prefixed with an `=` sign.
_Avoid_: Property string, YAML formula value

**Plain Scalar Hazard**:
An unquoted inline YAML scalar containing flow indicators (`{`, `}`, `[`, `]`) or mapping indicators (`: `) that causes the Power Apps Studio `YamlDotNet` scanner to throw `PA1001: YamlInvalidSyntax`.
_Avoid_: Inline colon bug, unescaped brace error

**Block Scalar**:
A multiline YAML string literal introduced by `|-` or `|` where the `=`-prefixed Power Fx formula starts indented on the following line, neutralizing plain scalar hazards.
_Avoid_: Multiline string, heredoc, pipe syntax

**Global Scope**:
The flat application-wide namespace shared by every screen and control identifier across all screens in a Power Apps Canvas application.
_Avoid_: Screen scope, local control namespace

## Control & Schema Concepts

**Control Template**:
The canonical definition of a Power Apps control type and version (`Control@Version`, e.g., `Classic/Button@2.2.0` or `GroupContainer@1.5.0`), derived from Microsoft's OpenAjax widget manifests (`Templates.json`).
_Avoid_: Control class, widget type, component tag

**Control Variant**:
A sub-type configuration attribute (`Variant`) required by variant-driven controls (such as `GroupContainer` with `AutoLayout`/`ManualLayout` or `Gallery` with layout variants) that unlocks or hides specific properties.
_Avoid_: Control style, layout preset, mode

**Input Property**:
A control property declared with `in` or `inout` direction that is visible in YAML and can be assigned a formula inside a control's `Properties` block.
_Avoid_: Writable attribute, prop

**Output-Only Property**:
A read-only runtime state property declared with `direction="out"` in a control's OpenAjax template (e.g., `Classic/TextInput.Text`, `Gallery.AllItems`, `Gallery.Selected`, `AddMedia.Media`) that can be read by formulas but cannot be assigned in YAML `Properties` (`PA2108`).
_Avoid_: Read-only prop, computed property

**Hidden Property**:
A control property marked `hidden="true"` in the base Control Template or overridden as hidden by the active Control Variant (e.g., `Gallery.Layout`, `GroupContainer.DisplayMode`, or `LayoutDirection` inside a `ManualLayout` container), which triggers `PA2108` if specified in YAML.
_Avoid_: Deprecated property, private property

**Hallucinated Property**:
A non-existent property name frequently invented by AI agents from CSS, React, or Modern PCF conventions (such as `FontSize`, `TextColor`, `BackgroundColor`, `CornerRadius`, `ClearButton`, `VerticalOverflow`, `OnClick`) when targeting Classic Canvas controls.
_Avoid_: Typo property, alias

**Container Child Property**:
A layout property (`AlignInContainer`, `FillPortions`, `LayoutMinWidth`, `LayoutMinHeight`, `LayoutMaxWidth`, `LayoutMaxHeight`) injected onto a control only when its immediate parent is an `AutoLayout` `GroupContainer`.
_Avoid_: Flexbox child prop

## Power Fx Grammar Concepts

**Invariant Formula**:
Power Fx syntax using English function names, comma (`,`) as the argument and record-field separator, single semicolon (`;`) as the statement chaining operator, and period (`.`) as the decimal separator; mandatory inside all YAML files.
_Avoid_: English syntax, US formula

**Regional Formula**:
Power Fx syntax adapted for localized Power Apps Studio formula bars (specifically Polish locale in `.fx` files), where single semicolon (`;`) separates function arguments/record fields and double semicolon (`;;`) chains sequential statements or separates Named Formulas.
_Avoid_: Polish syntax, localized formula

**Named Formula**:
A declarative, reactive, side-effect-free expression bound to a global identifier inside `App.Formulas`.
_Avoid_: Global variable, constant
