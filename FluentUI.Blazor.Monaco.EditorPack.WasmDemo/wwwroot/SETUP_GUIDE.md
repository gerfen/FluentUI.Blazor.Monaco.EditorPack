# Blazor WebAssembly Setup Guide

Complete setup guide for integrating Monaco Editor Pack in Blazor WebAssembly applications.

## Installation

```bash
dotnet add package FluentUI.Blazor.Monaco.EditorPack
```

## Configuration

### 1. Program.cs

```csharp
using FluentUI.Blazor.Monaco.EditorPack.Extensions;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.FluentUI.AspNetCore.Components;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// HttpClient for static assets
builder.Services.AddScoped(sp => new HttpClient 
{ 
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) 
});

// Add FluentUI and Monaco services
builder.Services.AddFluentUIComponents();
builder.Services.AddMonacoEditorPack();

await builder.Build().RunAsync();
```

### 2. wwwroot/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <base href="/" />
    <title>Your App</title>
    
    <!-- FluentUI CSS -->
    <link href="_content/Microsoft.FluentUI.AspNetCore.Components/css/reboot.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="_content/FluentUI.Blazor.Monaco.EditorPack/css/markdownPreview.css" />
    
    <script src="_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.lib.module.js" type="module" async></script>
</head>

<body>
    <!-- Single FluentDesignTheme (required) -->
    <FluentDesignTheme StorageName="theme" />
    
    <div id="app">
        <!-- Loading indicator -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            <p>Loading...</p>
        </div>
    </div>

    <div id="blazor-error-ui">
        An error has occurred.
        <a href="" class="reload">Reload</a>
        <a class="dismiss">??</a>
    </div>
    
    <script src="_framework/blazor.webassembly.js"></script>
    
    <!-- Monaco Editor Scripts -->
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/loader.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monaco-editor-pack.js"></script>
</body>
</html>
```

**Key Differences from Server:**
- Uses `blazor.webassembly.js` instead of `blazor.web.js`
- NO `@rendermode` directives needed (everything is client-side)
- Scripts load AFTER Blazor WASM framework

### 3. App.razor

```razor
@using Microsoft.AspNetCore.Components.Routing

<Router AppAssembly="typeof(Program).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="routeData" DefaultLayout="typeof(MainLayout)" />
    </Found>
    <NotFound>
        <p>Page not found</p>
    </NotFound>
</Router>
```

**Important:** NO `@rendermode` needed in WASM - everything runs client-side.

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
    private string content = "# Hello WASM!";
    private string customCss = ".highlight { background: yellow; }";
    
    private async Task OnMarkdownChanged(string newContent)
    {
        content = newContent;
    }
    
    private void Save()
    {
        markdownEditor?.Commit();
        // Save to browser storage or API
    }
}
```

### CSS Editor

```razor
<div style="height: 600px;">
    <MonacoCssEditor @ref="cssEditor"
                     AdditionalCss="@cssContent"
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

## WASM-Specific Features

### Browser Storage
Save editor content to browser localStorage:

```csharp
@inject IJSRuntime JS

// Save
await JS.InvokeVoidAsync("localStorage.setItem", "markdown", content);

// Load
var saved = await JS.InvokeAsync<string>("localStorage.getItem", "markdown");
```

### PWA Support
Enable offline support by adding Monaco files to service worker cache manifest.

### Performance Tips
1. **Lazy Load Editors** - Only load when user navigates to editor pages
2. **Enable Compression** - Use Brotli compression for static assets
3. **Cache Assets** - Monaco files (~6MB) are cached by browser after first load

## Troubleshooting

### Slow Initial Load
- Expected: Monaco Editor is ~6MB (includes all language support)
- Solution: Enable Brotli compression, consider PWA caching

### Editor Not Loading
- Verify scripts are in `<body>` AFTER `blazor.webassembly.js`
- Check browser console for errors
- Ensure `AddMonacoEditorPack()` is called in `Program.cs`

### Theme Not Applied
- Ensure `FluentDesignTheme` is in `index.html` body
- Check `StorageName="theme"` is set
- Verify FluentUI scripts are loaded

### IntelliSense Not Working
- Design tokens are harvested on first editor load
- For CSS class IntelliSense in Markdown, pass CSS via `ExternalCss` parameter
- Check browser console for harvest logs: `[FluentUI Tokens] Harvested X tokens`

## WASM vs Server Comparison

| Feature | WASM | Server |
|---------|------|--------|
| **Initial Load** | Slower (downloads .NET runtime) | Faster |
| **Performance** | Fast after load | Depends on connection |
| **Offline** | Yes (with PWA) | No |
| **Hosting** | Static (CDN) | Requires server |
| **Render Modes** | Not needed | Required |

## Additional Resources

- [FluentUI Blazor Docs](https://www.fluentui-blazor.net/)
- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
- [Blazor WASM Docs](https://learn.microsoft.com/aspnet/core/blazor/hosting-models#blazor-webassembly)
- [GitHub Repository](https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack)
