using Bunit;
using FluentUI.Blazor.Monaco.EditorPack.Wysiwyg.Components;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;

namespace FluentUI.Blazor.Monaco.EditorPack.Wysiwyg.BUnitTests;

public class WysiwygMarkdownEditorTests : TestContext
{
    private const string ModulePath = "./_content/FluentUI.Blazor.Monaco.EditorPack.Wysiwyg/js/milkdown-editor.js";

    public WysiwygMarkdownEditorTests()
    {
        Services.AddLogging();

        // The real Milkdown module only runs in a browser (covered by the bundle smoke tests), so the
        // module is loose-mocked and the editor handle comes back null (component stays uninitialized).
        JSInterop.SetupModule(ModulePath).Mode = JSRuntimeMode.Loose;
    }

    [Fact]
    public void RendersHostElement_WithIdClassAndStyle()
    {
        var cut = RenderComponent<WysiwygMarkdownEditor>(p => p
            .Add(c => c.Id, "wysiwyg-test")
            .Add(c => c.Class, "extra")
            .Add(c => c.Style, "height: 300px;"));

        var host = cut.Find("div.fluent-milkdown-host");
        Assert.Equal("wysiwyg-test", host.Id);
        Assert.Contains("extra", host.ClassName);
        Assert.Contains("height: 300px;", host.GetAttribute("style"));
    }

    [Fact]
    public async Task OnMarkdownChanged_UpdatesValue_AndRaisesValueChanged()
    {
        string? received = null;
        var cut = RenderComponent<WysiwygMarkdownEditor>(p => p
            .Add(c => c.Value, "start")
            .Add(c => c.ValueChanged, v => received = v));

        await cut.InvokeAsync(() => cut.Instance.OnMarkdownChanged("# changed\n"));

        Assert.Equal("# changed\n", received);
        Assert.Equal("# changed\n", cut.Instance.Value);
    }

    [Fact]
    public async Task OnMarkdownChanged_AfterDispose_IsIgnored()
    {
        var raised = 0;
        var cut = RenderComponent<WysiwygMarkdownEditor>(p => p
            .Add(c => c.ValueChanged, _ => raised++));

        await cut.Instance.DisposeAsync();
        await cut.Instance.OnMarkdownChanged("late");

        Assert.Equal(0, raised);
    }

    [Fact]
    public async Task GetMarkdownAsync_BeforeInitialization_ReturnsValue()
    {
        var cut = RenderComponent<WysiwygMarkdownEditor>(p => p.Add(c => c.Value, "hello"));

        // Read synchronously after the first render, before the async JS init completes in a real browser.
        var uninitialized = new WysiwygMarkdownEditor { Value = "hello" };
        Assert.False(uninitialized.IsInitialized);
        Assert.Equal("hello", await uninitialized.GetMarkdownAsync());
        Assert.NotNull(cut.Instance);
    }

    [Fact]
    public async Task GetMarkdownAsync_WhenEditorReturnsNull_ReturnsEmptyString()
    {
        var cut = RenderComponent<WysiwygMarkdownEditor>();
        cut.WaitForAssertion(() => Assert.True(cut.Instance.IsInitialized));

        Assert.Equal(string.Empty, await cut.Instance.GetMarkdownAsync());
    }

    [Fact]
    public void ModuleCreate_IsInvoked_WithInitialValue()
    {
        var cut = RenderComponent<WysiwygMarkdownEditor>(p => p.Add(c => c.Value, "keep me"));

        cut.WaitForAssertion(() => Assert.Single(JSInterop.Invocations["create"]));
        cut.WaitForAssertion(() => Assert.True(cut.Instance.IsInitialized));
    }

    [Fact]
    public async Task DisposeAsync_IsIdempotent()
    {
        var cut = RenderComponent<WysiwygMarkdownEditor>();

        await cut.Instance.DisposeAsync();
        await cut.Instance.DisposeAsync();
    }
}
