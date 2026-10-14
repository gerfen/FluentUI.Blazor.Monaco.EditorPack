using FluentUI.Blazor.Monaco.EditorPack.Extensions;
using Ganss.Xss;
using Microsoft.Extensions.DependencyInjection;

namespace FluentUI.Blazor.Monaco.EditorPack.Tests.Extensions;

public class ServiceCollectionExtensionsTests
{
    private const string Html =
        "<p class=\"a\" id=\"b\" onclick=\"x()\">hi</p><style>body{display:none}</style><iframe src=\"https://example.com\"></iframe><script>x()</script>";

    private static string Sanitize(Action<MonacoEditorPackOptions>? configure)
    {
        var services = new ServiceCollection();
        if (configure is null) services.AddMonacoEditorPack(); else services.AddMonacoEditorPack(configure);
        using var provider = services.BuildServiceProvider();
        return provider.GetRequiredService<IHtmlSanitizer>().Sanitize(Html);
    }

    [Fact]
    public void Defaults_StripStyleIframeScriptAndHandlers()
    {
        var result = Sanitize(null);

        Assert.DoesNotContain("<style", result);
        Assert.DoesNotContain("<iframe", result);
        Assert.DoesNotContain("<script", result);
        Assert.DoesNotContain("onclick", result);
        Assert.Contains("class=\"a\"", result);
        Assert.Contains("id=\"b\"", result);
    }

    [Fact]
    public void OptIn_AllowsStyle_ButNotIframe()
    {
        var result = Sanitize(o => o.AllowStyleTags = true);

        Assert.Contains("<style", result);
        Assert.DoesNotContain("<iframe", result);
    }

    [Fact]
    public void OptIn_AllowsIframe_ButNotStyle()
    {
        var result = Sanitize(o => o.AllowIframes = true);

        Assert.Contains("<iframe", result);
        Assert.DoesNotContain("<style", result);
    }

    [Fact]
    public void OptIn_NeverAllowsScriptOrHandlers()
    {
        var result = Sanitize(o => { o.AllowStyleTags = true; o.AllowIframes = true; });

        Assert.DoesNotContain("<script", result);
        Assert.DoesNotContain("onclick", result);
    }
}
