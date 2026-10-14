using Ganss.Xss;
using Microsoft.Extensions.DependencyInjection;

namespace FluentUI.Blazor.Monaco.EditorPack.Extensions;

/// <summary>
/// Extension methods for configuring FluentUI Blazor Monaco Editor Pack services.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds the Monaco Editor Pack services to the service collection.
    /// Registers an HtmlSanitizer that, by default, strips <c>&lt;style&gt;</c> and <c>&lt;iframe&gt;</c>
    /// from Markdown preview HTML. The editor's own CSS cascade is injected separately and is unaffected.
    /// </summary>
    /// <param name="services">The service collection to add services to.</param>
    /// <returns>The service collection for method chaining.</returns>
    public static IServiceCollection AddMonacoEditorPack(this IServiceCollection services)
        => services.AddMonacoEditorPack(_ => { });

    /// <inheritdoc cref="AddMonacoEditorPack(IServiceCollection)"/>
    /// <param name="services">The service collection to add services to.</param>
    /// <param name="configure">Opt in to less strict sanitization for trusted content.</param>
    public static IServiceCollection AddMonacoEditorPack(this IServiceCollection services, Action<MonacoEditorPackOptions> configure)
    {
        ArgumentNullException.ThrowIfNull(configure);

        var options = new MonacoEditorPackOptions();
        configure(options);

        services.AddScoped<IHtmlSanitizer, HtmlSanitizer>(_ =>
        {
            var sanitizer = new HtmlSanitizer();
            sanitizer.AllowedAttributes.Add("id");
            sanitizer.AllowedAttributes.Add("class");
            if (options.AllowStyleTags) sanitizer.AllowedTags.Add("style");
            if (options.AllowIframes) sanitizer.AllowedTags.Add("iframe");
            sanitizer.AllowedSchemes.Add("mailto");
            return sanitizer;
        });

        return services;
    }
}
