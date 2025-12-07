// ------------------------------------------------------------------------
// MIT License - Copyright (c) Microsoft Corporation. All rights reserved.
// ------------------------------------------------------------------------

using FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Infrastructure;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.Logging;
using Microsoft.FluentUI.AspNetCore.Components;
using Microsoft.FluentUI.AspNetCore.Components.Extensions;
using Microsoft.JSInterop;

namespace FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Controls;

public partial class SiteSettingsPanel
{
    private const string DEFAULT_NEUTRAL_COLOR = "#808080";

    private string? _status;
    private bool _popVisible;
    private bool _ltr = true;
    private FluentDesignTheme? _theme;

    [Inject] public required ILogger<SiteSettingsPanel> Logger { get; set; }

    [Inject] public required CacheStorageAccessor CacheStorageAccessor { get; set; }

    [Inject] public required GlobalState GlobalState { get; set; }



    [Inject]
    public required IJSRuntime JsRuntime { get; set; }

    public DesignThemeModes Mode { get; set; }

    public OfficeColor? OfficeColor { get; set; }

    public string? NeutralColor { get; set; }

    public LocalizationDirection? Direction { get; set; }

    private static IEnumerable<DesignThemeModes> AllModes => Enum.GetValues<DesignThemeModes>();

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            Direction = GlobalState.Dir;
            _ltr = !Direction.HasValue || Direction.Value == LocalizationDirection.LeftToRight;

            NeutralColor = GlobalState.NeutralColor;
            // Same default values is used for light and dark theme
            NeutralColor ??= DEFAULT_NEUTRAL_COLOR;
        }

        await base.OnAfterRenderAsync(firstRender);
    }

    protected void HandleDirectionChanged(bool isLeftToRight)
    {
        _ltr = isLeftToRight;
        Direction = isLeftToRight ? LocalizationDirection.LeftToRight : LocalizationDirection.RightToLeft;
    }

    private async Task ResetSiteAsync()
    {
        var msg = "Site settings reset and cache cleared!";

        try
        {
            await CacheStorageAccessor.RemoveAllAsync();

            if (_theme != null)
            {
                await _theme.ClearLocalStorageAsync();
            }

            Logger.LogInformation(msg);
            _status = msg;

            // Reload page to apply reset
            await JsRuntime.InvokeVoidAsync("location.reload");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error resetting site settings");
            _status = "Error resetting settings. Please try again.";
        }
    }

    private async Task ManageCookieSettingsAsync()
    {
        // CookieConsent is now in MainLayout, not in this panel
        // We need to access it differently or handle this through a service
        Logger.LogInformation("Manage cookies requested");
        await Task.CompletedTask;
    }

    private static string? GetCustomColor(OfficeColor? color)
    {
        return color switch
        {
            null => OfficeColorUtilities.GetRandom(true).ToAttributeValue(),
            Microsoft.FluentUI.AspNetCore.Components.OfficeColor.Default => "#036ac4",
            _ => color.ToAttributeValue(),
        };
    }


    private async Task OnColorChangedAsync(OfficeColor? newColor)
    {
        // Update the bound property
        OfficeColor = newColor;
        
        // Give FluentDesignTheme time to apply the new color
        await Task.Delay(100);

        try
        {
            // Trigger Monaco Markdown editor theme refresh
            await JsRuntime.InvokeVoidAsync("monacoMarkdownEditor.refreshAllEditorThemes");
            Logger.LogInformation("Monaco Markdown editor themes refreshed after color change");
            
            // Trigger Monaco CSS editor theme refresh
            await JsRuntime.InvokeVoidAsync("monacoCssEditor.refreshAllEditorThemes");
            Logger.LogInformation("Monaco CSS editor themes refreshed after color change");
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to refresh Monaco editor themes");
        }
    }
}