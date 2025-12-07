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
    
    <!-- FluentUI CSS -->
    <link href="_content/Microsoft.FluentUI.AspNetCore.Components/css/reboot.css" rel="stylesheet" />
    <link rel="stylesheet" href="_content/FluentUI.Blazor.Monaco.EditorPack/css/markdownPreview.css" />
    
    <HeadOutlet @rendermode="new InteractiveServerRenderMode(prerender: true)" />
</head>

<body>
    <!-- Single FluentDesignTheme (required) -->
    <FluentDesignTheme StorageName="theme" />
    
    <Routes @rendermode="new InteractiveServerRenderMode(prerender: true)" />
    
    <script src="_framework/blazor.web.js"></script>
    
    <!-- Monaco Editor Scripts -->
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/loader.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monaco-editor-pack.js"></script>
</body>
</html>
```

**Important:** Place `FluentDesignTheme` in `App.razor` only - do NOT add it to layouts or other components.

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
    
    private async Task OnMarkdownChanged(string newContent)
    {
        content = newContent;
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
            color: var(--accent-fill-rest);
            background: var(--neutral-layer-1);
        }
    ";
    
    private async Task OnCssChanged(string newCss)
    {
        cssContent = newCss;
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
<FluentDesignTheme @ref="theme"
                   @bind-Mode="@mode"
                   @bind-OfficeColor="@color"
                   StorageName="theme" />

<FluentSelect Items="@modes" @bind-SelectedOption="@mode" />

@code {
    private FluentDesignTheme? theme;
    private DesignThemeModes mode = DesignThemeModes.System;
    private OfficeColor? color = OfficeColor.Default;
    private IEnumerable<DesignThemeModes> modes => Enum.GetValues<DesignThemeModes>();
}
```

## Troubleshooting

### Editor Not Loading
- Verify scripts are in `<body>` AFTER `blazor.web.js`
- Check browser console for errors
- Ensure `AddMonacoEditorPack()` is called in `Program.cs`

### Theme Not Applied
- Ensure only ONE `FluentDesignTheme` exists (in `App.razor`)
- Check `StorageName="theme"` is set

### IntelliSense Not Working
- Design tokens are harvested on first editor load
- For CSS class IntelliSense in Markdown, pass CSS via `ExternalCss` parameter
- Check browser console for harvest logs: `[FluentUI Tokens] Harvested X tokens`

## Additional Resources

- [FluentUI Blazor Docs](https://www.fluentui-blazor.net/)
- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
- [GitHub Repository](https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack)
