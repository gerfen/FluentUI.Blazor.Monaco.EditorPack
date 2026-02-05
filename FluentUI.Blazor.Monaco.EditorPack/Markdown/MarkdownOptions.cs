namespace FluentUI.Blazor.Monaco.EditorPack.Markdown;

/// <summary>
/// Options for configuring which Markdig extensions are enabled when rendering Markdown.
///
/// Defaults:
/// <list type="bullet">
/// <item><description><see cref="EnableFrontMatter"/> = <c>true</c></description></item>
/// <item><description><see cref="EnableTables"/> = <c>true</c></description></item>
/// <item><description><see cref="EnableGridTables"/> = <c>false</c></description></item>
/// <item><description><see cref="EnableTaskLists"/> = <c>true</c></description></item>
/// <item><description><see cref="EnableFootnotes"/> = <c>false</c></description></item>
/// <item><description><see cref="EnableGenericAttributes"/> = <c>true</c></description></item>
/// <item><description><see cref="EnableAutoIdentifiers"/> = <c>true</c></description></item>
/// <item><description><see cref="EnableAutoLinks"/> = <c>true</c></description></item>
/// <item><description><see cref="EnableSmartyPants"/> = <c>false</c></description></item>
/// <item><description><see cref="EnableFigures"/> = <c>false</c></description></item>
/// <item><description><see cref="EnableEmphasisExtras"/> = <c>true</c></description></item>
/// <item><description><see cref="EnableListExtras"/> = <c>true</c></description></item>
/// <item><description><see cref="EnableFencedCodeBlocks"/> = <c>true</c></description></item>
/// </list>
/// </summary>
public sealed class MarkdownOptions
{
    /// <summary>
    /// Gets the canonical default configuration.
    /// </summary>
    public static MarkdownOptions Default => new();

    /// <summary>
    /// Enables YAML front matter blocks (typically <c>---</c> delimited header metadata).
    /// Default: <c>true</c>.
    /// </summary>
    public bool EnableFrontMatter { get; set; } = true;

    /// <summary>
    /// Enables Markdown tables.
    /// Default: <c>true</c>.
    /// </summary>
    public bool EnableTables { get; set; } = true;

    /// <summary>
    /// Enables grid tables.
    /// Default: <c>false</c>.
    /// </summary>
    public bool EnableGridTables { get; set; } = false;

    /// <summary>
    /// Enables GitHub-style task lists (e.g. <c>- [ ]</c>, <c>- [x]</c>).
    /// Default: <c>true</c>.
    /// </summary>
    public bool EnableTaskLists { get; set; } = true;

    /// <summary>
    /// Enables footnotes.
    /// Default: <c>false</c>.
    /// </summary>
    public bool EnableFootnotes { get; set; } = false;

    /// <summary>
    /// Enables generic attributes (e.g. <c>{.class #id key=value}</c>).
    /// Default: <c>true</c>.
    /// </summary>
    public bool EnableGenericAttributes { get; set; } = true;

    /// <summary>
    /// Enables automatic identifier generation for headings.
    /// Default: <c>true</c>.
    /// </summary>
    public bool EnableAutoIdentifiers { get; set; } = true;

    /// <summary>
    /// Enables automatic link parsing.
    /// Default: <c>true</c>.
    /// </summary>
    public bool EnableAutoLinks { get; set; } = true;

    /// <summary>
    /// Enables SmartyPants typography transformations.
    /// Default: <c>false</c>.
    /// </summary>
    public bool EnableSmartyPants { get; set; } = false;

    /// <summary>
    /// Enables figure processing.
    /// Default: <c>false</c>.
    /// </summary>
    public bool EnableFigures { get; set; } = false;

    /// <summary>
    /// Enables additional emphasis parsing features.
    /// Default: <c>true</c>.
    /// </summary>
    public bool EnableEmphasisExtras { get; set; } = true;

    /// <summary>
    /// Enables additional list parsing features.
    /// Default: <c>true</c>.
    /// </summary>
    public bool EnableListExtras { get; set; } = true;

    /// <summary>
    /// Enables fenced code blocks.
    /// Default: <c>true</c>.
    /// </summary>
    public bool EnableFencedCodeBlocks { get; set; } = true;
}
