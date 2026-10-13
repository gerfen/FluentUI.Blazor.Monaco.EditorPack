// ------------------------------------------------------------------------
// MIT License - Copyright (c) Microsoft Corporation. All rights reserved.
// ------------------------------------------------------------------------

using Microsoft.AspNetCore.Components;
using Microsoft.FluentUI.AspNetCore.Components;

namespace FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Cookies;

public partial class CookieConsent()
{
    private const string GA_MEASUREMENT_ID = "G-VML6BZWWTC"; // Google Analytics measurement ID
    private const string MC_PROIOJECT_ID = "hnr14wvzj8";     // Microsoft Clarity project ID

    [Inject]
    public required CookieConsentService CookieConsentService { get; set; }

    [Inject]
    public IDialogService DialogService { get; set; } = default!;

    private bool _showBanner = false;
    private CookieState? _cookieState;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            _cookieState ??= await CookieConsentService.GetCookieStateAsync();
            _showBanner = _cookieState is null;

            if (!_showBanner && _cookieState?.AcceptAnalytics == true)
            {
                await InitAnalyticsAsync();
            }
            StateHasChanged();
        }
    }

    private async Task AcceptPolicyAsync()
    {
        _cookieState = new CookieState(true);
        await CookieConsentService.SetCookieStateAsync(_cookieState);
        await InitAnalyticsAsync();

        _showBanner = false;
    }

    private async Task RejectPolicyAsync()
    {
        await CookieConsentService.SetCookieStateAsync(new CookieState(false));

        _showBanner = false;
    }

    public async Task ManageCookiesAsync()
    {
        _cookieState ??= await CookieConsentService.GetCookieStateAsync() ?? new();

        var result = await DialogService.ShowDialogAsync<ManageCookies>(options =>
        {
            options.Header.Title = "Manage cookie preferences";
            options.Header.CloseAction.Visible = true;
            options.Modal = true;
            options.Parameters.Add(nameof(ManageCookies.Content), _cookieState);
        });

        if (!result.Cancelled && result.Value is CookieState state)
        {
            _cookieState = state;

            await CookieConsentService.SetCookieStateAsync(_cookieState);
            await InitAnalyticsAsync();
        }
    }

    private async Task InitAnalyticsAsync()
    {
        if (_cookieState?.AcceptAnalytics == true)
        {
            //await CookieConsentService.InitAnalyticsAsync(GA_MEASUREMENT_ID, MC_PROIOJECT_ID);
        }
    }
}
