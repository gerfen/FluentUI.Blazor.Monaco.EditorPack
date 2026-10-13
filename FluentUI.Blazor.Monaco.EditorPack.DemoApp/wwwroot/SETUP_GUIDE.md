# Blazor Server Setup Guide

Complete setup guide for integrating Monaco Editor Pack in Blazor Server applications.

## Installation

```bash
dotnet add package FluentUI.Blazor.Monaco.EditorPack
```

## Configuration

### 1. Program.cs

```csharp
using FluentUI.Blazor.Monaco.EditorPack.Extensions;
using Microsoft.FluentUI.AspNetCore.Components;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Add FluentUI and Monaco services
builder.Services.AddFluentUIComponents();
builder.Services.AddMonacoEditorPack();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAntiforgery();
app.MapStaticAssets();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
```

### 2. App.razor

```razor
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <base href="/" />
    
    <!-- Fluent UI v5 CSS and module -->
    <link href="_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.bundle.scp.css" rel="stylesheet" />
    <link rel="stylesheet" href="_content/FluentUI.Blazor.Monaco.EditorPack/css/markdownPreview.css" />
    <script src="_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.lib.module.js" type="module" async></script>

    <HeadOutlet @rendermode="new InteractiveServerRenderMode(prerender: true)" />
</head>

<body>
    <Routes @rendermode="new InteractiveServerRenderMode(prerender: true)" />
    
    <script src="_framework/blazor.web.js"></script>
    
    <!-- Monaco Editor Scripts -->
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/loader.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monaco-editor-pack.js"></script>
</body>
</html>
```

### 3. Routes.razor

```razor
<Router AppAssembly="@typeof(Program).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(Layout.MainLayout)" />
        <FocusOnNavigate RouteData="@routeData" Selector="h1" />
    </Found>
</Router>
```

### 4. MainLayout.razor

Fluent UI v5 requires `<FluentProviders />` once, at the end of your main layout (it replaces `FluentDesignTheme` and the v4 provider components). Without it, dialogs, toasts and tooltips will not work.

```razor
@inherits LayoutComponentBase

@Body

<FluentProviders />
```

Migrating from Fluent UI v4? See the [Upgrade Guide](https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack/blob/HEAD/UPGRADE_GUIDE_FLUENTUI_V5.md).

### 5. _Imports.razor

```razor
@using Microsoft.FluentUI.AspNetCore.Components
@using FluentUI.Blazor.Monaco.EditorPack.Components
```

> Only `AddFluentUIComponents()` and `AddMonacoEditorPack()` are required in `Program.cs`. Fluent UI Blazor v5 also requires an interactive render mode.

## Usage Examples

### Markdown Editor

```razor
@page "/editor"
@using FluentUI.Blazor.Monaco.EditorPack.Components

<MonacoMarkdownEditor @ref="markdownEditor"
                      Markdown="@content"
                      MarkdownChanged="@OnMarkdownChanged"
                      ExternalCss="@customCss">
    <LeftContent>
        <h3>Editor</h3>
    </LeftContent>
    <RightContent>
        <FluentButton OnClick="Save" 
                     Disabled="@(!markdownEditor?.IsModified ?? true)">
            Save
        </FluentButton>
    </RightContent>
</MonacoMarkdownEditor>

@code {
    private MonacoMarkdownEditor? markdownEditor;
    private string content = "# Hello World";
    private string customCss = ".highlight { background: yellow; }";
    
    private Task OnMarkdownChanged(string newContent)
    {
        content = newContent;
        return Task.CompletedTask;
    }
    
    private void Save()
    {
        markdownEditor?.Commit();
        // Save to database
    }
}
```

### CSS Editor

```razor
<div style="height: 600px;">
    <MonacoCssEditor @ref="cssEditor"
                     Css="@cssContent"
                     CssChanged="@OnCssChanged" />
</div>

@code {
    private MonacoCssEditor? cssEditor;
    private string cssContent = @"
        .my-class {
            color: var(--colorBrandForeground1);
            background: var(--colorNeutralBackground1);
        }
    ";
    
    private Task OnCssChanged(string newCss)
    {
        cssContent = newCss;
        return Task.CompletedTask;
    }
}
```

## Features

### Markdown Editor
- Live preview with Markdig rendering
- CSS class IntelliSense using `{.className}` syntax
- Color swatches for CSS classes
- Formatting toolbar
- Undo/redo support

### CSS Editor
- FluentUI design token IntelliSense (`var(--token-name)`)
- Color decorators and swatches
- CSS property auto-completion
- Real-time validation
- Theme-aware syntax highlighting

## Theme Support

The editors automatically adapt to FluentUI theme changes (light/dark mode).

To allow users to change themes:

```razor
@inject IThemeService ThemeService

<FluentButton OnClick="@(() => ThemeService.SetThemeAsync(ThemeMode.Dark))">Dark</FluentButton>
<FluentButton OnClick="@(() => ThemeService.SetThemeAsync(ThemeMode.Light))">Light</FluentButton>
<FluentButton OnClick="@(() => ThemeService.SetThemeAsync(ThemeMode.System))">System</FluentButton>
```

## Troubleshooting

### Editor Not Loading
- Verify scripts are in `<body>` AFTER `blazor.web.js`
- Check browser console for errors
- Ensure `AddMonacoEditorPack()` is called in `Program.cs`

### Theme Not Applied
- Ensure `<FluentProviders />` is in the main layout
- Verify the Fluent UI v5 CSS bundle and `lib.module.js` are referenced
- If the console reports a `ThemeSettings` deserialization error, clear the `theme` entry in browser localStorage

### IntelliSense Not Working
- Design tokens are harvested on first editor load
- For CSS class IntelliSense in Markdown, pass CSS via `ExternalCss` parameter
- Check browser console for harvest logs: `[FluentUI Tokens] Harvested X tokens`

## Additional Resources

- [FluentUI Blazor Docs](https://www.fluentui-blazor.net/)
- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
- [GitHub Repository](https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack)
