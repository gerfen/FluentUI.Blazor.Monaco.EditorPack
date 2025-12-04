namespace FluentUI.Blazor.Monaco.EditorPack.DemoApp.Components.Infrastructure;

public interface IStaticAssetService
{
    public Task<string?> GetAsync(string assetUrl, bool useCache = true);
}
