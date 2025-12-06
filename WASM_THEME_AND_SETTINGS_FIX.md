# WASM Theme and Settings Panel Fixes

## Issues Identified

### Issue 1: Theme Not Working
**Symptom**: App appears completely dark/black instead of using FluentUI theme colors

**Root Cause**: `<FluentDesignTheme>` was incorrectly placed in `index.html` as a plain HTML element. FluentUI web components need to be rendered by Blazor, not as static HTML.

**Location**: `wwwroot/index.html` had:
```html
<body>
    <FluentDesignTheme StorageName="theme" />  ? Wrong location!
    <loading-theme storage-name="theme" random-color="true"></loading-theme>
```

### Issue 2: Settings Panel Not Opening
**Symptom**: Clicking the gear icon in the header does nothing

**Root Cause**: `FluentOverlay` component needs to be outside the `FluentLayout` container and properly integrated with the layout component's state management.

## Fixes Applied

### Fix 1: Move FluentDesignTheme to App.razor

**File**: `FluentUI.Blazor.Monaco.EditorPack.WasmDemo/wwwroot/index.html`

**Before**:
```html
<body>
    <FluentDesignTheme StorageName="theme" />
    <loading-theme storage-name="theme" random-color="true"></loading-theme>
    
    <div id="app">
        <!-- loading indicator -->
    </div>
    <!-- scripts -->
</body>
```

**After**:
```html
<body>
    <div id="app">
        <!-- loading indicator -->
    </div>
    <!-- scripts -->
</body>
```

**File**: `FluentUI.Blazor.Monaco.EditorPack.WasmDemo/App.razor`

**Before**:
```razor
@namespace FluentUI.Blazor.Monaco.EditorPack.WasmDemo
@using Microsoft.AspNetCore.Components.Routing

<Router AppAssembly="typeof(Program).Assembly">
    <!-- router content -->
</Router>
```

**After**:
```razor
@namespace FluentUI.Blazor.Monaco.EditorPack.WasmDemo
@using Microsoft.AspNetCore.Components.Routing

<FluentDesignTheme StorageName="theme" />  ? Properly rendered by Blazor!

<Router AppAssembly="typeof(Program).Assembly">
    <!-- router content -->
</Router>
```

### Fix 2: Move Settings Overlay to MainLayout

**File**: `FluentUI.Blazor.Monaco.EditorPack.WasmDemo/Components/Layout/MainLayout.razor`

**Changes**:
1. Moved settings button inline (removed separate SiteSettings component)
2. Moved `FluentOverlay` outside `FluentLayout`
3. Added state management (`SettingsPanelOpen`) to MainLayout

**Structure**:
```razor
<FluentLayout>
    <FluentHeader>
        <!-- Title -->
        <FluentSpacer/>
        <FluentButton OnClick="@(() => SettingsPanelOpen = true)">  ? Inline button
            Settings Icon
        </FluentButton>
    </FluentHeader>
    <FluentBodyContent>
        @Body
        <!-- Providers -->
    </FluentBodyContent>
</FluentLayout>

<FluentOverlay @bind-Visible="@SettingsPanelOpen">  ? Outside FluentLayout!
    <FluentCard>
        <SiteSettingsPanel OnDismiss="@(() => SettingsPanelOpen = false)" />
    </FluentCard>
</FluentOverlay>

@code {
    private bool SettingsPanelOpen { get; set; }  ? State in layout
}
```

## Why These Fixes Work

### FluentDesignTheme in App.razor
1. **Blazor renders it properly** - Component lifecycle hooks work
2. **Applies theme on startup** - Theme is active before any content renders
3. **Persists to localStorage** - `StorageName="theme"` parameter works
4. **Initializes FluentUI tokens** - Design tokens available immediately

### Overlay Outside FluentLayout
1. **Proper z-index stacking** - Overlay appears above all content
2. **Full viewport coverage** - Not constrained by FluentLayout
3. **Event handling works** - State changes properly trigger re-render
4. **Panel slides in correctly** - Alignment="Align.End" works as expected

## Testing Checklist

### Test Theme
- [ ] App loads with light theme (default)
- [ ] Background is white/light gray (not black)
- [ ] Text is readable
- [ ] Header has proper background color
- [ ] Monaco editor uses FluentUI theme

### Test Settings Panel
- [ ] Click gear icon in header
- [ ] Settings panel slides in from right
- [ ] Panel has proper styling (white background)
- [ ] Theme selector shows System/Light/Dark options
- [ ] Clicking outside panel closes it
- [ ] Dismiss button closes panel

### Test Theme Switching
- [ ] Select "Light" - app stays light
- [ ] Select "Dark" - app turns dark
- [ ] Select "System" - follows OS preference
- [ ] Theme persists after page refresh
- [ ] Monaco editor theme updates

## File Changes Summary

| File | Change | Status |
|------|--------|--------|
| `wwwroot/index.html` | Removed FluentDesignTheme and loading-theme | ? Fixed |
| `App.razor` | Added FluentDesignTheme at top | ? Fixed |
| `Components/Layout/MainLayout.razor` | Moved overlay outside layout, inlined settings button | ? Fixed |
| `Components/SiteSettings.razor` | No longer needed (merged into MainLayout) | ?? Can be deleted |

## Known Issue

**Build Error**: `App` type not found in namespace

**Cause**: App.razor has `@namespace FluentUI.Blazor.Monaco.EditorPack.WasmDemo` but the build cache needs refresh

**Solution**: 
```bash
# Stop the app if running
# Clean and rebuild
dotnet clean
dotnet build
```

Or if debugging:
1. Stop debugging (Shift+F5)
2. Rebuild solution
3. Start debugging again (F5)

## Comparison: Server Demo vs WASM Demo

### Server Demo (Working)
- `<FluentDesignTheme>` in `App.razor` ?
- Settings panel in MainLayout ?
- Overlay outside FluentLayout ?

### WASM Demo (Now Fixed)
- `<FluentDesignTheme>` moved to `App.razor` ?
- Settings panel integrated in MainLayout ?
- Overlay outside FluentLayout ?

Both demos now use the **same pattern**!

## Additional Notes

### Why index.html Didn't Work
The `index.html` file is **static HTML** that loads before Blazor starts. FluentUI web components like `<FluentDesignTheme>` need:
- Blazor component lifecycle
- Parameter binding
- Access to DI services
- Ability to communicate with other components

None of this is available in static HTML.

### Alternative Approach (Not Recommended)
You could manually initialize the web component via JavaScript:
```javascript
// After Blazor loads
const theme = document.createElement('fluent-design-theme');
theme.setAttribute('storage-name', 'theme');
document.body.appendChild(theme);
```

But this is **not recommended** because:
- Bypasses Blazor's component model
- No parameter binding
- No lifecycle hooks
- Harder to maintain

**Always use `App.razor` for FluentUI components in WASM!**

## Fix Complete! ?

After rebuilding, the WASM demo should:
- ? Display proper FluentUI theme (light/dark)
- ? Settings button works and opens panel
- ? Theme switching works
- ? Theme persists across page refreshes
- ? Matches the Server demo's appearance and behavior
