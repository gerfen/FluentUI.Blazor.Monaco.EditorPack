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
    /// Configures HtmlSanitizer to allow style tags required for CSS in Markdown preview.
    /// </summary>
    /// <param name="services">The service collection to add services to.</param>
    /// <returns>The service collection for method chaining.</returns>
    public static IServiceCollection AddMonacoEditorPack(this IServiceCollection services)
    {
        // Configure HtmlSanitizer to allow style tags (required for CSS in Markdown preview)
        services.AddScoped<IHtmlSanitizer, HtmlSanitizer>(_ =>
        {
            var sanitizer = new HtmlSanitizer();
            sanitizer.AllowedAttributes.Add("id");
            sanitizer.AllowedAttributes.Add("class");
            sanitizer.AllowedTags.Add("style");
            sanitizer.AllowedTags.Add("iframe");
            sanitizer.AllowedSchemes.Add("mailto");
            return sanitizer;
        });

        return services;
    }
}
