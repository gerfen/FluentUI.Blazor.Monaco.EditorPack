using Microsoft.FluentUI.AspNetCore.Components;

namespace FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Controls;

public partial class SiteSettings
{
    private async Task OpenSiteSettingsAsync()
    {
        await DialogService.ShowDialogAsync<SiteSettingsPanel>(options =>
        {
            options.Alignment = DialogAlignment.End;
            options.Header.Title = "Site settings";
            options.Header.CloseAction.Visible = true;
            options.Footer.PrimaryAction.Label = "OK";
            options.Footer.SecondaryAction.Visible = false;
        });
    }
}
