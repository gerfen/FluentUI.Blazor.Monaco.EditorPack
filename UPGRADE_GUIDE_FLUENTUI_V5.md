# Upgrade Guide: Fluent UI Blazor v4 → v5

This version of **FluentUI.Blazor.Monaco.EditorPack** is built on **Microsoft.FluentUI.AspNetCore.Components 5.x**. Fluent UI Blazor v5 contains breaking changes, so the host application must be upgraded to v5 as well. The editor APIs (`MonacoMarkdownEditor`, `MonacoCssEditor`, `MonacoOptions`, ...) are unchanged; the changes below are about the Fluent UI dependency and the app setup around it.

For the complete list of Fluent UI changes, see the official Fluent UI Blazor v5 migration documentation (<https://www.fluentui-blazor.net/>).

---

## Table of Contents

1. [Package references](#1-package-references)
2. [Styles and scripts](#2-styles-and-scripts)
3. [Theming](#3-theming)
4. [FluentProviders](#4-fluentproviders)
5. [Component changes you are likely to hit](#5-component-changes-you-are-likely-to-hit)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Package references

Update the Fluent UI packages to 5.0.0 or later:

```xml
<PackageReference Include="Microsoft.FluentUI.AspNetCore.Components" Version="5.0.0" />
<PackageReference Include="Microsoft.FluentUI.AspNetCore.Components.Icons" Version="5.0.0" />
```

Registration in `Program.cs` is unchanged:

```csharp
builder.Services.AddFluentUIComponents();
builder.Services.AddMonacoEditorPack();
```

---

## 2. Styles and scripts

Remove the v4 `reboot.css` link and the `loading-theme.js` script, and reference the v5 bundle and module instead.

**Before (v4)**

```html
<link href="/_content/Microsoft.FluentUI.AspNetCore.Components/css/reboot.css" rel="stylesheet" />
<script src="_content/Microsoft.FluentUI.AspNetCore.Components/js/loading-theme.js"></script>
...
<FluentDesignTheme StorageName="theme" />
<loading-theme storage-name="theme" random-color="true"></loading-theme>
```

**After (v5)**

```html
<link href="_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.bundle.scp.css" rel="stylesheet" />
<script src="_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.lib.module.js" type="module" async></script>
```

The Monaco scripts (`loader.js`, `monaco-editor-pack.js`) are unchanged.

---

## 3. Theming

`FluentDesignTheme` and `<loading-theme>` are gone. Use `IThemeService` instead:

| Task | v5 API |
|---|---|
| Set mode | `SetThemeAsync(ThemeMode.Dark)` |
| Set mode and variant | `SetThemeAsync(ThemeColorVariant.Default, ThemeMode.System)` |
| Set brand color | `SetThemeAsync(new ThemeSettings(color, hueTorsion, vibrancy, mode, isExact))` |
| Read current settings | `GetThemeSettingsAsync()` |
| Is dark? | `IsDarkModeAsync()` |
| Clear stored settings | `ClearStoredThemeSettingsAsync()` |

`ThemeMode` is `Light`, `Dark` or `System`.

**Set mode and color together.** Calling `SetThemeAsync(ThemeMode)` followed by `SetThemeAsync(string color, bool isExact)` can leave a stored `theme` entry without a valid `mode`. The next `GetThemeSettingsAsync()` call then fails with:

```
JSException: The JSON value could not be converted to Microsoft.FluentUI.AspNetCore.Components.ThemeSettings. Path: $.mode
```

Use the `ThemeSettings` overload so mode and color are stored together.

**Stale `theme` data.** Browsers that ran a v4 build (or an earlier v5 build) may hold a `theme` entry in `localStorage` in an older shape. Wrap the first read in a `try/catch` and clear the entry if it cannot be read:

```csharp
ThemeSettings? settings = null;
try
{
	settings = await themeService.GetThemeSettingsAsync();
}
catch (JSException)
{
	await themeService.ClearStoredThemeSettingsAsync();
}
```

**Pre-render theme script.** If you set `data-theme` / `color-scheme` from an inline script before Blazor starts, read the `theme` entry defensively (as in the demo `App.razor`) and fall back to `prefers-color-scheme`.

---

## 4. FluentProviders

Add `<FluentProviders />` once, at the end of your main layout. It replaces the v4 `FluentToastProvider`, `FluentDialogProvider`, `FluentTooltipProvider`, `FluentMessageBarProvider`, and similar components, and supplies the cascading values all v5 components need.

```razor
@inherits LayoutComponentBase

@Body
<FluentProviders />
```

Fluent UI v5 requires an interactive render mode. Make sure components that open dialogs, menus or tooltips run interactively.

---

## 5. Component changes you are likely to hit

| v4 | v5 |
|---|---|
| `FluentTextField` | `FluentTextInput` |
| `FluentValidationMessage<T>` | Removed. Use `Message`, `MessageCondition`, `MessageState` on the input |
| `::deep` selectors targeting Fluent components | No longer needed. Scoped CSS bundling is disabled for Fluent components |
| Custom components inheriting `FluentComponentBase` | Must pass `LibraryConfiguration` to the base constructor |

### `FluentRadio` and `FluentRadioGroup` generic types

`FluentRadio` must have the same type as its `FluentRadioGroup`. A string literal such as `Value="true"` is inferred as `string`, so inside a `bool?` group it throws:

```
InvalidOperationException: The FluentRadio must be included in a FluentRadioGroup component and must be of the same type.
```

and the Blazor Server circuit is terminated. Set the type explicitly:

```razor
<FluentRadioGroup TValue="bool?" @bind-Value="@Content.AcceptAnalytics">
	<FluentRadio TValue="bool?" Value="@((bool?)true)">Accept</FluentRadio>
	<FluentRadio TValue="bool?" Value="@((bool?)false)">Reject</FluentRadio>
</FluentRadioGroup>
```

Use a distinct `Name` for each group on the same page.

### Rendering raw HTML

If you hold HTML in a nullable `MarkupString?`, Razor HTML-encodes it. Render `.Value` instead:

```razor
@if (html.HasValue)
{
	@html.Value
}
```

For the full list (60 component-specific guides), see the Fluent UI Blazor v5 migration documentation.

---

## 6. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `JSException ... ThemeSettings ... Path: $.mode` on load | Stale or color-only `theme` entry in `localStorage`. Clear it and use the `ThemeSettings` overload (section 3) |
| Circuit dies when a dialog opens | A `FluentRadio` / `FluentRadioGroup` type mismatch (section 5) |
| Components render unstyled or collapsed | Missing v5 CSS bundle or `lib.module.js` (section 2), or missing `FluentProviders` (section 4) |
| Dialogs, toasts or tooltips never appear | Missing `<FluentProviders />`, or static rendering instead of an interactive render mode |
| Raw `<div ...>` markup appears as text | Nullable `MarkupString?` rendered directly (section 5) |
