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
    
    <!-- Fluent UI v5 CSS -->
    <link href="_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.bundle.scp.css" rel="stylesheet" />
    <link rel="stylesheet" href="_content/FluentUI.Blazor.Monaco.EditorPack/css/markdownPreview.css" />
    
    <script src="_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.lib.module.js" type="module" async></script>
</head>

<body>
    <div id="app">
        <!-- Loading indicator -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            <p>Loading...</p>
        </div>
    </div>

    <div id="blazor-error-ui">
        An error has occurred.
        <a href="" class="reload">Reload</a>
        <a class="dismiss">&times;</a>
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

<Router AppAssembly="@typeof(Program).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(Layout.MainLayout)" />
        <FocusOnNavigate RouteData="@routeData" Selector="h1" />
    </Found>
    <NotFound>
        <PageTitle>Not found</PageTitle>
        <LayoutView Layout="@typeof(Layout.MainLayout)">
            <p>Page not found</p>
        </LayoutView>
    </NotFound>
</Router>
```

**Important:** NO `@rendermode` needed in WASM - everything runs client-side.

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

> Only `AddFluentUIComponents()` and `AddMonacoEditorPack()` are required in `Program.cs`.

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
    
    private Task OnMarkdownChanged(string newContent)
    {
        content = newContent;
        return Task.CompletedTask;
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

The editors automatically adapt to Fluent UI theme changes (light/dark mode). To let users change the theme:

```razor
@inject IThemeService ThemeService

<FluentButton OnClick="@(() => ThemeService.SetThemeAsync(ThemeMode.Dark))">Dark</FluentButton>
<FluentButton OnClick="@(() => ThemeService.SetThemeAsync(ThemeMode.Light))">Light</FluentButton>
<FluentButton OnClick="@(() => ThemeService.SetThemeAsync(ThemeMode.System))">System</FluentButton>
```

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
- Ensure `<FluentProviders />` is in the main layout
- Verify the Fluent UI v5 CSS bundle and `lib.module.js` are loaded
- If the console reports a `ThemeSettings` deserialization error, clear the `theme` entry in browser localStorage

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
