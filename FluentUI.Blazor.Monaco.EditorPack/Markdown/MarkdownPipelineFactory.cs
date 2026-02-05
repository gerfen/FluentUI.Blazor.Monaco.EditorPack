using Markdig;
using Markdig.Extensions;

namespace FluentUI.Blazor.Monaco.EditorPack.Markdown;

public static class MarkdownPipelineFactory
{
    public static MarkdownPipeline BuildDefaultPipeline()
    {
        return BuildPipeline(MarkdownOptions.Default);
    }

    public static MarkdownPipeline BuildPipeline(MarkdownOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var builder = new MarkdownPipelineBuilder();

        if (options.EnableFencedCodeBlocks)
        {
            builder.UseAdvancedExtensions();
        }

        if (options.EnableTables)
        {
            builder.UsePipeTables();
        }

        if (options.EnableGridTables)
        {
            builder.UseGridTables();
        }

        if (options.EnableTaskLists)
        {
            builder.UseTaskLists();
        }

        if (options.EnableFootnotes)
        {
            builder.UseFootnotes();
        }

        if (options.EnableGenericAttributes)
        {
            builder.UseGenericAttributes();
        }

        if (options.EnableAutoIdentifiers)
        {
            builder.UseAutoIdentifiers();
        }

        if (options.EnableAutoLinks)
        {
            builder.UseAutoLinks();
        }

        if (options.EnableSmartyPants)
        {
            builder.UseSmartyPants();
        }

        if (options.EnableFigures)
        {
            builder.UseFigures();
        }

        if (options.EnableEmphasisExtras)
        {
            builder.UseEmphasisExtras();
        }

        if (options.EnableListExtras)
        {
            builder.UseListExtras();
        }

        if (options.EnableFrontMatter)
        {
            builder.UseYamlFrontMatter();
        }

        return builder.Build();
    }
}
