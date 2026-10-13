using Microsoft.JSInterop;

namespace FluentUI.Blazor.Monaco.EditorPack.Shared.Components.Infrastructure;

public abstract class JSModule(IJSRuntime js, string moduleUrl) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _module = new(() => js.InvokeAsync<IJSObjectReference>("import", moduleUrl).AsTask());

    protected async ValueTask InvokeVoidAsync(string identifier, params object?[]? args)
    {
        var module = await _module.Value;
        await module.InvokeVoidAsync(identifier, args);
    }

    protected async ValueTask<T> InvokeAsync<T>(string identifier, params object?[]? args)
    {
        var module = await _module.Value;
        return await module.InvokeAsync<T>(identifier, args);
    }

    public virtual async ValueTask DisposeAsync()
    {
        if (_module.IsValueCreated)
        {
            try
            {
                var module = await _module.Value;
                await module.DisposeAsync();
            }
            catch (JSDisconnectedException)
            {
            }
        }

        GC.SuppressFinalize(this);
    }
}
