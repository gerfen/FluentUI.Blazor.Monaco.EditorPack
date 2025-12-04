// ------------------------------------------------------------------------
// MIT License - Copyright (c) Microsoft Corporation. All rights reserved.
// ------------------------------------------------------------------------

using FluentUI.Blazor.Monaco.EditorPack.DemoApp.Components.Cookies;
using FluentUI.Blazor.Monaco.EditorPack.DemoApp.Components.Infrastructure;
using Microsoft.AspNetCore.Components;
using Microsoft.FluentUI.AspNetCore.Components;
using Microsoft.FluentUI.AspNetCore.Components.Extensions;

namespace FluentUI.Blazor.Monaco.EditorPack.DemoApp.Components.Controls;

public partial class SiteSettingsPanel
{
    private const string DEFAULT_NEUTRAL_COLOR = "#808080";

    private CookieConsent? _cookie;
    private string? _status;
    private bool _popVisible;
    private bool _ltr = true;
    private FluentDesignTheme? _theme;

    [Inject]
    public required ILogger<SiteSettingsPanel> Logger { get; set; }

    [Inject]
    public required CacheStorageAccessor CacheStorageAccessor { get; set; }

    [Inject]
    public required GlobalState GlobalState { get; set; }

    // Initialize with defaults to prevent null reference issues
    public DesignThemeModes Mode { get; set; } = DesignThemeModes.System;

    public OfficeColor? OfficeColor { get; set; }

    public string? NeutralColor { get; set; } = DEFAULT_NEUTRAL_COLOR;

    public LocalizationDirection? Direction { get; set; }

    private static IEnumerable<DesignThemeModes> AllModes => Enum.GetValues<DesignThemeModes>();

    protected override void OnInitialized()
    {
        // Initialize from GlobalState before first render
        Direction = GlobalState.Dir;
        _ltr = !Direction.HasValue || Direction.Value == LocalizationDirection.LeftToRight;
        NeutralColor = GlobalState.NeutralColor ?? DEFAULT_NEUTRAL_COLOR;
        
        base.OnInitialized();
    }

    protected void HandleDirectionChanged(bool isLeftToRight)
    {
        _ltr = isLeftToRight;
        Direction = isLeftToRight ? LocalizationDirection.LeftToRight : LocalizationDirection.RightToLeft;
    }

    private async Task ResetSiteAsync()
    {
        var msg = "Site settings reset and cache cleared!";

        await CacheStorageAccessor.RemoveAllAsync();
        await (_theme?.ClearLocalStorageAsync() ?? Task.CompletedTask);

        Logger.LogInformation(msg);
        _status = msg;

        OfficeColor = OfficeColorUtilities.GetRandom();
        Mode = DesignThemeModes.System;
        NeutralColor = DEFAULT_NEUTRAL_COLOR;
    }

    private async Task ManageCookieSettingsAsync()
    {
        if (_cookie != null)
        {
            await _cookie.ManageCookiesAsync();
        }
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
}
