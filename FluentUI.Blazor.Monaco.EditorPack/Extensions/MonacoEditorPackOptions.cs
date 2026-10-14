namespace FluentUI.Blazor.Monaco.EditorPack.Extensions;

/// <summary>
/// Options for <see cref="ServiceCollectionExtensions.AddMonacoEditorPack(Microsoft.Extensions.DependencyInjection.IServiceCollection, Action{MonacoEditorPackOptions})"/>.
/// Controls what raw HTML written inside Markdown survives sanitization in the preview.
/// </summary>
public sealed class MonacoEditorPackOptions
{
    /// <summary>
    /// Allow raw <c>&lt;style&gt;</c> elements inside Markdown. Default is <c>false</c>.
    /// Only enable for trusted authors: a style element can restyle the whole page and exfiltrate data via CSS.
    /// </summary>
    public bool AllowStyleTags { get; set; }

    /// <summary>
    /// Allow raw <c>&lt;iframe&gt;</c> elements inside Markdown. Default is <c>false</c>.
    /// Only enable for trusted authors: iframes embed arbitrary third-party content.
    /// </summary>
    public bool AllowIframes { get; set; }
}
