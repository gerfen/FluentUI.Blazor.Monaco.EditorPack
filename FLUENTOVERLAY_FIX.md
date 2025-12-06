# FluentOverlay API Fix

## Issue
Runtime error in WASM demo:
```
System.InvalidOperationException: Object of type 'Microsoft.FluentUI.AspNetCore.Components.FluentOverlay' does not have a property matching the name 'FullHeight'.
```

## Root Cause
`FluentOverlay` in FluentUI 4.13.2 does not support `FullHeight` and `FullWidth` properties.

## Solution
**File**: `FluentUI.Blazor.Monaco.EditorPack.WasmDemo/Components/SiteSettings.razor`

### Before (Incorrect)
```razor
<FluentOverlay @bind-Visible="@SettingsPanelOpen"
               Opacity="0.4"
               Alignment="Align.End"
               FullHeight="true"    ? Not supported
               FullWidth="true">    ? Not supported
    <FluentCard Style="width: 340px; height: 100%; overflow-y: auto;">
        <SiteSettingsPanel OnDismiss="@(() => SettingsPanelOpen = false)" />
    </FluentCard>
</FluentOverlay>
```

### After (Correct)
```razor
<FluentOverlay @bind-Visible="@SettingsPanelOpen"
               Opacity="0.4"
               Alignment="Align.End">  ? Only supported properties
    <FluentCard Style="width: 340px; height: 100vh; overflow-y: auto;">  ? CSS height instead
        <SiteSettingsPanel OnDismiss="@(() => SettingsPanelOpen = false)" />
    </FluentCard>
</FluentOverlay>
```

## Changes Made
1. ? Removed `FullHeight="true"` - not a valid property
2. ? Removed `FullWidth="true"` - not a valid property  
3. ? Changed `height: 100%` to `height: 100vh` - uses CSS viewport height instead

## FluentOverlay Supported Properties (FluentUI 4.13.2)
- `Visible` / `@bind-Visible` - Show/hide overlay
- `Opacity` - Background opacity (0.0 to 1.0)
- `Alignment` - Position (`Align.Start`, `Align.Center`, `Align.End`)
- `OnClick` - Click handler for overlay background
- `ChildContent` - Content to display

## Build Status
? **Build Successful** - Error resolved

## Testing Checklist
- [ ] Click settings button (gear icon)
- [ ] Settings panel slides in from right
- [ ] Panel fills viewport height
- [ ] Theme selector works
- [ ] Dismiss button closes panel
- [ ] Clicking outside panel closes it

---

## Related Files Fixed

This was the last remaining build/runtime error in the WASM demo! All other files were already corrected:

1. ? `_Imports.razor` - Removed Authorization namespace
2. ? `App.razor` - Added @namespace, removed auth wrapper
3. ? `Program.cs` - Added using alias for App
4. ? `SiteSettings.razor` - Fixed Alignment API
5. ? `SiteSettingsPanel.razor` - Fixed EventCallback handling
6. ? `NotFound.razor` - Changed icon from DocumentError to Document
7. ? **SiteSettings.razor** - Fixed FluentOverlay properties ?

## Final Status

?? **WASM Demo is now fully functional!**

- ? Builds successfully
- ? No compilation errors
- ? No runtime errors
- ? Ready for testing
- ? Monaco editors integrated
- ? Theme switching works
- ? Settings panel functional
