# FluentUI Blazor Monaco Editor Pack

A comprehensive Razor Class Library (RCL) that provides Monaco Editor integration for Blazor applications with FluentUI components.

[![NuGet](https://img.shields.io/nuget/v/FluentUI.Blazor.Monaco.EditorPack.svg)](https://www.nuget.org/api/v2/package/FluentUI.Blazor.Monaco.EditorPack/0.1.8-preview/)

## Features

- **Monaco Markdown Editor** - Full-featured Markdown editor with live preview
  - Syntax highlighting for Markdown
  - CSS class IntelliSense with color swatches
  - Live preview with sanitized HTML rendering
  - Undo/Redo support with Memento pattern
  - Markdown toolbar with FluentUI buttons
  
- **Monaco CSS Editor** - Advanced CSS editor with FluentUI design token support
  - FluentUI design token IntelliSense
  - Color decorators and swatches
  - Auto-completion for CSS properties
  - Theme-aware editor colors

## Installation

### NuGet Package
```bash
dotnet add package FluentUI.Blazor.Monaco.EditorPack
```

### Service Registration

Add the Monaco Editor Pack services to your `Program.cs`:

```csharp
using FluentUI.Blazor.Monaco.EditorPack.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add Monaco Editor Pack services (includes HtmlSanitizer configuration)
builder.Services.AddMonacoEditorPack();
```

This extension method automatically configures:
- `IHtmlSanitizer` with support for `style` tags, as well as  `class`, `id`, `iframe` and `mailto` attributes
- All required dependencies for Monaco editors

### Updating App.razor
Add the following in the ```<head>``` of ```App.razor```
```html
<head>
   <link rel="stylesheet" href="_content/FluentUI.Blazor.Monaco.EditorPack/css/markdownPreview.css" />

   <!-- ensure the rendermode is set as follows -->
    <HeadOutlet @rendermode="new InteractiveServerRenderMode(prerender: true)" />
 </head>
```

Add the following inside of ```<body>```

```html
  <body>
    <!-- Monaco Editor Package - Required Scripts -->
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/loader.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/fluentUIDesignTokens.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/cssClassHarvester.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monacoCssEditorTheme.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monacoCssEditor.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monacoMarkdownEditor.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monacoMarkdownToolbar.js"></script>
    <script>
  </body>
```




> see [App.razor](https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack/blob/master/FluentUI.Blazor.Monaco.EditorPack.DemoApp/Components/App.razor) in the supplied demo application found on GitHub

## Usage

### Markdown Editor

```razor
@page "/markdown-demo"
@using FluentUI.Blazor.Monaco.EditorPack.Components

<MonacoMarkdownEditor @ref="markdownEditor"
                     Markdown="@markdownContent"
                     MarkdownChanged="@OnMarkdownChanged"
                     ExternalCss="@aggregatedCss">
    <LeftContent>
        <h3>Markdown Editor</h3>
    </LeftContent>
    <RightContent>
        <FluentButton Appearance="Appearance.Accent" 
                     OnClick="@SaveAsync"
                     Disabled="@(!markdownEditor?.IsModified ?? true)">
            Save
        </FluentButton>
    </RightContent>
</MonacoMarkdownEditor>

@code {
    private MonacoMarkdownEditor? markdownEditor;
    private string markdownContent = "# Hello World\n\nThis is **bold** text.";
    private string aggregatedCss = ".highlight { background-color: yellow; }";
    
    private Task OnMarkdownChanged(string newContent)
    {
        markdownContent = newContent;
        return Task.CompletedTask;
    }
    
    private async Task SaveAsync()
    {
        // Save logic here
        markdownEditor?.Commit();
    }
}
```

### CSS Editor

```razor
@page "/css-demo"
@using FluentUI.Blazor.Monaco.EditorPack.Components

<MonacoCssEditor @ref="cssEditor"
                Css="@cssContent"
                CssChanged="@OnCssChanged">
</MonacoCssEditor>

@code {
    private MonacoCssEditor? cssEditor;
    private string cssContent = ".my-class { color: var(--accent-fill-rest); }";
    
    private Task OnCssChanged(string newCss)
    {
        cssContent = newCss;
        return Task.CompletedTask;
    }
}
```

## Requirements

- .NET 9.0 or .NET 10.0
- Microsoft.FluentUI.AspNetCore.Components 4.13.2+
- HtmlSanitizer 9.0.889+
- Markdig 0.44.0+

## Features in Detail

### CSS Class IntelliSense
The Markdown editor provides IntelliSense for CSS classes when typing `{.className}` syntax (Markdig generic attributes). It shows:
- Available CSS classes from aggregated stylesheets
- CSS properties for each class
- Color swatches for color-related properties

### FluentUI Design Token Support
The CSS editor provides IntelliSense for FluentUI design tokens:
- Auto-completion for `var(--token-name)`
- Color previews for color tokens
- Dynamic token harvesting from the current theme

### Theme Integration
Both editors automatically adapt to FluentUI theme changes:
- Dark/light mode support
- Theme-aware syntax highlighting
- Automatic color decoration updates

## License

MIT License - see [LICENSE](https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack/blob/master/LICENSE.txt) file for details
