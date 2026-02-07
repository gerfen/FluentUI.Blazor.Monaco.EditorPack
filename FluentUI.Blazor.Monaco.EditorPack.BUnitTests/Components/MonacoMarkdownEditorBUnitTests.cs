using Bunit;
using FluentUI.Blazor.Monaco.EditorPack.Components;
using Ganss.Xss;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.FluentUI.AspNetCore.Components;

namespace FluentUI.Blazor.Monaco.EditorPack.BUnitTests.Components;

public class MonacoMarkdownEditorBUnitTests : TestContext
{
    public MonacoMarkdownEditorBUnitTests()
    {
        Services.AddSingleton<IHtmlSanitizer>(_ => new HtmlSanitizer());
        Services.AddSingleton(new LibraryConfiguration());

        JSInterop.Mode = JSRuntimeMode.Loose;

        JSInterop.Setup<bool>("monacoMarkdownEditor.init", _ => true);
        JSInterop.SetupVoid("monacoMarkdownEditor.updateCssClasses");
        JSInterop.SetupVoid("monacoMarkdownEditor.dispose");
        JSInterop.SetupVoid("monacoMarkdownEditor.setContent");
    }

    [Fact]
    public void RendersPreview_WithMarkdown()
    {
        var cut = RenderComponent<MonacoMarkdownEditor>(parameters =>
            parameters.Add(p => p.Markdown, "# Hello"));

        Assert.Contains("<h1", cut.Markup, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Hello", cut.Markup, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void AppliesId_ToPreviewWrapper_WhenProvided()
    {
        var cut = RenderComponent<MonacoMarkdownEditor>(parameters =>
            parameters
                .Add(p => p.Id, "preview-id")
                .Add(p => p.Markdown, "Hello"));

        Assert.Contains("id=\"preview-id\"", cut.Markup, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void RendersLeftAndRightContent()
    {
        var cut = RenderComponent<MonacoMarkdownEditor>(parameters =>
            parameters
                .Add(p => p.Markdown, "Hello")
                .Add<RenderFragment>(p => p.LeftContent, b => b.AddMarkupContent(0, "<div id=\"left\">L</div>"))
                .Add<RenderFragment>(p => p.RightContent, b => b.AddMarkupContent(0, "<div id=\"right\">R</div>")));

        Assert.Contains("id=\"left\"", cut.Markup, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("id=\"right\"", cut.Markup, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void MarkdownOptions_CanEnableFootnotesInPreview()
    {
        const string md = "Footnote.[^1]\n\n[^1]: Footnote text\n";

        var cut = RenderComponent<MonacoMarkdownEditor>(parameters =>
            parameters
                .Add(p => p.Markdown, md)
                .Add(p => p.MarkdownOptions, new FluentUI.Blazor.Monaco.EditorPack.Markdown.MarkdownOptions { EnableFootnotes = true }));

        Assert.Contains("fnref", cut.Markup, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void OnBeforeMonacoCreated_IsInvokedOnce()
    {
        var called = 0;

        var cut = RenderComponent<MonacoMarkdownEditor>(parameters =>
            parameters
                .Add(p => p.Markdown, "Hello")
                .Add(p => p.BeforeCreated, _ =>
                {
                    called++;
                    return Task.CompletedTask;
                }));

        cut.WaitForAssertion(() => Assert.Equal(1, called), timeout: TimeSpan.FromSeconds(2));
    }
}
