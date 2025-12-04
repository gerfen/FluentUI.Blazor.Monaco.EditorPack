// ------------------------------------------------------------------------
// MIT License - Copyright (c) Microsoft Corporation. All rights reserved.
// ------------------------------------------------------------------------


using FluentUI.Blazor.Monaco.EditorPack.DemoApp.Components.Cookies;
using Microsoft.FluentUI.AspNetCore.Components;

namespace FluentUI.Blazor.Monaco.EditorPack.DemoApp.Components.Infrastructure;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add common client services required by the Fluent UI Web Components for Blazor library
    /// </summary>
    /// <param name="services">Service collection</param>
    public static IServiceCollection AddFluentUIDemoClientServices(this IServiceCollection services)
    {
        //services.AddScoped<DataSource>();
        services.AddSingleton<IAppVersionService, AppVersionService>();
        services.AddScoped<CacheStorageAccessor>();
        services.AddScoped<CookieConsentService>();
        services.AddHttpClient<IStaticAssetService, HttpBasedStaticAssetService>();
       // services.AddSingleton<DemoNavProvider>();

        return services;
    }

    /// <summary>
    /// Add common server services required by the Fluent UI Web Components for Blazor library
    /// </summary>
    /// <param name="services">Service collection</param>
    public static IServiceCollection AddFluentUIDemoServerServices(this IServiceCollection services)
    {
       // services.AddScoped<DataSource>();
        services.AddScoped<IAppVersionService, AppVersionService>();
        services.AddScoped<CacheStorageAccessor>();
        services.AddScoped<CookieConsentService>();
        services.AddHttpClient<IStaticAssetService, ServerStaticAssetService>();
       // services.AddSingleton<DemoNavProvider>();

        return services;
    }

    /// <summary>
    /// Add common server services required by the Fluent UI Web Components for Blazor library
    /// </summary>
    /// <param name="services">Service collection</param>
    public static IServiceCollection AddFluentUIServices(this IServiceCollection services)
    {
        // services.AddScoped<DataSource>();
        services.AddScoped<IAppVersionService, AppVersionService>();
        services.AddScoped<CacheStorageAccessor>();
        services.AddScoped<CookieConsentService>();
        services.AddHttpClient<IStaticAssetService, ServerStaticAssetService>();
        // services.AddSingleton<DemoNavProvider>();
        services.AddScoped<FluentDesignTheme>();

        return services;
    }
}
