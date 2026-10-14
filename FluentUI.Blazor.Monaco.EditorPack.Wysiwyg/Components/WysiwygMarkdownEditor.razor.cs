using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;

namespace FluentUI.Blazor.Monaco.EditorPack.Wysiwyg.Components;

/// <summary>
/// WYSIWYG Markdown editor built on Milkdown. Edits are exchanged with the host as Markdown.
/// </summary>
public partial class WysiwygMarkdownEditor : ComponentBase, IAsyncDisposable
{
    private const string ModulePath = "./_content/FluentUI.Blazor.Monaco.EditorPack.Wysiwyg/js/milkdown-editor.js";

    private ElementReference host_;
    private IJSObjectReference? module_;
    private IJSObjectReference? editor_;
    private DotNetObjectReference<WysiwygMarkdownEditor>? dotNetRef_;
    private bool disposed_;

    // The last value known to be in sync between the host and the editor; prevents echo loops.
    private string lastSyncedValue_ = string.Empty;
    private bool lastReadOnly_;

    [Inject]
    private IJSRuntime JSRuntime { get; set; } = default!;

    [Inject]
    private ILogger<WysiwygMarkdownEditor> Logger { get; set; } = default!;

    /// <summary>The Markdown content. Supports <c>@bind-Value</c>.</summary>
    [Parameter]
    public string? Value { get; set; }

    /// <summary>Raised (debounced) when the user edits the content.</summary>
    [Parameter]
    public EventCallback<string> ValueChanged { get; set; }

    /// <summary>When true the content cannot be edited.</summary>
    [Parameter]
    public bool ReadOnly { get; set; }

    /// <summary>Placeholder text shown when the document is empty.</summary>
    [Parameter]
    public string? Placeholder { get; set; }

    /// <summary>Optional DOM id for the editor host element.</summary>
    [Parameter]
    public string? Id { get; set; }

    /// <summary>Additional CSS classes for the host element.</summary>
    [Parameter]
    public string? Class { get; set; }

    /// <summary>Inline style for the host element.</summary>
    [Parameter]
    public string? Style { get; set; }

    /// <summary>Gets a value indicating whether the editor has finished initializing.</summary>
    public bool IsInitialized => editor_ is not null;

    /// <summary>Gets the current Markdown from the editor, or the last known value before initialization.</summary>
    public async Task<string> GetMarkdownAsync()
    {
        if (editor_ is null)
        {
            return Value ?? string.Empty;
        }

        return await editor_.InvokeAsync<string?>("getMarkdown") ?? string.Empty;
    }

    /// <summary>Moves keyboard focus into the editor.</summary>
    public async Task FocusAsync()
    {
        if (editor_ is not null)
        {
            await editor_.InvokeVoidAsync("focus");
        }
    }

    protected override async Task OnParametersSetAsync()
    {
        if (editor_ is null || disposed_)
        {
            return;
        }

        var value = Value ?? string.Empty;
        if (!string.Equals(value, lastSyncedValue_, StringComparison.Ordinal))
        {
            lastSyncedValue_ = value;
            await editor_.InvokeVoidAsync("setMarkdown", value);
        }

        if (ReadOnly != lastReadOnly_)
        {
            lastReadOnly_ = ReadOnly;
            await editor_.InvokeVoidAsync("setReadOnly", ReadOnly);
        }
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender)
        {
            return;
        }

        try
        {
            module_ = await JSRuntime.InvokeAsync<IJSObjectReference>("import", ModulePath);
            if (disposed_)
            {
                await module_.DisposeAsync();
                module_ = null;
                return;
            }

            dotNetRef_ = DotNetObjectReference.Create(this);
            lastSyncedValue_ = Value ?? string.Empty;
            lastReadOnly_ = ReadOnly;

            var editor = await module_.InvokeAsync<IJSObjectReference>(
                "create",
                host_,
                new { value = lastSyncedValue_, readOnly = ReadOnly, placeholder = Placeholder },
                dotNetRef_);

            if (disposed_)
            {
                await DestroyEditorAsync(editor);
                return;
            }

            editor_ = editor;

            // Parameters may have changed while the editor was starting up.
            await OnParametersSetAsync();
        }
        catch (JSDisconnectedException)
        {
            // Circuit ended while initializing; nothing to clean up client-side.
        }
        catch (OperationCanceledException)
        {
        }
        catch (JSException ex)
        {
            // Leave the editor uninitialized instead of crashing the circuit; GetMarkdownAsync falls back to Value.
            Logger.LogError(ex, "Failed to initialize the WYSIWYG Markdown editor.");
        }
    }

    /// <summary>Invoked from JavaScript
    [JSInvokable]
    public async Task OnMarkdownChanged(string markdown)
    {
        if (disposed_)
        {
            return;
        }

        lastSyncedValue_ = markdown;
        Value = markdown;

        if (ValueChanged.HasDelegate)
        {
            await ValueChanged.InvokeAsync(markdown);
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (disposed_)
        {
            return;
        }

        disposed_ = true;

        try
        {
            if (editor_ is not null)
            {
                await DestroyEditorAsync(editor_);
                editor_ = null;
            }

            if (module_ is not null)
            {
                await module_.DisposeAsync();
                module_ = null;
            }
        }
        catch (JSDisconnectedException)
        {
        }
        catch (OperationCanceledException)
        {
        }
        finally
        {
            dotNetRef_?.Dispose();
            dotNetRef_ = null;
        }
    }

    private static async Task DestroyEditorAsync(IJSObjectReference editor)
    {
        try
        {
            await editor.InvokeVoidAsync("destroy");
        }
        finally
        {
            await editor.DisposeAsync();
        }
    }
}
