using FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Infrastructure;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.Logging;
using Microsoft.FluentUI.AspNetCore.Components;

namespace FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Controls;

public partial class SiteSettingsPanel
{
    private static readonly Dictionary<string, string?> Colors = new()
    {
        ["Default"] = null,
        ["Blue"] = "#0f6cbd",
        ["Teal"] = "#038387",
        ["Green"] = "#107c10",
        ["Orange"] = "#da3b01",
        ["Red"] = "#c50f1f",
        ["Purple"] = "#8764b8",
    };

    private string? _status;

    [Inject] public required ILogger<SiteSettingsPanel> Logger { get; set; }

    [Inject] public required CacheStorageAccessor CacheStorageAccessor { get; set; }

    [Inject] public required SiteThemeService ThemeService { get; set; }

    public string Mode { get; set; } = "System";

    public string ColorName { get; set; } = "Default";

    private static IEnumerable<string> AllModes => ["System", "Light", "Dark"];

    private static IEnumerable<string> AllColors => Colors.Keys;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            var state = await ThemeService.LoadAsync();
            Mode = state.Mode;
            ColorName = Colors.FirstOrDefault(c => string.Equals(c.Value, state.Color, StringComparison.OrdinalIgnoreCase)).Key ?? "Default";
            StateHasChanged();
        }

        await base.OnAfterRenderAsync(firstRender);
    }

    private async Task OnModeChangedAsync(string? mode)
    {
        Mode = mode ?? "System";
        await ApplyAsync();
    }

    private async Task OnColorChangedAsync(string? name)
    {
        ColorName = name ?? "Default";
        await ApplyAsync();
    }

    private async Task ApplyAsync()
    {
        try
        {
            await ThemeService.ApplyAsync(Mode, Colors.GetValueOrDefault(ColorName));
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to apply theme");
        }
    }

    private async Task ResetSiteAsync()
    {
        try
        {
            await CacheStorageAccessor.RemoveAllAsync();
            await ThemeService.ResetAsync();
            Mode = "System";
            ColorName = "Default";
            _status = "Site settings reset and cache cleared!";
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error resetting site settings");
            _status = "Error resetting settings. Please try again.";
        }
    }

    protected override Task OnActionClickedAsync(bool primary) => DialogInstance.CloseAsync();
}
