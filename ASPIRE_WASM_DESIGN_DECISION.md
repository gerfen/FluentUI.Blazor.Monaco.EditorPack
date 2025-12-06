# Aspire Integration for WASM Demo - Design Decision

## Summary

The **FluentUI.Blazor.Monaco.EditorPack.WasmDemo** project **does not use Aspire ServiceDefaults** because:
1. WASM applications don't support the full Aspire service defaults model
2. WASM runs entirely in the browser with no server-side infrastructure
3. The demo works standalone without Aspire dependencies

##Context

### What is Aspire ServiceDefaults?

The `FluentUI.Blazor.Monaco.EditorPack.ServiceDefaults` project provides:
- OpenTelemetry configuration (logging, metrics, tracing)
- Service discovery
- Health checks
- HTTP resilience patterns
- OTLP exporter configuration

### Why Server Demo Uses Aspire

The **Server Interactive Demo** (`FluentUI.Blazor.Monaco.EditorPack.DemoApp`) uses Aspire because:
- It's an ASP.NET Core application (`WebApplication.CreateBuilder`)
- Runs on a server with infrastructure services
- Benefits from service discovery and health checks
- Can export telemetry to Aspire Dashboard

**File**: `FluentUI.Blazor.Monaco.EditorPack.DemoApp/Program.cs`
```csharp
var builder = WebApplication.CreateBuilder(args);

// Add service defaults for Aspire
builder.AddServiceDefaults(); // ? Works in ASP.NET Core

// ... rest of configuration
```

### Why WASM Demo Doesn't Use Aspire

The **WASM Demo** (`FluentUI.Blazor.Monaco.EditorPack.WasmDemo`) does **not** use Aspire ServiceDefaults because:

#### 1. Different Builder Type
- **Server**: `WebApplication.CreateBuilder` ? `IHostApplicationBuilder`
- **WASM**: `WebAssemblyHostBuilder.CreateDefault` ? `WebAssemblyHostBuilder`

The `AddServiceDefaults()` extension method requires `IHostApplicationBuilder`:
```csharp
public static TBuilder AddServiceDefaults<TBuilder>(this TBuilder builder) 
    where TBuilder : IHostApplicationBuilder  // ? WASM doesn't implement this
```

#### 2. No Server Infrastructure
WASM applications:
- Run entirely in the browser
- No ASP.NET Core pipeline
- No health check endpoints (`/health`, `/alive`)
- No server-side telemetry export
- No service discovery (static file serving only)

#### 3. Limited Telemetry Support
OpenTelemetry in WASM:
- Can't export to server-side collectors by default
- Browser security restrictions (CORS, CSP)
- Limited instrumentation (no ASP.NET Core metrics)
- Would require custom JS interop for browser telemetry

#### 4. Standalone Nature
The WASM demo is designed to:
- Work without any server dependencies
- Be deployable to static file hosts (GitHub Pages, CDN)
- Demonstrate pure client-side Monaco Editor usage
- Run offline (with PWA caching)

---

## Architectural Comparison

### Server Interactive Demo Architecture
```
???????????????????????????????????????
?   Aspire AppHost (Orchestration)    ?
?  - Service Discovery                ?
?  - Dashboard & Telemetry            ?
???????????????????????????????????????
             ?
             ???> Server Demo
             ?    ?? ServiceDefaults ?
             ?    ?? OpenTelemetry
             ?    ?? Health Checks
             ?    ?? SignalR Hub
             ?    ?? Monaco Editors
             ?
             ???> WASM Demo
                  ?? No ServiceDefaults ?
                  ?? Standalone
                  ?? Static Assets Only
                  ?? Monaco Editors
```

### WASM Demo Architecture
```
????????????????????????????????????
?        Browser Runtime           ?
?  ??????????????????????????????  ?
?  ?   Blazor WASM Runtime      ?  ?
?  ?  - .NET assemblies (.dll)  ?  ?
?  ?  - Monaco Editor (JS)      ?  ?
?  ?  - FluentUI Components     ?  ?
?  ?  - No Server Connection    ?  ?
?  ??????????????????????????????  ?
????????????????????????????????????
```

---

## What WASM Demo Has Instead

While the WASM demo doesn't use Aspire ServiceDefaults, it still provides:

### 1. HttpClient Configuration
```csharp
builder.Services.AddScoped(sp => 
    new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
```

### 2. FluentUI Services
```csharp
builder.Services.AddFluentUIComponents();
```

### 3. Monaco Editor Pack Services
```csharp
builder.Services.AddMonacoEditorPack();
```

### 4. Custom Services
```csharp
builder.Services.AddScoped<PageTitleService>();
```

---

## If You Want Observability in WASM

If you need telemetry from the WASM demo, you can:

### Option 1: Browser Console Logging
```csharp
builder.Logging.SetMinimumLevel(LogLevel.Debug);
```

### Option 2: Custom Telemetry Export
Implement JS interop to send telemetry to a backend:
```csharp
// Custom implementation needed
await JSRuntime.InvokeVoidAsync("sendTelemetry", telemetryData);
```

### Option 3: Application Insights
Add browser-based Application Insights:
```html
<!-- index.html -->
<script src="https://js.monitor.azure.com/scripts/b/ai.2.min.js"></script>
<script>
  var appInsights = new Microsoft.ApplicationInsights.ApplicationInsights({
    config: {
      connectionString: "YOUR_CONNECTION_STRING"
    }
  });
  appInsights.loadAppInsights();
</script>
```

---

## AppHost Integration

Even without ServiceDefaults, the WASM demo **is integrated with Aspire AppHost**:

**File**: `FluentUI.Blazor.Monaco.EditorPack.AppHost/AppHost.cs`
```csharp
// Server Interactive Demo (with Aspire ServiceDefaults)
builder.AddProject<Projects.FluentUI_Blazor_Monaco_EditorPack_DemoApp>("server-demo")
    .WithExternalHttpEndpoints();

// WebAssembly Demo (standalone, no ServiceDefaults)
builder.AddProject<Projects.FluentUI_Blazor_Monaco_EditorPack_WasmDemo>("wasm-demo")
    .WithExternalHttpEndpoints();
```

Both demos appear in the Aspire Dashboard, but:
- **Server demo**: Provides health checks, metrics, traces
- **WASM demo**: Just shows the HTTP endpoint (static file serving)

---

## Design Decision Summary

| Aspect | Server Demo | WASM Demo |
|--------|-------------|-----------|
| **ServiceDefaults** | ? Yes | ? No |
| **OpenTelemetry** | ? Full support | ? Not applicable |
| **Health Checks** | ? `/health` endpoints | ? Not applicable |
| **Service Discovery** | ? Enabled | ? Not applicable |
| **Resilience** | ? HTTP resilience | ? Browser fetch only |
| **Aspire Dashboard** | ? Full integration | ?? Basic endpoint only |
| **Deployment** | Requires ASP.NET Core server | Static file hosting |
| **Use Case** | Production apps with infrastructure | Demos, CDN, offline-first |

---

## Conclusion

**The WASM demo intentionally does not use Aspire ServiceDefaults** because:

1. ? **Architecturally appropriate** - WASM is browser-based, not server-based
2. ? **Simpler deployment** - Static files only, no server required
3. ? **Demonstrates portability** - Shows Monaco Editor Pack works without Aspire
4. ? **Easier maintenance** - No complex infrastructure dependencies

This design decision **does not diminish the WASM demo** - it showcases that the FluentUI.Blazor.Monaco.EditorPack library:
- ? Works in both server and client hosting models
- ? Doesn't require Aspire to function
- ? Can be deployed anywhere (static hosting, CDN, offline)

---

## For Production WASM Apps

If you're building a production WASM app and want Aspire-like features:

1. **Use the library as-is** - No Aspire required
2. **Add custom telemetry** - Implement JS interop for browser metrics
3. **Use Application Insights** - For cloud-based monitoring
4. **Consider Backend for Frontend (BFF)** - Add a server API if you need server-side features

The Monaco Editor Pack library itself is **completely Aspire-agnostic** - it works with or without Aspire!
