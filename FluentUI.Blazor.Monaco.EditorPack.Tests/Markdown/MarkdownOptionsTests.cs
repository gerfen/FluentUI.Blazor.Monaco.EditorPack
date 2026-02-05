using FluentUI.Blazor.Monaco.EditorPack.Markdown;

namespace FluentUI.Blazor.Monaco.EditorPack.Tests.Markdown;

public class MarkdownOptionsTests
{
    [Fact]
    public void New_HasExpectedDefaults()
    {
        var options = new MarkdownOptions();

        Assert.True(options.EnableFrontMatter);
        Assert.True(options.EnableTables);
        Assert.False(options.EnableGridTables);
        Assert.True(options.EnableTaskLists);
        Assert.False(options.EnableFootnotes);
        Assert.True(options.EnableGenericAttributes);
        Assert.True(options.EnableAutoIdentifiers);
        Assert.True(options.EnableAutoLinks);
        Assert.False(options.EnableSmartyPants);
        Assert.False(options.EnableFigures);
        Assert.True(options.EnableEmphasisExtras);
        Assert.True(options.EnableListExtras);
        Assert.True(options.EnableFencedCodeBlocks);
    }

    [Fact]
    public void Default_ReturnsNewInstanceWithDefaults()
    {
        var a = MarkdownOptions.Default;
        var b = MarkdownOptions.Default;

        Assert.NotSame(a, b);

        Assert.True(a.EnableFrontMatter);
        Assert.True(a.EnableTables);
        Assert.False(a.EnableGridTables);
        Assert.True(a.EnableTaskLists);
        Assert.False(a.EnableFootnotes);
        Assert.True(a.EnableGenericAttributes);
        Assert.True(a.EnableAutoIdentifiers);
        Assert.True(a.EnableAutoLinks);
        Assert.False(a.EnableSmartyPants);
        Assert.False(a.EnableFigures);
        Assert.True(a.EnableEmphasisExtras);
        Assert.True(a.EnableListExtras);
        Assert.True(a.EnableFencedCodeBlocks);
    }
}
