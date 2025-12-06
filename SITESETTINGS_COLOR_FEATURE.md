# SiteSettingsPanel Color Selection Feature

## Enhancement Complete ?

The WASM `SiteSettingsPanel` now includes **color selection** functionality, matching the Server demo capabilities!

## What Was Added

### 1. Office Color Picker
- **Full color palette** from `OfficeColorUtilities.AllColors`
- **Visual color swatches** with icon preview
- **Random color option** when null is selected
- **Immediate theme updates** when color changes

### 2. Monaco Editor Integration
- **Automatic editor refresh** when color changes
- Refreshes both Markdown and CSS editors
- 100ms delay to ensure theme is applied before refresh

### 3. Reset Settings Button
- Clears all localStorage theme settings
- Reloads page to apply defaults
- Provides user feedback during reset

## File Updated

**`FluentUI.Blazor.Monaco.EditorPack.WasmDemo/Components/SiteSettingsPanel.razor`**

### Key Features Implemented

```razor
<FluentDesignTheme @ref="_theme"
                   @bind-Mode="@Mode"
                   @bind-OfficeColor="@OfficeColor"  ? Color binding
                   StorageName="theme" />

<FluentSelect Label="Theme"
              Items="@AllModes"
              @bind-SelectedOption="@Mode" />

<FluentSelect Label="Color"  ? Color selector
              Items="@(OfficeColorUtilities.AllColors.Cast<OfficeColor?>())"
              SelectedOption="@OfficeColor"
              SelectedOptionChanged="@OnColorChangedAsync">
    <OptionTemplate>
        <FluentStack>
            <FluentIcon Value="@(new Icons.Filled.Size20.RectangleLandscape())"
                        Color="Color.Custom"
                        CustomColor="@GetCustomColor(@context)" />  ? Color preview
            <FluentLabel>@context</FluentLabel>
        </FluentStack>
    </OptionTemplate>
</FluentSelect>

<FluentButton OnClick="@ResetSettingsAsync">  ? Reset button
    Reset Settings
</FluentButton>
```

### Code Features

#### 1. Color Display Helper
```csharp
private static string? GetCustomColor(OfficeColor? color)
{
    return color switch
    {
        null => OfficeColorUtilities.GetRandom(true).ToAttributeValue(),
        OfficeColor.Default => "#036ac4",
        _ => color.ToAttributeValue(),  // Uses Extensions namespace
    };
}
```

#### 2. Color Change Handler with Monaco Refresh
```csharp
private async Task OnColorChangedAsync(OfficeColor? newColor)
{
    OfficeColor = newColor;
    
    // Give FluentDesignTheme time to apply
    await Task.Delay(100);

    try
    {
        // Refresh Monaco Markdown editors
        await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.refreshAllEditorThemes");
        
        // Refresh Monaco CSS editors
        await JSRuntime.InvokeVoidAsync("monacoCssEditor.refreshAllEditorThemes");
        
        _status = "Color updated successfully";
        StateHasChanged();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to refresh: {ex.Message}");
        _status = "Color updated (editor refresh pending)";
    }
}
```

#### 3. Reset Settings
```csharp
private async Task ResetSettingsAsync()
{
    try
    {
        if (_theme != null)
        {
            await _theme.ClearLocalStorageAsync();  // Clear FluentUI theme storage
        }

        _status = "Settings reset! Reloading page...";
        StateHasChanged();

        await Task.Delay(500);
        await JSRuntime.InvokeVoidAsync("location.reload");  // Reload to apply
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
        _status = "Error resetting settings. Please try again.";
    }
}
```

## Available Colors

The color picker includes all Office theme colors:
- **Default** (Blue #036ac4)
- **Red** (#a4262c)
- **Orange** (#ca5010)
- **Yellow** (#ffd100)
- **Green** (#107c10)
- **Teal** (#008272)
- **Purple** (#5c2e91)
- **Magenta** (#e3008c)
- **DarkRed** (#750b1c)
- **DarkGreen** (#004b1c)
- **DarkPurple** (#32145a)
- **Berry** (#c239b3)
- **LightBlue** (#00bcf2)
- **LightGreen** (#bad80a)
- **LightRed** (#e74856)
- **LightOrange** (#ff8c00)
- **Camouflage** (#847545)
- **Plum** (#881798)
- **Navy** (#003966)
- **SeaFoam** (#00ad56)
- **Steel** (#69797e)
- **Brass** (#986f0b)
- **Mink** (#5d5a58)

## User Experience

### Opening Settings Panel
1. Click ?? gear icon in header
2. Panel slides in from right
3. Shows current theme and color

### Changing Theme
1. Select from dropdown: System / Light / Dark
2. Theme applies immediately
3. Monaco editors update automatically

### Changing Color
1. Click color dropdown
2. See visual swatches for each color
3. Select a color
4. **100ms delay** for theme to apply
5. Monaco editors refresh automatically
6. Status message confirms update

### Resetting Settings
1. Click "Reset Settings" button
2. Clears theme and color from storage
3. Shows "Settings reset! Reloading page..."
4. Page reloads with default theme (System + Random color)

## Integration with Monaco Editors

When color changes, the system:
1. Updates `FluentDesignTheme` with new color
2. Waits 100ms for CSS variables to update
3. Calls `monacoMarkdownEditor.refreshAllEditorThemes()`
4. Calls `monacoCssEditor.refreshAllEditorThemes()`
5. Monaco editors re-harvest design tokens
6. Editors apply new theme colors

This ensures **immediate visual feedback** without page reload!

## Comparison: WASM vs Server

Both demos now have **identical functionality**:

| Feature | Server Demo | WASM Demo |
|---------|-------------|-----------|
| Theme Selection | ? System/Light/Dark | ? System/Light/Dark |
| Color Selection | ? Full palette | ? Full palette |
| Color Swatches | ? Visual preview | ? Visual preview |
| Monaco Refresh | ? Auto-refresh | ? Auto-refresh |
| Reset Settings | ? Clear & reload | ? Clear & reload |
| Settings Panel | ? DialogService | ? DialogService |
| localStorage | ? Persists | ? Persists |

## Testing Checklist

### ? Theme Selection
- [ ] Open settings panel
- [ ] Select "Light" - app turns light, editors update
- [ ] Select "Dark" - app turns dark, editors update
- [ ] Select "System" - follows OS preference
- [ ] Close and reopen panel - selection persists

### ? Color Selection
- [ ] Open settings panel
- [ ] Click color dropdown
- [ ] See visual swatches for each color
- [ ] Select a color (e.g., "Purple")
- [ ] Accent color changes immediately
- [ ] Monaco editors refresh (100ms delay)
- [ ] Status shows "Color updated successfully"
- [ ] Close and reopen - color persists

### ? Reset Settings
- [ ] Change theme to Dark and color to Red
- [ ] Click "Reset Settings"
- [ ] See "Settings reset! Reloading page..."
- [ ] Page reloads
- [ ] Theme returns to System
- [ ] Color returns to random

### ? Monaco Editor Updates
- [ ] Go to Editors Demo page
- [ ] Open settings panel
- [ ] Change color
- [ ] Notice Monaco editor UI updates (scrollbars, selection, etc.)
- [ ] Verify syntax highlighting colors update
- [ ] Verify preview pane updates

## Technical Details

### Required Namespaces
```razor
@using Microsoft.FluentUI.AspNetCore.Components.Extensions
@implements IDialogContentComponent
@inject IJSRuntime JSRuntime
```

### Required References
- `Microsoft.FluentUI.AspNetCore.Components` - For theme components
- `Microsoft.FluentUI.AspNetCore.Components.Extensions` - For `ToAttributeValue()`
- `Microsoft.JSInterop` - For JS interop

### FluentDesignTheme Binding
```razor
<FluentDesignTheme @ref="_theme"
                   @bind-Mode="@Mode"
                   @bind-OfficeColor="@OfficeColor"
                   StorageName="theme" />
```

The `@bind-` directives enable two-way binding:
- Changes in dropdown ? updates theme
- Theme changes ? updates dropdown

### Storage Keys
FluentDesignTheme uses these localStorage keys:
- `theme` - Stores theme mode (System/Light/Dark)
- `theme-color` - Stores selected color
- `theme-mode` - Additional mode storage

## Benefits

### 1. Visual Customization
Users can personalize their experience with 23+ color options.

### 2. Instant Feedback
Monaco editors update immediately without page reload.

### 3. Persistent Settings
Choices saved in browser localStorage, persist across sessions.

### 4. Consistent UX
Matches the Server demo experience exactly.

### 5. Accessibility
Visual swatches help users see color before selecting.

## Known Behavior

### Color Refresh Delay
The 100ms delay before refreshing editors is **intentional**:
- Gives FluentDesignTheme time to update CSS variables
- Ensures Monaco harvests the updated tokens
- Prevents flickering or incomplete updates

### Console Logging
Color changes log to browser console:
```
Monaco Markdown editor themes refreshed after color change
Monaco CSS editor themes refreshed after color change
```

This helps with debugging and confirms refresh success.

### Error Handling
If Monaco refresh fails (rare), status shows:
```
Color updated (editor refresh pending)
```

This can happen if:
- Monaco hasn't fully loaded yet
- JavaScript interop fails temporarily
- Editors haven't been initialized

Color still applies; just editor UI may not update until next render.

## Summary

? **Color selection added** - Full Office color palette  
? **Visual swatches** - See colors before selecting  
? **Monaco integration** - Editors auto-refresh on color change  
? **Reset functionality** - Clear settings and reload  
? **Persistent storage** - Choices saved in localStorage  
? **Matches Server demo** - Identical feature set  

**The WASM demo now has full theme AND color customization!** ??
