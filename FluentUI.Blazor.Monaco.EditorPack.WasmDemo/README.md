# FluentUI Blazor Monaco Editor Pack - WebAssembly Demo

This is a **Blazor WebAssembly** demo application showcasing the FluentUI.Blazor.Monaco.EditorPack library running entirely in the browser with no server-side dependencies.

## Features

? **Full Monaco Editor Integration** - VS Code-powered editors in Blazor WASM  
? **Markdown Editor** - Live preview with Markdig rendering  
? **CSS Editor** - FluentUI design token IntelliSense  
? **No Server Required** - Runs 100% in the browser  
? **Offline Capable** - Works without internet connection after initial load  
? **Theme Support** - Light/Dark mode with FluentUI integration  

## Quick Start

### Prerequisites
- .NET 10.0 SDK or .NET 9.0 SDK
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Running the Demo

```bash
# Clone the repository
git clone https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack
cd FluentUI.Blazor.Monaco.EditorPack.AspireApp

# Run the WASM demo
dotnet run --project FluentUI.Blazor.Monaco.EditorPack.WasmDemo
```

The app will launch at `https://localhost:5001` (or similar port).

## Project Structure

```
FluentUI.Blazor.Monaco.EditorPack.WasmDemo/
??? Components/
?   ??? Layout/
?   ?   ??? MainLayout.razor          # Main application layout
?   ??? Pages/
?   ?   ??? Home.razor                # Home page with overview
?   ?   ??? EditorsDemo.razor         # Editor demonstration page
?   ?   ??? NotFound.razor            # 404 page
?   ??? SiteSettings.razor            # Settings panel trigger
?   ??? SiteSettingsPanel.razor       # Theme configuration panel
??? Services/
?   ??? PageTitleService.cs           # Page title management
??? wwwroot/
?   ??? css/
?   ?   ??? app.css                   # Application styles
?   ??? index.html                    # WASM entry point
?   ??? SETUP_GUIDE.md                # Detailed setup instructions
??? _Imports.razor                    # Global using directives
??? App.razor                         # App routing configuration
??? Program.cs                        # WASM host configuration
```

## Key Differences from Server Interactive Demo

| Aspect | WASM Demo | Server Demo |
|--------|-----------|-------------|
| **Hosting** | Static files only | ASP.NET Core server |
| **Execution** | Client-side only | Server + SignalR |
| **Render Modes** | Not used | `@rendermode InteractiveServer` |
| **Initial Load** | Slower (~6MB) | Faster |
| **Performance** | Fast after load | Network dependent |
| **State** | Browser only | Server session |
| **Offline** | Yes (with PWA) | No |

## WASM-Specific Configuration

### Program.cs

```csharp
var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// HttpClient for static assets
builder.Services.AddScoped(sp => new HttpClient 
{ 
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) 
});

// FluentUI and Monaco services
builder.Services.AddFluentUIComponents();
builder.Services.AddMonacoEditorPack();

await builder.Build().RunAsync();
```

### index.html

- Uses `blazor.webassembly.js` instead of `blazor.web.js`
- No `@rendermode` directives needed
- All Monaco scripts loaded in `<body>`

## Features Demonstrated

### 1. Markdown Editor
- Live preview with Markdig
- CSS class IntelliSense with `{.className}` syntax
- Color swatches for CSS properties
- Toolbar with formatting commands
- Undo/Redo support

### 2. CSS Editor
- FluentUI design token auto-completion
- Color decorators and swatches
- Real-time validation
- Theme-aware syntax highlighting

### 3. Theme Support
- Light/Dark/System theme modes
- FluentUI design token integration
- Browser localStorage persistence
- Instant theme switching

## Development Tips

### Hot Reload
```bash
dotnet watch --project FluentUI.Blazor.Monaco.EditorPack.WasmDemo
```

### Production Build
```bash
dotnet publish -c Release FluentUI.Blazor.Monaco.EditorPack.WasmDemo
```

Output: `bin/Release/net10.0/publish/wwwroot/`

### Debugging
1. Press F12 in browser to open DevTools
2. Check Console for errors
3. Use Network tab to verify Monaco files load
4. Check Application > Local Storage for theme settings

## Performance Considerations

### Initial Load Size
- .NET WASM runtime: ~2MB (compressed)
- Monaco Editor: ~6MB (includes all languages)
- Application code: ~500KB
- **Total**: ~8.5MB first load

### Optimization Strategies
1. **Enable Brotli compression** in hosting config
2. **Use AOT compilation** for faster execution:
   ```xml
   <PropertyGroup>
     <RunAOTCompilation>true</RunAOTCompilation>
   </PropertyGroup>
   ```
3. **Enable PWA** for offline caching
4. **Lazy-load editors** only when needed

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 90+ | ? Supported | Best performance |
| Edge 90+ | ? Supported | Recommended |
| Firefox 89+ | ? Supported | Fully compatible |
| Safari 15+ | ? Supported | Requires HTTPS |
| Mobile browsers | ?? Limited | Monaco may be slow |

## Troubleshooting

### Editor not loading
- Check browser console for errors
- Verify all Monaco scripts in `index.html`
- Clear browser cache

### Slow initial load
- Expected on first load (~8.5MB)
- Subsequent loads use browser cache
- Consider PWA for better caching

### Theme not persisting
- Check browser allows `localStorage`
- Verify theme service registration
- Check console for JS errors

## Deployment

### Static Hosting
The WASM demo can be hosted on any static file server:

- **Azure Static Web Apps**
- **GitHub Pages**
- **Netlify**
- **Vercel**
- **IIS / Nginx / Apache**

### Configuration
Ensure server serves:
- `.wasm` files with `application/wasm` MIME type
- `.dll` files with `application/octet-stream`
- Enable compression (Brotli/gzip)

## Learn More

- **Setup Guide**: See `wwwroot/SETUP_GUIDE.md` for detailed instructions
- **Main Project**: See parent README for package documentation
- **FluentUI Blazor**: https://www.fluentui-blazor.net/
- **Monaco Editor**: https://microsoft.github.io/monaco-editor/

## Contributing

Found an issue? Have a suggestion? Please open an issue at:
https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack/issues

## License

MIT License - see [LICENSE](../LICENSE.txt) for details
