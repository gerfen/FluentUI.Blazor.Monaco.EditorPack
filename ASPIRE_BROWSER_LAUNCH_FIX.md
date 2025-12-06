# Aspire Browser Launch Fix

## Issue Reported
When starting the Aspire AppHost, two browser windows were opening:
1. The Aspire Dashboard (expected) on the default Aspire port
2. The WASM demo project (unexpected) on port 7233/62968

This caused confusion and made it appear that something was misconfigured.

## Root Cause
The individual project `launchSettings.json` files had `"launchBrowser": true` configured. When Aspire starts these projects, it honors the launch settings and opens browsers for each project.

### Files With Issue
1. `FluentUI.Blazor.Monaco.EditorPack.WasmDemo/Properties/launchSettings.json`
2. `FluentUI.Blazor.Monaco.EditorPack.DemoApp/Properties/launchSettings.json`

Both had:
```json
{
  "profiles": {
    "https": {
      "commandName": "Project",
      "launchBrowser": true,  // ? Causes extra browser windows
      // ...
    }
  }
}
```

## Solution Applied

Changed `"launchBrowser": true` to `"launchBrowser": false` in both projects.

### File 1: WASM Demo
**File**: `FluentUI.Blazor.Monaco.EditorPack.WasmDemo/Properties/launchSettings.json`

```json
{
  "profiles": {
    "https": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,  // ? Fixed - no automatic browser launch
      "applicationUrl": "https://localhost:7233;http://localhost:5233",
      // ...
    },
    "IIS Express": {
      "commandName": "IISExpress",
      "launchBrowser": false,  // ? Fixed
      // ...
    }
  }
}
```

### File 2: Server Demo
**File**: `FluentUI.Blazor.Monaco.EditorPack.DemoApp/Properties/launchSettings.json`

```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "launchBrowser": false,  // ? Fixed
      "applicationUrl": "http://localhost:5182",
      // ...
    },
    "https": {
      "commandName": "Project",
      "launchBrowser": false,  // ? Fixed
      "applicationUrl": "https://localhost:7081;http://localhost:5182",
      // ...
    }
  }
}
```

## How It Works Now

### Running Through Aspire (Recommended)
```bash
cd FluentUI.Blazor.Monaco.EditorPack.AppHost
dotnet run
```

**Expected Behavior:**
1. ? **One browser opens** - Aspire Dashboard
2. ? Dashboard shows both projects:
   - `server-demo` - Blazor Server Interactive
   - `wasm-demo` - Blazor WebAssembly
3. ? Click project links in dashboard to access demos

### Running Individual Projects (Still Works)
You can still run projects directly:

**WASM Demo:**
```bash
cd FluentUI.Blazor.Monaco.EditorPack.WasmDemo
dotnet run
# Navigate manually to: https://localhost:7233
```

**Server Demo:**
```bash
cd FluentUI.Blazor.Monaco.EditorPack.DemoApp
dotnet run
# Navigate manually to: https://localhost:7081
```

To launch browser automatically when running standalone, use:
```bash
dotnet run --launch-profile https
```

Or temporarily enable in launchSettings.json for standalone development.

## Why This Is The Correct Approach

### Aspire Dashboard is the Entry Point
When using Aspire:
- The **dashboard is the orchestration UI**
- Users should access services **through the dashboard**
- Direct browser launches bypass the dashboard experience

### Cleaner Development Experience
- **Before**: Multiple browser windows, confusion about which is which
- **After**: Single dashboard, clear navigation to each demo

### Follows Aspire Best Practices
Most Aspire projects disable browser launch because:
1. Services are accessed through the dashboard
2. Dashboard provides health checks, logs, traces
3. Dashboard shows all services in one place

## Testing Checklist

### ? Start Aspire AppHost
```bash
dotnet run --project FluentUI.Blazor.Monaco.EditorPack.AppHost
```

**Expected Result:**
- ? Only Aspire Dashboard opens
- ? No additional browser windows
- ? Dashboard shows `server-demo` and `wasm-demo`

### ? Access Demos via Dashboard
1. Click `server-demo` endpoint ? Server Interactive demo opens
2. Click `wasm-demo` endpoint ? WASM demo opens

### ? Standalone Project Run (Optional)
```bash
cd FluentUI.Blazor.Monaco.EditorPack.WasmDemo
dotnet run
# Manually navigate to https://localhost:7233
```

**Expected Result:**
- ? Project starts
- ? No browser launches automatically
- ? Manual navigation works

## Alternative: Conditional Browser Launch

If you want browser launch **only when running standalone** (not through Aspire), you could create an Aspire-specific profile:

```json
{
  "profiles": {
    "https": {
      "commandName": "Project",
      "launchBrowser": true,  // For standalone development
      // ...
    },
    "Aspire": {
      "commandName": "Project",
      "launchBrowser": false,  // For Aspire orchestration
      // ...
    }
  }
}
```

However, the simpler approach (disabled by default) is recommended.

## Related Configuration

### AppHost.cs
The AppHost correctly configures both projects:

```csharp
var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.FluentUI_Blazor_Monaco_EditorPack_DemoApp>("server-demo")
    .WithExternalHttpEndpoints();  // ? Accessible via dashboard

builder.AddProject<Projects.FluentUI_Blazor_Monaco_EditorPack_WasmDemo>("wasm-demo")
    .WithExternalHttpEndpoints();  // ? Accessible via dashboard

builder.Build().Run();
```

No changes needed to AppHost.cs - it was already correct!

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Aspire Start** | 2-3 browser windows | 1 dashboard only ? |
| **Access Demos** | Confusing URLs | Dashboard links ? |
| **Standalone Run** | Auto-launches browser | Manual navigation |
| **Developer Experience** | Cluttered | Clean ? |
| **Aspire Best Practice** | ? Not followed | ? Followed |

## Files Modified

1. ? `FluentUI.Blazor.Monaco.EditorPack.WasmDemo/Properties/launchSettings.json`
2. ? `FluentUI.Blazor.Monaco.EditorPack.DemoApp/Properties/launchSettings.json`

Both files: `"launchBrowser": true` ? `"launchBrowser": false`

---

## Quick Reference

### Start Aspire (Recommended)
```bash
cd FluentUI.Blazor.Monaco.EditorPack.AppHost
dotnet run
# Only dashboard opens ? Click demo links
```

### Run WASM Demo Standalone
```bash
cd FluentUI.Blazor.Monaco.EditorPack.WasmDemo
dotnet run
# Navigate to: https://localhost:7233
```

### Run Server Demo Standalone
```bash
cd FluentUI.Blazor.Monaco.EditorPack.DemoApp
dotnet run
# Navigate to: https://localhost:7081
```

---

**Fix Complete!** ? Aspire now launches cleanly with only the dashboard browser window.
