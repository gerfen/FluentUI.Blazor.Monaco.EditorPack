using Microsoft.FluentUI.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Infrastructure;

public sealed record SiteThemeState(string Mode, string? Color);

public class SiteThemeService(IJSRuntime js, IThemeService themeService)
    : JSModule(js, "./_content/FluentUI.Blazor.Monaco.EditorPack.Shared/js/siteTheme.js")
{
    public async ValueTask<SiteThemeState> LoadAsync()
    {
        ThemeSettings? settings = null;
        try
        {
            settings = await themeService.GetThemeSettingsAsync();
        }
        catch (JSException)
        {
            // Stored theme value is invalid or from an older format; reset it.
            await themeService.ClearStoredThemeSettingsAsync();
        }

        await SyncAsync();
        return settings is null
            ? new SiteThemeState("System", null)
            : new SiteThemeState(settings.Mode.ToString(), settings.Color);
    }

    public async ValueTask ApplyAsync(string mode, string? color)
    {
        var themeMode = Enum.TryParse<ThemeMode>(mode, out var parsed) ? parsed : ThemeMode.System;

        if (string.IsNullOrWhiteSpace(color))
        {
            await themeService.SetThemeAsync(ThemeColorVariant.Default, themeMode);
        }
        else
        {
            await themeService.SetThemeAsync(new ThemeSettings(color, 0, 0, themeMode, true));
        }

        await SyncAsync();
    }

    public async ValueTask ResetAsync()
    {
        await themeService.ClearStoredThemeSettingsAsync();
        await themeService.SetThemeAsync(ThemeColorVariant.Default, ThemeMode.System);
        await SyncAsync();
    }

    private async ValueTask SyncAsync()
    {
        var dark = await themeService.IsDarkModeAsync();
        await InvokeVoidAsync("sync", dark);
    }
}
