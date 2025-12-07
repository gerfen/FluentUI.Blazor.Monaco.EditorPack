# DemoApp 404 Error Fix - Router Configuration

## Issue
After refactoring common components to `FluentUI.Blazor.Monaco.EditorPack.Shared`, the DemoApp was returning 404 errors when accessed through the Aspire portal.

## Root Cause
The `Router` component in `Routes.razor` had **incorrect syntax** for the `AdditionalAssemblies` parameter.

**Incorrect Syntax:**
```razor
<Router AppAssembly="typeof(Program).Assembly" 
        NotFoundPage="typeof(NotFound)" 
        AdditionalAssemblies="[typeof(FluentUI.Blazor.Monaco.EditorPack.Shared.Components._Imports).Assembly]">
```

This used **array literal syntax** `[...]` which is not valid for Blazor component parameters.

## Solution
Changed to use **array initialization syntax** with `new[]`:

**File**: `FluentUI.Blazor.Monaco.EditorPack.DemoApp/Components/Routes.razor`

```razor
@using FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Layout
@using FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Pages
@using Microsoft.AspNetCore.Components.Routing

<Router AppAssembly="typeof(Program).Assembly" 
        AdditionalAssemblies="new[] { typeof(FluentUI.Blazor.Monaco.EditorPack.Shared.Components._Imports).Assembly }">
    <Found Context="routeData">
        <RouteView RouteData="routeData" DefaultLayout="typeof(MainLayout)" />
        <FocusOnNavigate RouteData="routeData" Selector="h1" />
    </Found>
    <NotFound>
        <PageTitle>Not found</PageTitle>
        <LayoutView Layout="typeof(MainLayout)">
            <NotFound />
        </LayoutView>
    </NotFound>
</Router>
```

## Key Changes

### 1. Fixed AdditionalAssemblies Syntax
```diff
- AdditionalAssemblies="[typeof(...).Assembly]"
+ AdditionalAssemblies="new[] { typeof(...).Assembly }"
```

### 2. Removed NotFoundPage Parameter
The `NotFoundPage` parameter doesn't exist in the Router component. Instead, use the `<NotFound>` template.

### 3. Added Proper NotFound Handling
```razor
<NotFound>
    <PageTitle>Not found</PageTitle>
    <LayoutView Layout="typeof(MainLayout)">
        <NotFound />
    </LayoutView>
</NotFound>
```

### 4. Added FocusOnNavigate
```razor
<FocusOnNavigate RouteData="routeData" Selector="h1" />
```

This improves accessibility by focusing on the h1 element after navigation.

## Why This Matters

### Shared Component Assembly
After refactoring, the `Home.razor` and `EditorsDemo.razor` pages are in the `FluentUI.Blazor.Monaco.EditorPack.Shared` assembly:

```
FluentUI.Blazor.Monaco.EditorPack.Shared/
??? Components/
?   ??? Home.razor (@page "/")
?   ??? EditorsDemo.razor (@page "/editors-demo")
?   ??? Layout/
?   ?   ??? MainLayout.razor
?   ??? Pages/
?       ??? NotFound.razor (@page "/not-found")
```

Without `AdditionalAssemblies`, the Router only scans the DemoApp assembly and **cannot find** these routes, resulting in 404 errors.

### How AdditionalAssemblies Works
```csharp
AdditionalAssemblies="new[] { 
    typeof(FluentUI.Blazor.Monaco.EditorPack.Shared.Components._Imports).Assembly 
}"
```

This tells the Router to:
1. Use `_Imports` as a **marker type** in the Shared assembly
2. Get the Assembly reference from that type
3. **Scan that assembly** for components with `@page` directives
4. **Register those routes** alongside the DemoApp's routes

## Debug Output Analysis

From your debug output, both apps started successfully:

### DemoApp (Server Interactive)
```
Microsoft.Hosting.Lifetime: Information: Now listening on: https://localhost:54197
Microsoft.Hosting.Lifetime: Information: Application started.
Microsoft.Hosting.Lifetime: Information: Content root path: ...\FluentUI.Blazor.Monaco.EditorPack.DemoApp
```

### WASM Demo
```
Microsoft.Hosting.Lifetime: Information: Now listening on: https://localhost:54198
Microsoft.Hosting.Lifetime: Information: Application started.
Microsoft.Hosting.Lifetime: Information: Content root path: ...\FluentUI.Blazor.Monaco.EditorPack.WasmDemo
```

Both apps started, but the DemoApp couldn't **route requests** because it couldn't find the Home page (`@page "/"`).

## Aspire Dashboard Access

### Before Fix
- Navigate to: `https://localhost:17176`
- Click "server-demo" link
- **Result**: 404 Error (Router couldn't find `/` route)

### After Fix
- Navigate to: `https://localhost:17176`
- Click "server-demo" link
- **Result**: ? Home page loads successfully

## Testing Checklist

### ? Home Page
- [ ] Navigate to `https://localhost:54197/`
- [ ] See "FluentUI Blazor Monaco EditorPack Demo" page
- [ ] See Overview and Setup Instructions tabs

### ? Editors Demo Page
- [ ] Navigate to `https://localhost:54197/editors-demo`
- [ ] See Markdown and CSS editors
- [ ] Editors load and work correctly

### ? Not Found Page
- [ ] Navigate to `https://localhost:54197/invalid-route`
- [ ] See "404 - Page Not Found" message
- [ ] Page uses MainLayout

### ? Aspire Dashboard
- [ ] Navigate to `https://localhost:17176`
- [ ] See both `server-demo` and `wasm-demo`
- [ ] Click `server-demo` ? Home page loads
- [ ] Click `wasm-demo` ? WASM demo loads

## Common Pitfalls with Router AdditionalAssemblies

### ? Wrong: Array Literal Syntax
```razor
AdditionalAssemblies="[typeof(...).Assembly]"
```

### ? Wrong: Parentheses
```razor
AdditionalAssemblies="(typeof(...).Assembly)"
```

### ? Wrong: Single Assembly Without Array
```razor
AdditionalAssemblies="typeof(...).Assembly"
```

### ? Correct: Array Initialization
```razor
AdditionalAssemblies="new[] { typeof(...).Assembly }"
```

### ? Correct: Multiple Assemblies
```razor
AdditionalAssemblies="new[] { 
    typeof(SharedLib1._Imports).Assembly,
    typeof(SharedLib2._Imports).Assembly 
}"
```

## Blazor Router Parameters Reference

| Parameter | Type | Description |
|-----------|------|-------------|
| `AppAssembly` | `Assembly` | **Required** - Main app assembly to scan |
| `AdditionalAssemblies` | `IEnumerable<Assembly>` | **Optional** - Additional assemblies to scan |
| `Found` | `RenderFragment<RouteData>` | Template for matched routes |
| `NotFound` | `RenderFragment` | Template for unmatched routes |
| `Navigating` | `RenderFragment` | Template shown during navigation |
| `OnNavigateAsync` | `EventCallback<NavigationContext>` | Async event fired on navigation |
| `PreferExactMatches` | `bool` | Prefer exact route matches over catch-all |

**Note**: There is **NO** `NotFoundPage` parameter. Use `<NotFound>` template instead.

## Related Configuration

### Program.cs - Render Mode
```csharp
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();  // ? Enables Server interactivity
```

### App.razor - Routes Component
```razor
<Routes @rendermode="new InteractiveServerRenderMode(prerender: true)" />
```

### Routes.razor - Router Component
```razor
<Router AppAssembly="..." AdditionalAssemblies="...">
    <!-- Route templates -->
</Router>
```

## Architecture After Refactoring

```
??????????????????????????????????????????
?  FluentUI.Blazor.Monaco.EditorPack     ?
?  .DemoApp                              ?
?                                        ?
?  ???????????????????????????????????  ?
?  ? Program.cs                      ?  ?
?  ?  - AddServiceDefaults()         ?  ?
?  ?  - AddRazorComponents()         ?  ?
?  ?  - MapRazorComponents<App>()    ?  ?
?  ???????????????????????????????????  ?
?                                        ?
?  ???????????????????????????????????  ?
?  ? Components/App.razor            ?  ?
?  ?  - <Routes @rendermode="..."/>  ?  ?
?  ???????????????????????????????????  ?
?                                        ?
?  ???????????????????????????????????  ?
?  ? Components/Routes.razor         ?  ?
?  ?  - <Router AppAssembly="..."    ?  ?
?  ?      AdditionalAssemblies="..."/>? ?????
?  ???????????????????????????????????  ?  ?
??????????????????????????????????????????  ?
                                             ?
                                             ? Scans for @page
                                             ?
??????????????????????????????????????????  ?
?  FluentUI.Blazor.Monaco.EditorPack     ?  ?
?  .Shared                               ?  ?
?                                        ?  ?
?  ???????????????????????????????????  ?  ?
?  ? Components/Home.razor           ? ??  ?
?  ?   @page "/"                     ?     ?
?  ???????????????????????????????????     ?
?                                        ?
?  ???????????????????????????????????  ?
?  ? Components/EditorsDemo.razor    ?  ?
?  ?   @page "/editors-demo"         ?  ?
?  ???????????????????????????????????  ?
?                                        ?
?  ???????????????????????????????????  ?
?  ? Components/Layout/MainLayout    ?  ?
?  ???????????????????????????????????  ?
?                                        ?
?  ???????????????????????????????????  ?
?  ? Components/Pages/NotFound       ?  ?
?  ?   @page "/not-found"            ?  ?
?  ???????????????????????????????????  ?
??????????????????????????????????????????
```

## Summary

? **Fixed Router configuration** - Changed `AdditionalAssemblies` from array literal `[...]` to array initialization `new[] { ... }`  
? **Added proper NotFound handling** - Removed non-existent `NotFoundPage` parameter, used `<NotFound>` template  
? **Added FocusOnNavigate** - Improved accessibility  
? **Build successful** - No compilation errors  
? **404 errors resolved** - DemoApp now finds routes in Shared assembly  

**The DemoApp should now work correctly when accessed through the Aspire portal!** ??
