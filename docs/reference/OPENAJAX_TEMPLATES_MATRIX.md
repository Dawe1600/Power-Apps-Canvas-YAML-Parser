# OpenAjax Templates & Official Schema Reference (`PA2002`, `PA2108`)

Ten dokument stanowi bezpośrednie źródło prawdy wyekstrahowane z:
1. Wbudowanych schematów JSON w `Microsoft.PowerPlatform.PowerApps.YamlValidator.dll` (`pa.yaml-schema.json`, `control-type-schema.json`, `control-property-schema.json` z Power Platform CLI v2.4.1).
2. Zasobów kompilatora w `Microsoft.PowerPlatform.Formulas.Tools.dll` (`commonStyleProperties.xml`, `DefaultTheme.json`).
3. Rozpakowanych archiwów `.msapp` (`References/Templates.json` — definicje widżetów OpenAjax XML oraz `PcfTemplates`).

Służy jako materiał wejściowy do implementacji słowników w `src/schemas/` (Tickety [#4](https://github.com/Dawe1600/Power-Apps-Canvas-YAML-Parser/issues/4), [#5](https://github.com/Dawe1600/Power-Apps-Canvas-YAML-Parser/issues/5), [#6](https://github.com/Dawe1600/Power-Apps-Canvas-YAML-Parser/issues/6)).

---

## 1. Kanoniczna Lista 116 Typów Kontrolek (`control-type-schema.json` — `PA2002`)

Każda kontrolka w `Control:` używa formatu `<CanonicalType>` lub `<CanonicalType>@<Version>` (wzorzec `^[0-9A-Za-z_/:#\.]*$`). Dodatkowo w PaYaml v3.0 obsługiwany jest `Component` (wymaga `ComponentName`) oraz `CommandComponent`.

```json
[
  "AddMedia",
  "Arrow",
  "Attachments",
  "Audio",
  "BarChart",
  "Barcode",
  "BarcodeScanner",
  "Classic/Button",
  "Camera",
  "Classic/CheckBox",
  "Circle",
  "Classic/ComboBox",
  "DataCard",
  "DataGrid",
  "DataTable",
  "DataTableColumn",
  "Classic/DatePicker",
  "Classic/DropDown",
  "Export",
  "FluidGrid",
  "Form",
  "FormsPro",
  "FormViewer",
  "Gallery",
  "GalleryTemplate",
  "Group",
  "GroupContainer",
  "Hexagon",
  "HtmlViewer",
  "Classic/Icon",
  "Image",
  "Import",
  "PenInput",
  "Label",
  "Legend",
  "LineChart",
  "ListBox",
  "Lookup",
  "Microphone",
  "Octagon",
  "PartialCircle",
  "PDFViewer",
  "Pentagon",
  "PieChart",
  "PowerBI",
  "Classic/Radio",
  "Rating",
  "Rectangle",
  "RichTextEditor",
  "Classic/Slider",
  "Star",
  "Classic/StreamVideo",
  "Classic/TextInput",
  "Timer",
  "Classic/Toggle",
  "Triangle",
  "TypedDataCard",
  "Video",
  "FluentV8/Button",
  "FluentV8/CheckBox",
  "FluentV8/ComboBox",
  "FluentV8/DatePicker",
  "FluentV8/Label",
  "FluentV8/Radio",
  "FluentV8/Rating",
  "FluentV8/Slider",
  "FluentV8/TextBox",
  "FluentV8/Toggle",
  "Badge",
  "Button",
  "CheckBox",
  "ComboBox",
  "DatePicker",
  "DropDown",
  "Header",
  "InfoButton",
  "Link",
  "NumberInput",
  "Progress",
  "Radio",
  "Slider",
  "Spinner",
  "StreamVideo",
  "TabList",
  "Text",
  "TextInput",
  "Toggle",
  "Table",
  "Icon",
  "Avatar",
  "Breadcrumb",
  "SpinButton",
  "Switch",
  "PowerVirtualAgentsChat",
  "IoTDeviceManager",
  "AnnotateInMR",
  "CopilotAnswer",
  "Copilot",
  "Chatbot",
  "BusinessCardReader",
  "BarcodeReader",
  "AddressInput",
  "ViewIn3D",
  "ViewShapeInMR",
  "ViewInMR",
  "TextRecognizer",
  "ReceiptProcessor",
  "ObjectDetector",
  "Map",
  "FormProcessor",
  "MeasureInMR",
  "EntityForm",
  "PcfDataField",
  "SalesNavigatorAccount",
  "SalesNavigatorLead",
  "SpeechControl"
]
```

### Mapowanie aliasów halucynowanych przez modele AI (`PA2002`)
| Halucynowana nazwa `Control:` | Kanoniczny odpowiednik PaYaml v3.0 |
| :--- | :--- |
| `Container`, `HorizontalContainer`, `VerticalContainer` | `GroupContainer@1.5.0` (z `Variant: AutoLayout` lub `ManualLayout`) |
| `TextBox` | `Classic/TextInput@2.3.2` lub `TextInput@0.0.54` |
| `TextCanvas` | `Text@0.0.51` lub `Label@2.5.1` |
| `ButtonCanvas` | `Button@0.0.45` lub `Classic/Button@2.2.0` |
| `Dropdown` (małe `d` w wersji Classic) | `Classic/DropDown@2.3.1` |

---

## 2. Mechanizm `PA2108` w OpenAjax (`Templates.json`)

Właściwość w bloku `Properties:` jest dozwolona przez Power Apps Studio wtedy i tylko wtedy, gdy:
1. Występuje w `<includeProperties>` lub `<properties>` szablonu XML danej kontrolki (lub we właściwościach kontenerowych dziecka z `commonStyleProperties.xml`),
2. **NIE** posiada atrybutu `hidden="true"` w definicji bazowej kontrolki,
3. **NIE** jest nadpisana przez `<overrideProperty name="..." hidden="true" />` w aktywnym wariancie (`<controlVariant>`),
4. **NIE** ma kierunku wyjściowego `direction="out"` (*Output-Only Property*).

---

## 3. Pełny Zrzut Szablonów z `Templates.json` (Kontrolki Pierwszoplanowe)

### 3.1 `Screen` (`screen@1.0`)
- **Dozwolone właściwości wejściowe (`in`)**: `Fill`, `BackgroundImage`, `ImagePosition`, `Height`, `Width`, `LoadingSpinner`, `LoadingSpinnerColor`, `OnVisible`, `OnHidden`, `ContentLanguage`
- **Właściwości wyjściowe (`direction="out"` — zabronione w `Properties:`)**: `Size`, `Orientation`, `Printing`
- **Zabronione (`PA2108`)**: `X`, `Y`, `Visible`, `Padding*`, `Radius*`, `Layout*`

### 3.2 `GroupContainer@1.5.0` (`groupContainer@1.5.0`)
- **Wymagany `Variant` (`PA1011`)**: `AutoLayout` (odpowiada `horizontalAutoLayoutContainer` / `verticalAutoLayoutContainer`), `ManualLayout` (`manualLayoutContainer`)
- **Capabilities**: `supportsNestedControls="true"`, `supportsNestedComponents="true"`, `autoBorders="true"`, `autoFill="true"`, `autoBorderRadius="true"`, `autoDropShadow="true"`, `autoPointerViewState="false"`, `autoDisabledViewState="false"`
- **Wspólne dozwolone właściwości**: `ContentLanguage`, `BorderColor`, `BorderStyle`, `BorderThickness`, `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`, `Fill`, `X`, `Y`, `Width`, `Height`, `Visible`, `EnableChildFocus`, `PaddingTop`, `PaddingRight`, `PaddingBottom`, `PaddingLeft`, `DropShadow`, `AlignInContainer`, `FillPortions`, `LayoutMinWidth`, `LayoutMinHeight`, `LayoutMaxWidth`, `LayoutMaxHeight`
- **Dozwolone tylko w `Variant: AutoLayout`**: `LayoutMode`, `LayoutDirection`, `LayoutAlignItems`, `LayoutJustifyContent`, `LayoutGap`, `LayoutOverflowX`, `LayoutOverflowY`, `LayoutWrap`
- **Ukryte (`hidden="true"` — `PA2108`) w `Variant: AutoLayout`**: `ChildTabPriority`, `LayoutGridColumns`, `LayoutGridRows`, `LayoutGridColumnMinWidth`, `LayoutGridRowMinHeight`
- **Dozwolone tylko w `Variant: ManualLayout`**: `ChildTabPriority`, `LayoutMode`
- **Ukryte (`hidden="true"` — `PA2108`) w `Variant: ManualLayout`**: `LayoutDirection`, `LayoutAlignItems`, `LayoutJustifyContent`, `LayoutGap`, `LayoutOverflowX`, `LayoutOverflowY`, `LayoutWrap`, `LayoutGridColumns`, `LayoutGridRows`, `LayoutGridColumnMinWidth`, `LayoutGridRowMinHeight`
- **Ukryte / nieistniejące na wszystkich wariantach (`PA2108`)**: `DisplayMode`, `OnSelect`, `VerticalOverflow`, `HorizontalOverflow`, `Gap`, `JustifyContent`, `AlignItems`

### 3.3 Właściwości Dziecka Kontenera (`commonStyleProperties.xml`)
- **Dozwolone wejściowe (`in`) na bezpośrednich dzieciach `GroupContainer` (`Variant: AutoLayout`)**: `AlignInContainer`, `FillPortions` (wewnętrznie `GrowthPortions`), `LayoutMinWidth`, `LayoutMinHeight`, `LayoutMaxWidth`, `LayoutMaxHeight`
- **Wyjściowe (`direction="out"` — zabronione w `Properties:` na każdej kontrolce)**: `ActualWidth`, `ActualHeight`, `ActualX`, `ActualY`

### 3.4 `Gallery@2.15.0` (`gallery@2.15.0`)
- **Wymagany `Variant` (`PA1011`)**: np. `BrowseLayout_Vertical_TwoTextOneImageVariant_ver5.0`, `BrowseLayout_Vertical_TwoTextVariant_ver5.0`, `FlexibleHeight`, `galleryVertical`, `galleryHorizontal`, `variableTemplateHeightGallery`, `printableGallery`
- **Capabilities**: `supportsNestedControls="true"`, `replicatesNestedControls="true"`, `autoBorders="true"`, `autoFocusedBorders="true"`, `autoFill="true"`, `autoBorderRadius="false"` (brak!)
- **Dozwolone właściwości wejściowe (`in`)**: `AccessibleLabel`, `ContentLanguage`, `DisplayMode`, `BorderColor`, `BorderThickness`, `BorderStyle`, `FocusedBorderColor`, `FocusedBorderThickness`, `Fill`, `X`, `Y`, `Width`, `Height`, `Visible`, `TabIndex`, `Items`, `Default`, `WrapCount`, `Selectable`, `TemplateSize`, `TemplatePadding`, `TemplateFill`, `Transition`, `ShowNavigation`, `NavigationStep`, `ShowScrollbar`, `DelayItemLoading`, `LoadingSpinner`, `LoadingSpinnerColor`, `OnSelect` (+ właściwości dziecka kontenera: `AlignInContainer`, `FillPortions`, `LayoutMin*`, `LayoutMax*`)
- **Właściwości wyjściowe (`direction="out"` — zabronione w `Properties:`)**: `AllItems`, `AllItemsCount`, `Selected`, `VisibleIndex`, `TemplateWidth`, `TemplateHeight`, `HorizontalScrollPosition`, `Valid`
- **Ukryte / zabronione (`hidden="true"` lub brak `autoBorderRadius` — `PA2108`)**:
  - `Layout` (orientacja jest sterowana przez `Variant`)
  - `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`
  - `DisabledBorderColor`, `PressedBorderColor`, `HoverBorderColor`, `DisabledFill`, `PressedFill`, `HoverFill`
  - `TemplateMaximumWidth`, `MaxTemplateSize` (chyba że wariant `variableTemplateHeightGallery`), `SelectionTracksMove`, `Reset`, `AutoHeight` (chyba że wariant `printableGallery`)

### 3.5 `Label@2.5.1` (`label@2.5.1`)
- **Capabilities**: `autoBorders="true"`, `autoFill="true"`, `autoFocusedBorders="true"`, `autoPointerViewState="true"`, `autoDisabledViewState="true"`, `autoBorderRadius="false"` (brak!)
- **Dozwolone właściwości wejściowe (`in`)**: `Text`, `Tooltip`, `Role`, `ContentLanguage`, `Color`, `DisabledColor`, `PressedColor`, `HoverColor`, `BorderColor`, `DisabledBorderColor`, `PressedBorderColor`, `HoverBorderColor`, `BorderStyle`, `BorderThickness`, `FocusedBorderColor`, `FocusedBorderThickness`, `Fill`, `DisabledFill`, `PressedFill`, `HoverFill`, `Font`, `Size`, `FontWeight`, `Italic`, `Underline`, `Strikethrough`, `PaddingTop`, `PaddingRight`, `PaddingBottom`, `PaddingLeft`, `Align`, `VerticalAlign`, `X`, `Y`, `Width`, `Height`, `Visible`, `DisplayMode`, `TabIndex`, `OnSelect`, `Live`, `LineHeight`, `Overflow`, `AutoHeight`, `Wrap`, `AccessibleLabel` (+ właściwości dziecka kontenera)
- **Ukryte / zabronione (`PA2108`)**:
  - `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight` (brak `autoBorderRadius`)
  - `IsErrorMessage` (`hidden="true"`)
  - `FontSize` (użyj `Size`), `FontColor` / `TextColor` (użyj `Color`)

### 3.6 `Classic/Button@2.2.0` (`button@2.2.0`)
- **Capabilities**: `autoBorders="true"`, `autoFocusedBorders="true"`, `autoFill="true"`, `autoPointerViewState="true"`, `autoDisabledViewState="true"`, `autoBorderRadius="true"`
- **Dozwolone właściwości wejściowe (`in`)**: `OnSelect`, `AutoDisableOnSelect`, `Text`, `Tooltip`, `AccessibleLabel`, `ContentLanguage`, `BorderColor`, `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`, `DisabledBorderColor`, `PressedBorderColor`, `HoverBorderColor`, `BorderStyle`, `BorderThickness`, `FocusedBorderColor`, `FocusedBorderThickness`, `Color`, `DisabledColor`, `PressedColor`, `HoverColor`, `DisplayMode`, `Fill`, `DisabledFill`, `PressedFill`, `HoverFill`, `Font`, `Size`, `FontWeight`, `Italic`, `Underline`, `Strikethrough`, `Align`, `VerticalAlign`, `PaddingTop`, `PaddingRight`, `PaddingBottom`, `PaddingLeft`, `Visible`, `X`, `Y`, `Width`, `Height`, `TabIndex` (+ właściwości dziecka kontenera)
- **Właściwości wyjściowe (`direction="out"` — zabronione w `Properties:`)**: `Pressed`
- **Zabronione (`PA2108`)**: `Appearance`, `FontSize`, `FontColor`, `BasePaletteColor` (należą do Modern `Button@0.0.45`)

### 3.7 `Button@0.0.45` (Modern PCF `PowerApps_CoreControls_ButtonCanvas@0.0.45`)
- **Dozwolone właściwości wejściowe (`in`)**: `AcceptsFocus`, `AccessibleLabel`, `Appearance`, `Text`, `Icon`, `Layout`, `IconRotation`, `IconStyle`, `Font`, `FontSize`, `FontWeight`, `FontItalic`, `FontUnderline`, `FontStrikethrough`, `BorderStyle`, `BorderThickness`, `BorderColor`, `BorderRadiusTopLeft`, `BorderRadiusTopRight`, `BorderRadiusBottomLeft`, `BorderRadiusBottomRight`, `Align`, `VerticalAlign`, `ContentLanguage`, `BasePaletteColor`, `FontColor`, `TabIndex`, `Tooltip`, `X`, `Y`, `Width`, `Height`, `Visible`, `DisplayMode`, `OnSelect` (+ właściwości dziecka kontenera)
- **Zabronione (`PA2108`)**: `Size`, `Color`, `Fill`, `HoverFill`, `PressedFill`, `DisabledFill`, `HoverColor`, `PressedColor`, `DisabledColor`, `HoverBorderColor`, `PressedBorderColor`, `DisabledBorderColor`, `FocusedBorderColor`, `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`, `Italic`, `Underline`, `Strikethrough`, `OnChange`

### 3.8 `Classic/TextInput@2.3.2` (`text@2.3.2`)
- **Capabilities**: `autoBorders="true"`, `autoFocusedBorders="true"`, `autoFill="true"`, `autoPointerViewState="true"`, `autoDisabledViewState="true"`, `autoBorderRadius="true"`
- **Dozwolone właściwości wejściowe (`in`)**: `Default`, `Mode`, `Format`, `VirtualKeyboardMode`, `Clear`, `EnableSpellCheck`, `Reset`, `LineHeight`, `HintText`, `MaxLength`, `DelayOutput`, `AccessibleLabel`, `Tooltip`, `ContentLanguage`, `BorderColor`, `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`, `DisabledBorderColor`, `PressedBorderColor`, `HoverBorderColor`, `BorderStyle`, `BorderThickness`, `FocusedBorderColor`, `FocusedBorderThickness`, `Color`, `DisabledColor`, `PressedColor`, `HoverColor`, `Fill`, `DisabledFill`, `PressedFill`, `HoverFill`, `Font`, `Size`, `FontWeight`, `Italic`, `Underline`, `Strikethrough`, `Align`, `PaddingTop`, `PaddingRight`, `PaddingBottom`, `PaddingLeft`, `X`, `Y`, `Width`, `Height`, `Visible`, `DisplayMode`, `TabIndex`, `OnChange`, `OnSelect` (+ właściwości dziecka kontenera)
- **Właściwości wyjściowe (`direction="out"` — zabronione w `Properties:`)**: `Text` (w YAML wartość początkową ustawia się wyłącznie przez `Default`)
- **Zabronione (`PA2108`)**: `ClearButton` (w XML właściwość nazywa się `Clear`), `Placeholder` (użyj `HintText`)

### 3.9 `Classic/DropDown@2.3.1` (`dropdown@2.3.1`)
- **Capabilities**: `autoBorders="true"`, `autoFocusedBorders="true"`, `autoDisabledViewState="true"`, `autoPointerViewState="true"`, `autoBorderRadius="false"` (brak!)
- **Dozwolone właściwości wejściowe (`in`)**: `Items`, `Default`, `Reset`, `AllowEmptySelection`, `SelectionColor`, `SelectionFill`, `ChevronFill`, `ChevronHoverFill`, `ChevronDisabledFill`, `ChevronBackground`, `ChevronHoverBackground`, `ChevronDisabledBackground`, `AccessibleLabel`, `Tooltip`, `ContentLanguage`, `Color`, `HoverColor`, `PressedColor`, `DisabledColor`, `BorderColor`, `DisabledBorderColor`, `HoverBorderColor`, `PressedBorderColor`, `BorderStyle`, `BorderThickness`, `FocusedBorderColor`, `FocusedBorderThickness`, `Fill`, `DisabledFill`, `PressedFill`, `HoverFill`, `Font`, `Size`, `FontWeight`, `Italic`, `Underline`, `Strikethrough`, `PaddingTop`, `PaddingRight`, `PaddingBottom`, `PaddingLeft`, `X`, `Y`, `Width`, `Height`, `Visible`, `TabIndex`, `DisplayMode`, `OnSelect`, `OnChange` (+ właściwości dziecka kontenera)
- **Właściwości wyjściowe (`direction="out"` — zabronione w `Properties:`)**: `Selected`, `SelectedText`
- **Ukryte / zabronione (`PA2108`)**:
  - `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight` (brak `autoBorderRadius`)
  - `ChevronWidth`, `FlyoutMaximumHeight` (`hidden="true"`)
  - `DefaultSelectedItems` (należy do `ComboBox`, w `DropDown` użyj `Default`)

### 3.10 `Classic/Icon@2.5.0` (`icon@2.5.0`)
- **Capabilities**: `autoBorderRadius="false"` (brak!)
- **Dozwolone właściwości wejściowe (`in`)**: `Icon`, `Rotation`, `AccessibleLabel`, `Tooltip`, `ContentLanguage`, `AutoDisableOnSelect`, `Color`, `DisabledColor`, `PressedColor`, `HoverColor`, `Fill`, `DisabledFill`, `PressedFill`, `HoverFill`, `Visible`, `DisplayMode`, `X`, `Y`, `Width`, `Height`, `PaddingTop`, `PaddingRight`, `PaddingBottom`, `PaddingLeft`, `TabIndex`, `BorderStyle`, `BorderColor`, `DisabledBorderColor`, `PressedBorderColor`, `HoverBorderColor`, `BorderThickness`, `FocusedBorderColor`, `FocusedBorderThickness`, `OnSelect`, `PreserveAspectRatio` (+ właściwości dziecka kontenera)
- **Zabronione (`PA2108`)**: `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`, `Size`

### 3.11 `Image@2.2.3` (`image@2.2.3`)
- **Capabilities**: `autoBorders="true"`, `autoFocusedBorders="true"`, `autoPointerViewState="true"`, `autoDisabledViewState="true"`, `autoBorderRadius="true"`
- **Dozwolone właściwości wejściowe (`in`)**: `Image`, `Transparency`, `ImagePosition`, `CalculateOriginalDimensions`, `ImageRotation`, `FlipHorizontal`, `FlipVertical`, `ApplyEXIFOrientation`, `AccessibleLabel`, `Tooltip`, `ContentLanguage`, `AutoDisableOnSelect`, `X`, `Y`, `Width`, `Height`, `Visible`, `Fill`, `DisabledFill`, `PressedFill`, `HoverFill`, `BorderColor`, `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`, `DisabledBorderColor`, `PressedBorderColor`, `HoverBorderColor`, `BorderThickness`, `FocusedBorderColor`, `FocusedBorderThickness`, `BorderStyle`, `PaddingTop`, `PaddingRight`, `PaddingBottom`, `PaddingLeft`, `DisplayMode`, `TabIndex`, `OnSelect` (+ właściwości dziecka kontenera)
- **Właściwości wyjściowe (`direction="out"` — zabronione w `Properties:`)**: `EXIFOrientation`, `OriginalWidth`, `OriginalHeight`, `DisplayedWidth`, `DisplayedHeight`, `OffsetX`, `OffsetY`

### 3.12 `AddMedia@2.2.1` (`addMedia@2.2.1`)
- **Capabilities**: `autoBorders="true"`, `autoFill="false"`, `autoFocusedBorders="true"`, `autoPointerViewState="true"`, `autoDisabledViewState="true"`, `autoBorderRadius="false"` (brak!)
- **Dozwolone właściwości wejściowe (`in`)**: `UseMobileCamera`, `ChangePictureText`, `Reset`, `Text`, `AccessibleLabel`, `Tooltip`, `ContentLanguage`, `BorderColor`, `DisabledBorderColor`, `PressedBorderColor`, `HoverBorderColor`, `BorderStyle`, `BorderThickness`, `FocusedBorderColor`, `FocusedBorderThickness`, `Color`, `DisabledColor`, `PressedColor`, `HoverColor`, `DisplayMode`, `Fill`, `DisabledFill`, `PressedFill`, `HoverFill`, `Font`, `Size`, `FontWeight`, `Italic`, `Underline`, `Strikethrough`, `Align`, `VerticalAlign`, `Padding`, `Visible`, `X`, `Y`, `Width`, `Height`, `TabIndex`, `OnSelect`, `OnChange` (+ właściwości dziecka kontenera)
- **Właściwości wyjściowe (`direction="out"` — zabronione w `Properties:`)**: `Error`, `Media`, `FileName`
- **Ukryte / zabronione (`PA2108`)**:
  - `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight` (brak `autoBorderRadius`)
  - `PaddingTop`, `PaddingBottom`, `PaddingLeft`, `PaddingRight` (`AddMedia` przyjmuje wyłącznie pojedyncze `Padding`)
  - `PlaceholderText` (`hidden="true"`)

### 3.13 `HtmlViewer@2.1.0` (`htmlViewer@2.1.0`)
- **Capabilities**: `autoBorderRadius="false"` (brak!)
- **Dozwolone właściwości wejściowe (`in`)**: `HtmlText`, `AutoHeight`, `Tooltip`, `ContentLanguage`, `DisplayMode`, `DisabledFill`, `Font`, `Color`, `Size`, `Fill`, `BorderColor`, `DisabledBorderColor`, `HoverBorderColor`, `BorderStyle`, `BorderThickness`, `Visible`, `Width`, `Height`, `PaddingTop`, `PaddingRight`, `PaddingBottom`, `PaddingLeft`, `X`, `Y`, `OnSelect` (+ właściwości dziecka kontenera)
- **Ukryte / zabronione (`PA2108`)**: `PressedBorderColor` (`hidden="true"`), `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`

### 3.14 `Rectangle@2.3.0` (`rectangle@2.3.0`)
- **Capabilities**: `autoBorderRadius="false"` (brak!)
- **Dozwolone właściwości wejściowe (`in`)**: `AccessibleLabel`, `Tooltip`, `ContentLanguage`, `Fill`, `DisabledFill`, `PressedFill`, `HoverFill`, `BorderColor`, `BorderStyle`, `BorderThickness`, `FocusedBorderColor`, `FocusedBorderThickness`, `Visible`, `DisplayMode`, `TabIndex`, `X`, `Y`, `Width`, `Height`, `OnSelect`, `PreserveAspectRatio` (+ właściwości dziecka kontenera)
- **Zabronione (`PA2108`)**: `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`

---

## 4. Fallback (`control-property-schema.json`) dla Rzadkich Kontrolek

Dla kontrolek spoza powyższej listy pierwszoplanowej (np. `Timer`, `PenInput`, `PDFViewer`, `RichTextEditor`, `Classic/ComboBox`, `Classic/DatePicker`, `Classic/CheckBox`, `Classic/Toggle`, `Classic/Radio`, `Classic/Slider`) dozwolona jest unia właściwości z `control-property-schema.json` powiększona o typowe właściwości danych (`Items`, `DefaultSelectedItems`, `SelectedDate`, `Duration`, `Repeat`, `AutoStart`, `AutoPause`, `OnTimerEnd`, `OnTimerStart`, `OnCheck`, `OnUncheck`, `TrueText`, `FalseText`, `Min`, `Max`, `Document`), z zachowaniem globalnej blokady dla `Hallucinated Property` (np. `BackgroundColor`, `BorderRadius`, `TextColor`, `Gap`, `ZIndex`, `ClearButton`, `VerticalOverflow`, `HorizontalOverflow`).
