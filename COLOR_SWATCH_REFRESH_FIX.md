# Fix for Color Swatch Not Updating in Markdown Editor

## Actual Problem

The color swatches in the Markdown editor only update when switching between light/dark themes, but **NOT** when changing colors within the same theme mode (e.g., changing accent color while staying in dark mode).

## Root Cause

The issue was in `fluentUIDesignTokens.js` in the `refreshTokens()` function:

```javascript
async refreshTokens() {
    console.log('[FluentUI Tokens] Refreshing tokens...');
    this._harvestedTokens = null;  // Clears cache
    return await this.harvestTokens();  // But harvestTokens() checks cache first!
}
```

### The Race Condition

1. User changes accent color (same theme mode)
2. `FluentDesignTheme` updates CSS variables on `<body>`
3. `MutationObserver` detects change ? calls `refreshTokens()`
4. `refreshTokens()` sets `_harvestedTokens = null`
5. `harvestTokens()` is called BUT checks `if (this._harvestedTokens)` first
6. If another concurrent call already set it, **cached values are returned**
7. Color swatches show OLD colors

### Why Theme Switch Worked

When switching light?dark, the entire theme changes, which:
- Triggers multiple DOM updates
- Causes a full re-render
- Forces the harvestTokens() to actually re-read from DOM

## Solution

### Fix 1: Reset Harvest-in-Progress Flag

Modified `refreshTokens()` to also reset the `_harvestInProgress` flag:

```javascript
async refreshTokens() {
    console.log('[FluentUI Tokens] Refreshing tokens...');
    this._harvestedTokens = null;
    this._harvestInProgress = false; // ? Force re-harvest
    return await this.harvestTokens();
}
```

This ensures that when `refreshTokens()` is called, it **forces** a fresh read from the DOM, even if another harvest is "in progress".

### Fix 2: Remove Duplicate Theme Component

Also removed the `<loading-theme>` web component from `App.razor` that was conflicting with `<FluentDesignTheme>`:

```razor
<!-- BEFORE (WRONG) -->
<body>
    <FluentDesignTheme StorageName="theme" />
    <loading-theme storage-name="theme" random-color="true"></loading-theme>  <!-- ? CONFLICT -->
</body>

<!-- AFTER (CORRECT) -->
<body>
    <FluentDesignTheme StorageName="theme" />  <!-- ? Single source of truth -->
</body>
```

## Files Modified

1. **FluentUI.Blazor.Monaco.EditorPack/wwwroot/js/fluentUIDesignTokens.js**
   - Added `this._harvestInProgress = false;` in `refreshTokens()` method

2. **FluentUI.Blazor.Monaco.EditorPack.DemoApp/Components/App.razor**
   - Removed `<loading-theme>` web component

3. **FluentUI.Blazor.Monaco.EditorPack.DemoApp/Components/Layout/MainLayout.razor**
   - Added missing `<Authorized>` section (unrelated build error fix)

## How to Test

1. **Stop debugging** (Shift+F5)
2. **Rebuild** solution (Ctrl+Shift+B)
3. **Start debugging** (F5)
4. In the app:
   - Open a Markdown file with CSS class color swatches (e.g., `{.highlight}`)
   - Change the accent color in Settings
   - **Expected:** Color swatches update immediately
   - Change theme (light?dark)
   - **Expected:** Color swatches update immediately

## Expected Behavior After Fix

? **Color swatches update when:**
- Changing accent color within same theme
- Changing neutral color within same theme
- Switching between light/dark themes
- Any design token value changes

## Technical Details

The fix ensures that:
1. `refreshTokens()` completely resets the token cache state
2. Concurrent harvest calls don't interfere with forced refreshes
3. The `MutationObserver` in `monacoMarkdownEditor.js` properly triggers token refresh
4. The `refreshColorDecorations()` function re-reads the updated token values

### Flow After Fix

```
User changes color
  ?
FluentDesignTheme updates CSS variables
  ?
MutationObserver detects change
  ?
refreshTokens() called
  ?
_harvestedTokens = null
_harvestInProgress = false  ? NEW
  ?
harvestTokens() FORCED to re-read DOM
  ?
New color values harvested
  ?
refreshColorDecorations() called
  ?
Monaco re-evaluates color swatches
  ?
? Swatches show NEW colors
```
