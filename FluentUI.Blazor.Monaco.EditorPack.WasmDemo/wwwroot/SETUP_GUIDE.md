# FluentUI Blazor Monaco Editor Pack - WebAssembly Setup Guide

## Table of Contents
1. [Installation](#installation)
2. [WebAssembly Setup](#webassembly-setup)
3. [Basic Configuration](#basic-configuration)
4. [Using Monaco Editors](#using-monaco-editors)
5. [Theme Configuration](#theme-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Installation

### NuGet Package

```bash
dotnet add package FluentUI.Blazor.Monaco.EditorPack
```

### Dependencies

The package automatically includes:
- Monaco Editor (local files, no CDN)
- FluentUI design token integration
- HtmlSanitizer for Markdown preview
- Markdig for Markdown parsing

---

## WebAssembly Setup

### 1. Program.cs Configuration

Configure your `Program.cs` with WebAssembly-specific services:

```csharp
using FluentUI.Blazor.Monaco.EditorPack.Extensions;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.FluentUI.AspNetCore.Components;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// HttpClient for fetching static assets
builder.Services.AddScoped(sp => new HttpClient 
{ 
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) 
});

// Add FluentUI Components
builder.Services.AddFluentUIComponents();

// Add Monaco Editor Pack services (includes HtmlSanitizer)
builder.Services.AddMonacoEditorPack();

await builder.Build().RunAsync();
```

**Key Differences from Server:**
- [OK] Uses `WebAssemblyHostBuilder` instead of `WebApplication.CreateBuilder`
- [OK] No render modes needed (everything is client-side)
- [OK] HttpClient configured with base address for fetching assets

### 2. wwwroot/index.html Configuration

Create `wwwroot/index.html` with all required scripts:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your App</title>
    <base href="/" />
    
    <!-- FluentUI Styles -->
    <link rel="stylesheet" href="css/app.css" />
    <link rel="stylesheet" href="_content/FluentUI.Blazor.Monaco.EditorPack/css/markdownPreview.css" />
    
    <!-- FluentUI Blazor Components -->
    <script src="_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.lib.module.js" type="module" async></script>
    <script src="_content/Microsoft.FluentUI.AspNetCore.Components/js/loading-theme.js" type="text/javascript"></script>
   
    <HeadOutlet />
</head>

<body>
    <!-- Global FluentUI Theme -->
    <FluentDesignTheme StorageName="theme" />
    <loading-theme storage-name="theme" random-color="true"></loading-theme>
    
    <div id="app">
        <!-- Loading indicator -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <svg style="height: 80px; width: 80px;" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#0078d4" stroke-width="8" stroke-dasharray="80 200" stroke-linecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1.5s" repeatCount="indefinite"/>
                </circle>
            </svg>
            <p style="margin-top: 20px; font-family: 'Segoe UI', sans-serif; font-size: 18px; color: #0078d4;">
                Loading Monaco Editor Pack...
            </p>
        </div>
    </div>

    <div id="blazor-error-ui">
        An unhandled error has occurred.
        <a href="" class="reload">Reload</a>
        <a class="dismiss">??</a>
    </div>
   
    <!-- Blazor WebAssembly script -->
    <script src="_framework/blazor.webassembly.js"></script>
    
    <!-- Monaco Editor Package - Required Scripts (Simplified) -->
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/loader.js"></script>
    <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monaco-editor-pack.js"></script>
</body>
</html>
```

**Key Points:**
- [OK] Place `FluentDesignTheme` in `index.html` (global scope)
- [OK] Use `blazor.webassembly.js` instead of `blazor.web.js`
- [OK] NO render modes needed (WASM is always client-side)
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

### 3. App.razor (WASM Version)

```razor
@using Microsoft.AspNetCore.Components.Routing

<CascadingAuthenticationState>
    <Router AppAssembly="typeof(Program).Assembly">
        <Found Context="routeData">
            <RouteView RouteData="routeData" DefaultLayout="typeof(Layout.MainLayout)" />
            <FocusOnNavigate RouteData="routeData" Selector="h1" />
        </Found>
        <NotFound>
            <PageTitle>Not found</PageTitle>
            <LayoutView Layout="typeof(Layout.MainLayout)">
                <Pages.NotFound />
            </LayoutView>
        </NotFound>
    </Router>
</CascadingAuthenticationState>
```

**Key Differences:**
- ? NO `@rendermode` directives (not needed in WASM)
- ? Router configured directly in App.razor
- ? Simpler structure than Server/SSR apps

---

## Basic Configuration

### MainLayout.razor (WASM)

```razor
@inherits LayoutComponentBase

<FluentLayout>
    <FluentHeader Fixed="true" Style="background: var(--neutral-layer-1); padding: 16px;">
        <FluentLabel Typo="Typography.H1">
            Your App Title
        </FluentLabel>
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
- [OK] NO `FluentDesignTheme` here (already in index.html)
- [OK] Add FluentUI providers
- [OK] Simple layout structure

---

## Using Monaco Editors

### Markdown Editor Example

```razor
@page "/markdown"
@inject IJSRuntime JSRuntime

<MonacoMarkdownEditor @ref="markdownEditor"
                      Markdown="@markdownContent"
                      MarkdownChanged="@OnMarkdownChanged"
                      ExternalCss="@customCss">
    <LeftContent>
        <FluentLabel>Markdown Editor</FluentLabel>
    </LeftContent>
    <RightContent>
        <FluentButton Appearance="Appearance.Accent" 
                     OnClick="SaveMarkdown"
                     Disabled="@(!markdownEditor?.IsModified ?? true)">
            Save
        </FluentButton>
    </RightContent>
</MonacoMarkdownEditor>

@code {
    private MonacoMarkdownEditor? markdownEditor;
    private string markdownContent = "# Hello WASM!";
    private string customCss = ".highlight { background: yellow; }";
    
    private async Task OnMarkdownChanged(string newContent)
    {
        markdownContent = newContent;
        await Task.CompletedTask;
    }
    
    private void SaveMarkdown()
    {
        markdownEditor?.Commit();
        // Save to browser storage or API
    }
}
```

### CSS Editor Example

```razor
@page "/css"

<div style="height: 600px; width: 100%;">
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
    
    private async Task OnCssChanged(string newContent)
    {
        cssContent = newContent;
        await Task.CompletedTask;
    }
}
```

---

## Theme Configuration

### Settings Panel (WASM Version)

```razor
@inject IJSRuntime JSRuntime

<FluentStack Orientation="Orientation.Vertical" VerticalGap="16">
    <FluentLabel Typo="Typography.H4">Settings</FluentLabel>

    <FluentRadioGroup Name="theme-choice" 
                      Value="@currentTheme" 
                      ValueChanged="@OnThemeChangedAsync">
        <FluentRadio Value="@("System")">System</FluentRadio>
        <FluentRadio Value="@("Light")">Light</FluentRadio>
        <FluentRadio Value="@("Dark")">Dark</FluentRadio>
    </FluentRadioGroup>
</FluentStack>

@code {
    private string currentTheme = "System";

    protected override async Task OnInitializedAsync()
    {
        try
        {
            currentTheme = await JSRuntime.InvokeAsync<string>("eval", 
                "localStorage.getItem('theme') || 'System'");
        }
        catch
        {
            currentTheme = "System";
        }
    }

    private async Task OnThemeChangedAsync(string newTheme)
    {
        currentTheme = newTheme;
        
        try
        {
            // Save to browser localStorage
            await JSRuntime.InvokeVoidAsync("eval", 
                $"localStorage.setItem('theme', '{newTheme}'); " +
                $"document.body.setAttribute('data-theme', '{newTheme.ToLower()}');");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error changing theme: {ex.Message}");
        }
    }
}
```

**WASM-Specific Features:**
- [OK] Uses `localStorage` for theme persistence (no server storage)
- [OK] All JS interop runs in browser
- [OK] Instant theme updates with no server round-trip

---

## Troubleshooting

### 1. Monaco Editor Not Loading

**Symptom:** Editor container is empty

**Solution:**
- Check browser console for script loading errors
- Verify all Monaco scripts are in `index.html` AFTER `blazor.webassembly.js`
- Clear browser cache and rebuild

### 2. Large Initial Download

**Symptom:** Slow first load

**Why:** Monaco Editor files are ~6MB (includes all language support)

**Solution:**
- Enable Brotli compression in hosting config
- Use progressive web app (PWA) caching
- Consider lazy-loading editors only on editor pages

### 3. Color Swatches Not Showing

**Symptom:** No color decorators in CSS editor

**Solution:**
1. Ensure `FluentDesignTheme` is in `index.html`
2. Check that design tokens are harvested:
   ```javascript
   // In browser console
   console.log(window.fluentUIDesignTokens);
   ```
3. Monaco may need time to initialize - add delay before checking

### 4. Theme Changes Not Applying

**Symptom:** Theme doesn't change when clicking theme selector

**Solution:**
- Check browser console for JS errors
- Verify `localStorage` is enabled in browser
- Ensure `data-theme` attribute updates on `<body>`

### 5. Markdown Preview Not Rendering

**Symptom:** Preview pane is blank

**Solution:**
- Check that `AddMonacoEditorPack()` is called in `Program.cs`
- Verify `HtmlSanitizer` is registered (included in `AddMonacoEditorPack`)
- Check for CSP (Content Security Policy) blocking inline styles

---

## Performance Tips

### 1. Lazy Load Editors

Only load Monaco when user navigates to editor pages:

```razor
@page "/editor"

@if (showEditor)
{
    <MonacoMarkdownEditor ... />
}
else
{
    <FluentProgressRing />
}

@code {
    private bool showEditor = false;
    
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await Task.Delay(100);
            showEditor = true;
            StateHasChanged();
        }
    }
}
```

### 2. Progressive Web App (PWA)

Enable PWA for offline support:

```json
// wwwroot/service-worker-assets.js
self.assetsManifest = {
  assets: [
    "_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/loader.js",
    "_content/FluentUI.Blazor.Monaco.EditorPack/js/monacoMarkdownEditor.js",
    // ... other Monaco files
  ]
};
```

### 3. Browser Storage

Save editor content to browser storage:

```csharp
// Save content
await JSRuntime.InvokeVoidAsync("localStorage.setItem", "markdown", markdownContent);

// Load content
var saved = await JSRuntime.InvokeAsync<string>("localStorage.getItem", "markdown");
```

---

## WASM vs Server Differences

| Feature | WASM | Server Interactive |
|---------|------|-------------------|
| **Initial Load** | Slower (downloads .NET runtime) | Faster (only UI) |
| **Performance** | Fast after load (all client-side) | Depends on connection |
| **Offline Support** | Yes (with PWA) | No |
| **Server Resources** | None (static hosting) | SignalR connection per user |
| **State Management** | Browser only | Server + client |
| **Render Modes** | Not needed | Required (`@rendermode`) |

---

## Best Practices

### 1. WASM-Specific
- [OK] Use browser `localStorage` for persistence
- [OK] Enable PWA for offline support
- [OK] Compress static assets with Brotli
- [OK] Lazy-load editors to reduce initial bundle

### 2. Monaco Configuration
- [OK] Place ONE `FluentDesignTheme` in `index.html`
- [OK] Load Monaco scripts AFTER `blazor.webassembly.js`
- [OK] Use FluentUI design tokens: `var(--accent-fill-rest)`

### 3. Performance
- [OK] Monaco files are cached by browser
- [OK] Design tokens harvested once per session
- [OK] Editor instances reused when possible

---

## Additional Resources

- **FluentUI Blazor Documentation:** https://www.fluentui-blazor.net/
- **Monaco Editor Documentation:** https://microsoft.github.io/monaco-editor/
- **Blazor WASM Documentation:** https://learn.microsoft.com/en-us/aspnet/core/blazor/hosting-models#blazor-webassembly
- **GitHub Repository:** https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack

---

## Support

For issues, questions, or contributions, please visit:
https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack/issues
