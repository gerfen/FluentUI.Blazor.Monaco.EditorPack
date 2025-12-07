# FluentUI Blazor Monaco Editor Pack - Setup Guide

## Table of Contents
1. [Known Issues](#known-issues)
2. [Installation](#installation)
3. [Basic Setup](#basic-setup)
4. [Theme Configuration](#theme-configuration)
5. [Color Swatch Updates](#color-swatch-updates)
6. [Troubleshooting](#troubleshooting)

---

## Known Issues

### FluentUI Web Components Stack Overflow Bug

**Issue:** FluentUI Blazor 4.13.x ships with FluentUI Web Components 2.6.8, which contains a critical bug in the `colorContrast` algorithm that causes infinite recursion and stack overflow errors.

**GitHub Issue:** https://github.com/microsoft/fluentui-blazor/issues/4244

**Symptoms:**
```javascript
Uncaught RangeError: Maximum call stack size exceeded
    at gr (web-components.js:18348:10)
    at gr (web-components.js:18355:57)
    at i.colorContrast (web-components.js:18440:12)
    at Ci (web-components.js:18787:52)
```

**Root Cause:**
The bug is triggered by certain FluentUI components (particularly `FluentCard`, `FluentAccordion`, and nested design system providers) that cause circular dependency chains in the color contrast calculation.

**Status:**
- [FIXED] **Fixed** in FluentUI Web Components 2.6.9+
- [PENDING] **Will be resolved** in FluentUI Blazor 4.14+ (expected release)
- [!] **Workaround required** for FluentUI Blazor 4.13.x

**Workarounds:**
1. **Minimize FluentCard usage** - Replace with styled `<div>` elements where possible
2. **Single FluentDesignTheme** - Only use one `FluentDesignTheme` per application
3. **Avoid nested theme providers** - Don't nest multiple `FluentDesignTheme` components

---

## Installation

### NuGet Package

```bash
dotnet add package FluentUI.Blazor.Monaco.EditorPack
```

### Service Registration

In `Program.cs`:

```csharp
using FluentUI.Blazor.Monaco.EditorPack;

var builder = WebApplication.CreateBuilder(args);

// Add Monaco Editor Pack services
builder.Services.AddMonacoEditorPack();

// Add FluentUI services
builder.Services.AddFluentUIComponents();

var app = builder.Build();
```

---

## Basic Setup

### 1. App.razor Configuration

Configure your `App.razor` to include required scripts and the global `FluentDesignTheme`:

```razor
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/" />
    
    <!-- FluentUI Styles -->
    <link rel="stylesheet" href="@Assets["app.css"]" />
    <link rel="stylesheet" href="_content/FluentUI.Blazor.Monaco.EditorPack/css/markdownPreview.css" />
    
    <!-- FluentUI Blazor Components -->
    <script src="_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.lib.module.js" type="module" async></script>
    <script src="_content/Microsoft.FluentUI.AspNetCore.Components/js/loading-theme.js" type="text/javascript"></script>
   
    <HeadOutlet @rendermode="new InteractiveServerRenderMode(prerender: true)" />
</head>

<body>
    <!-- IMPORTANT: Single FluentDesignTheme in App.razor -->
    <FluentDesignTheme StorageName="theme" />
    <loading-theme storage-name="theme" random-color="true"></loading-theme>
    
    <Routes @rendermode="new InteractiveServerRenderMode(prerender: true)" />
   
    <script src="_framework/blazor.web.js"></script>
    
    <!-- Monaco Editor Package - Required Scripts (Simplified) -->
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/loader.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monaco-editor-pack.js"></script>
</body>
</html>
```

**Key Points:**
- [OK] Place `FluentDesignTheme` in `App.razor` (global scope)
- [OK] Use `StorageName="theme"` to persist user preferences
- [!] **DO NOT** add additional `FluentDesignTheme` components in other layouts or components
- [OK] **Simplified script loading** - Just 2 scripts instead of 7!

**Alternative: Individual Script Loading**
If you need fine-grained control, you can still load scripts individually:

```html
<!-- Monaco Editor Package - Individual Scripts -->
<script src="_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/loader.js"></script>
<script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/fluentUIDesignTokens.js"></script>
<script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/cssClassHarvester.js"></script>
<script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monacoCssEditorTheme.js"></script>
<script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monacoCssEditor.js"></script>
<script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monacoMarkdownEditor.js"></script>
<script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monacoMarkdownToolbar.js"></script>
```

### 2. MainLayout.razor

Your `MainLayout.razor` should **NOT** contain a `FluentDesignTheme` component:

```razor
@inherits LayoutComponentBase

<FluentLayout>
    <FluentHeader Fixed="true">
        <FluentSpacer/>
        <SiteSettings/>
    </FluentHeader>
    <FluentBodyContent Class="body-content">
        @Body
        <FluentToastProvider MaxToastCount="10"/>
        <FluentDialogProvider/>
        <FluentTooltipProvider/>
        <FluentKeyCodeProvider/>
        <FluentMenuProvider/>
    </FluentBodyContent>
</FluentLayout>
```

**Key Points:**
- [!] **DO NOT** add `FluentDesignTheme` here (it's already in App.razor)
- [OK] Add FluentUI providers (Toast, Dialog, etc.)

### 3. Using Monaco Editors

#### Markdown Editor

```razor
<MonacoMarkdownEditor @ref="markdownEditor"
                      Markdown="@markdownContent"
                      MarkdownChanged="@OnMarkdownChanged"
                      ExternalCss="@aggregatedCss"
                      Id="my-markdown-editor">
    <LeftContent>
        <FluentLabel>Markdown Editor</FluentLabel>
    </LeftContent>
    <RightContent>
        <FluentButton OnClick="SaveMarkdown">Save</FluentButton>
    </RightContent>
</MonacoMarkdownEditor>

@code {
    private MonacoMarkdownEditor? markdownEditor;
    private string markdownContent = "# Hello World";
    
    private async Task OnMarkdownChanged(string newContent)
    {
        markdownContent = newContent;
        await Task.CompletedTask;
    }
    
    private void SaveMarkdown()
    {
        markdownEditor?.Commit();
    }
}
```

#### CSS Editor

```razor
<MonacoCssEditor @ref="cssEditor"
                 Css="@cssContent"
                 CssChanged="@OnCssChanged"
                 Placeholder="/* Enter CSS here... */" />

@code {
    private MonacoCssEditor? cssEditor;
    private string cssContent = ".my-class { color: var(--accent-fill-rest); }";
    
    private async Task OnCssChanged(string newContent)
    {
        cssContent = newContent;
        await Task.CompletedTask;
    }
}
```

---

## Theme Configuration

### Settings Panel with Theme Customization

To allow users to change themes and colors, create a settings panel component:

#### SiteSettingsPanel.razor

```razor
@implements IDialogContentComponent

<div>
    <!-- IMPORTANT: Reference to the global theme instance -->
    <FluentDesignTheme @ref="_theme"
                       @bind-Mode="@Mode"
                       @bind-OfficeColor="@OfficeColor"
                       @bind-NeutralBaseColor="@NeutralColor"
                       Direction="@Direction"
                       StorageName="theme" />

    <FluentStack Orientation="Orientation.Vertical" VerticalGap="5">
        <!-- Theme Mode Selector -->
        <FluentSelect Label="Theme"
                      Width="100%"
                      Items="@AllModes"
                      @bind-SelectedOption="@Mode" />

        <!-- Color Selector with Change Handler -->
        <FluentSelect Label="Color"
                      Width="100%"
                      Items="@(OfficeColorUtilities.AllColors.Cast<OfficeColor?>())"
                      Height="200px"
                      SelectedOption="@OfficeColor"
                      SelectedOptionChanged="@OnColorChangedAsync">
            <OptionTemplate>
                <FluentStack>
                    <FluentIcon Value="@(new Icons.Filled.Size20.RectangleLandscape())"
                                Color="Color.Custom"
                                CustomColor="@GetCustomColor(@context)" />
                    <FluentLabel>@context</FluentLabel>
                </FluentStack>
            </OptionTemplate>
        </FluentSelect>
    </FluentStack>
</div>
```

#### SiteSettingsPanel.razor.cs

```csharp
using Microsoft.AspNetCore.Components;
using Microsoft.FluentUI.AspNetCore.Components;
using Microsoft.JSInterop;

public partial class SiteSettingsPanel
{
    private FluentDesignTheme? _theme;

    [Inject] public required IJSRuntime JSRuntime { get; set; }
    [Inject] public required ILogger<SiteSettingsPanel> Logger { get; set; }

    public DesignThemeModes Mode { get; set; }
    public OfficeColor? OfficeColor { get; set; }
    public string? NeutralColor { get; set; }
    public LocalizationDirection? Direction { get; set; }

    private static IEnumerable<DesignThemeModes> AllModes => 
        Enum.GetValues<DesignThemeModes>();

    private static string? GetCustomColor(OfficeColor? color)
    {
        return color switch
        {
            null => OfficeColorUtilities.GetRandom(true).ToAttributeValue(),
            OfficeColor.Default => "#036ac4",
            _ => color.ToAttributeValue(),
        };
    }

    // IMPORTANT: This method refreshes Monaco editors when colors change
    private async Task OnColorChangedAsync(OfficeColor? newColor)
    {
        // Update the bound property
        OfficeColor = newColor;
        
        // Give FluentDesignTheme time to apply the new color
        await Task.Delay(100);

        try
        {
            // Trigger Monaco Markdown editor theme refresh
            await JSRuntime.InvokeVoidAsync(
                "monacoMarkdownEditor.refreshAllEditorThemes");
            Logger.LogInformation(
                "Monaco Markdown editor themes refreshed after color change");
            
            // Trigger Monaco CSS editor theme refresh
            await JSRuntime.InvokeVoidAsync(
                "monacoCssEditor.refreshAllEditorThemes");
            Logger.LogInformation(
                "Monaco CSS editor themes refreshed after color change");
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to refresh Monaco editor themes");
        }
    }
}
```

**Key Points:**
- [OK] Use `@ref="_theme"` to reference the global theme instance
- [OK] Bind to `@bind-Mode`, `@bind-OfficeColor`, and `@bind-NeutralBaseColor`
- [OK] Use `SelectedOptionChanged` event (not `@bind-SelectedOption`) for color changes
- [OK] Call `refreshAllEditorThemes()` to update Monaco editor color swatches

---

## Color Swatch Updates

### How Color Swatches Work

Monaco editors display color swatches for:
1. **Markdown Editor:** CSS classes with color properties (e.g., `{.highlight}` where `.highlight` has a color)
2. **CSS Editor:** CSS variables and color values (e.g., `var(--accent-fill-rest)`, `#ff0000`)

### Automatic Theme Updates

The Monaco editors automatically detect FluentUI theme changes through MutationObservers:

```javascript
// Automatically watches for theme changes in the DOM
const themeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-theme' || 
             mutation.attributeName === 'class')) {
            // Refresh all Monaco editors
            monacoMarkdownEditor.editors.forEach((state, containerId) => {
                monacoMarkdownEditor.updateTheme(containerId);
            });
        }
    }
});
```

### Manual Refresh (for Color Changes)

When users change the accent color in the settings panel, you must manually refresh the editors:

```csharp
// In your color change handler
await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.refreshAllEditorThemes");
await JSRuntime.InvokeVoidAsync("monacoCssEditor.refreshAllEditorThemes");
```

**Why?** Changing the accent color updates CSS design tokens but doesn't trigger a DOM mutation on `data-theme` or `class` attributes.

### Refresh Mechanism

The refresh process:
1. **Refreshes FluentUI design tokens** - Re-harvests CSS custom properties from DOM
2. **Redefines Monaco themes** - Updates theme colors based on new design tokens
3. **Recreates editor models** - Forces Monaco to re-evaluate all color providers
4. **Restores cursor position** - Maintains user's editing position

---

## Troubleshooting

### Stack Overflow Errors

**Symptom:** Console shows "Maximum call stack size exceeded" errors

**Solution:**
1. Remove all `FluentCard` components - replace with styled `<div>` elements:
   ```razor
   <!-- Instead of: -->
   <FluentCard>
       <p>Content</p>
   </FluentCard>
   
   <!-- Use: -->
   <div style="background: var(--neutral-layer-1); padding: 16px; border-radius: 4px;">
       <p>Content</p>
   </div>
   ```

2. Ensure only ONE `FluentDesignTheme` exists in your app (in `App.razor`)

3. Remove any nested theme providers

### Color Swatches Not Updating

**Symptom:** Monaco editor color swatches don't update when changing theme colors

**Solution:**
1. Ensure you're calling `refreshAllEditorThemes()` after color changes:
   ```csharp
   await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.refreshAllEditorThemes");
   await JSRuntime.InvokeVoidAsync("monacoCssEditor.refreshAllEditorThemes");
   ```

2. Add a small delay (100ms) before refreshing to allow FluentDesignTheme to apply changes:
   ```csharp
   await Task.Delay(100);
   await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.refreshAllEditorThemes");
   ```

3. Check browser console for JavaScript errors

### Monaco Editor Not Loading

**Symptom:** Editor container is empty or shows errors

**Solution:**
1. Verify all required scripts are included in `App.razor`:
   ```html
   <script src="_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/loader.js"></script>
   <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monaco-editor-pack.js"></script>
   ```

2. Check that `AddMonacoEditorPack()` is called in `Program.cs`

3. Clear browser cache and rebuild solution

### CSS IntelliSense Not Working

**Symptom:** No auto-completion for FluentUI design tokens

**Solution:**
1. Design tokens are harvested on-demand when Monaco initializes
2. Check browser console for token harvest logs:
   ```
   [FluentUI Tokens] Harvested X tokens from Y sources
   ```
3. If tokens aren't harvesting, ensure `FluentDesignTheme` is present in `App.razor`

### Web Workers Error

**Symptom:** Console shows "Could not create web worker" errors

**Solution:**
This is expected behavior. The Monaco editors are configured to run language services in the main thread to avoid worker loading issues. This warning is harmless and does not affect functionality.

---

## Best Practices

### 1. Theme Management
- [OK] Use ONE `FluentDesignTheme` in `App.razor`
- [OK] Use `StorageName="theme"` to persist user preferences
- [OK] Don't create multiple theme providers

### 2. Color Customization
- [OK] Update Monaco editors after color changes via `refreshAllEditorThemes()`
- [OK] Add a small delay (100ms) before refreshing
- [OK] Use `SelectedOptionChanged` event for color dropdowns

### 3. Component Usage
- [OK] Prefer styled `<div>` elements over `FluentCard`
- [OK] Use FluentUI design tokens in styles: `var(--accent-fill-rest)`
- [OK] Avoid deeply nested FluentUI components

### 4. Performance
- [OK] Design tokens are cached after first harvest
- [OK] Monaco editors are lazy-loaded from local files
- [OK] Theme observers are efficient MutationObservers

---

## Additional Resources

- **FluentUI Blazor Documentation:** https://www.fluentui-blazor.net/
- **Monaco Editor Documentation:** https://microsoft.github.io/monaco-editor/
- **GitHub Repository:** https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack
- **FluentUI Stack Overflow Bug:** https://github.com/microsoft/fluentui-blazor/issues/4244

---

## Support

For issues, questions, or contributions, please visit the GitHub repository or open an issue at:
https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack/issues
