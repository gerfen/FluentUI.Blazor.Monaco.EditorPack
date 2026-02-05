using FluentUI.Blazor.Monaco.EditorPack.Markdown;
using Markdig;

namespace FluentUI.Blazor.Monaco.EditorPack.Tests.Markdown;

public class MarkdownPipelineFactoryTests
{
    [Fact]
    public void BuildDefaultPipeline_DoesNotThrow()
    {
        var pipeline = MarkdownPipelineFactory.BuildDefaultPipeline();
        Assert.NotNull(pipeline);
    }

    [Fact]
    public void BuildPipeline_SameOptions_ProducesDeterministicHtml()
    {
        var options = new MarkdownOptions();
        const string md = "# Title\n\n- [x] Done";

        var html1 = Markdig.Markdown.ToHtml(md, MarkdownPipelineFactory.BuildPipeline(options));
        var html2 = Markdig.Markdown.ToHtml(md, MarkdownPipelineFactory.BuildPipeline(options));

        Assert.Equal(html1, html2);
    }

    [Fact]
    public void EnableFrontMatter_WhenEnabled_ConsumesFrontMatter()
    {
        const string md = "---\ntitle: Hello\n---\n\n# Heading\n";

        var options = new MarkdownOptions { EnableFrontMatter = true };
        var html = Markdig.Markdown.ToHtml(md, MarkdownPipelineFactory.BuildPipeline(options));

        Assert.DoesNotContain("title:", html, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EnableFootnotes_WhenEnabled_ProducesFootnoteHtml()
    {
        const string md = "Footnote.[^1]\n\n[^1]: Footnote text\n";

        var options = new MarkdownOptions { EnableFootnotes = true };
        var html = Markdig.Markdown.ToHtml(md, MarkdownPipelineFactory.BuildPipeline(options));

        Assert.Contains("fnref", html, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("fn:", html, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EnableGenericAttributes_WhenEnabled_EmitsClassAttribute()
    {
        const string md = "Text {.my-class}\n";

        var options = new MarkdownOptions { EnableGenericAttributes = true };
        var html = Markdig.Markdown.ToHtml(md, MarkdownPipelineFactory.BuildPipeline(options));

        Assert.Contains("my-class", html, StringComparison.OrdinalIgnoreCase);
    }
}
