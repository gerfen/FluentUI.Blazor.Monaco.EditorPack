using Microsoft.AspNetCore.Components;
using FluentUI.Blazor.Monaco.EditorPack.Memento;
using Microsoft.JSInterop;

namespace FluentUI.Blazor.Monaco.EditorPack.Components
{
    public partial class MonacoCssEditor : ComponentBase, IAsyncDisposable
    {
        private string editorId_ = $"monaco-css-editor-{Guid.NewGuid():N}";
        private string? initialCss_;
        private TextEditorSession? editorSession_;
        private DotNetObjectReference<MonacoCssEditor>? dotNetRef_;
        private bool isInitialized_ = false;
        private List<string> contentChunks_ = new();
        private int expectedTotalChunks_ = 0;


        [Inject]
        private IJSRuntime JSRuntime { get; set; } = default!;

        // =======================================================
        // CONTENT & DATA BINDING
        // =======================================================

        /// <summary>
        /// Gets the unique editor ID used for DOM binding and JS interop.
        /// </summary>
        public string EditorId => editorId_;

        /// <summary>
        /// The CSS content displayed and edited within the Monaco CSS editor.
        /// Updating this parameter programmatically will update the editor content
        /// unless the editor is currently initializing.
        /// </summary>
        [Parameter]
        public string? Css
        {
            get => editorSession_?.Content;
            set
            {
                if (value != editorSession_?.Content)
                {
                    initialCss_ = value;
                    editorSession_ = new TextEditorSession(value);

                    // Update editor content if initialized
                    if (isInitialized_)
                    {
                        _ = JSRuntime.InvokeVoidAsync(
                            "monacoCssEditor.setContent",
                            editorId_,
                            value ?? string.Empty);
                    }
                }
            }
        }

        /// <summary>
        /// Raised when the CSS content changes.  
        /// This event is throttled and chunked internally to support large documents.
        /// </summary>
        [Parameter]
        public EventCallback<string> CssChanged { get; set; }

        /// <summary>
        /// Placeholder text shown when the editor is empty.  
        /// Defaults to <c>/* Enter CSS here... */</c>.
        /// </summary>
        [Parameter]
        public string Placeholder { get; set; } = "/* Enter CSS here... */";



        // =======================================================
        // UI COMPOSITION
        // =======================================================

        /// <summary>
        /// Raised when the user cancels editing, if the hosting component
        /// provides a cancel action.
        /// </summary>
        [Parameter]
        public EventCallback OnCancelled { get; set; }

        private CancellationTokenSource? cancellationTokenSource_;
        private const int DebounceDelayMs = 300;

        /// <summary>
        /// Gets whether the content has been modified.
        /// </summary>
        public bool IsModified => editorSession_?.IsModified ?? false;

        /// <summary>
        /// Gets whether undo is available.
        /// </summary>
        public bool CanUndo => editorSession_?.CanUndo ?? false;

        /// <summary>
        /// Gets whether redo is available.
        /// </summary>
        public bool CanRedo => editorSession_?.CanRedo ?? false;

        protected override void OnInitialized()
        {
            if (editorSession_ == null)
            {
                editorSession_ = new TextEditorSession(initialCss_);
            }
            base.OnInitialized();
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                try
                {
                    // Create .NET object reference for callbacks
                    dotNetRef_ = DotNetObjectReference.Create(this);
                    
                    // Initialize the Monaco CSS editor (FluentUI theme applied automatically in init)
                    isInitialized_ = await JSRuntime.InvokeAsync<bool>(
                        "monacoCssEditor.init", 
                        editorId_,
                        editorSession_?.Content ?? string.Empty,
                        dotNetRef_);
                    
                    if (isInitialized_)
                    {
                        await InvokeAsync(StateHasChanged);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[MonacoCssEditor] Error initializing: {ex.Message}");
                }
            }
            
            await base.OnAfterRenderAsync(firstRender);
        }

        /// <summary>
        /// Called from JavaScript when a content chunk arrives.
        /// Chunks are sent sequentially for large files to avoid SignalR limits.
        /// </summary>
        [JSInvokable]
        public async Task OnContentChunk(string chunk, int chunkIndex, int totalChunks)
        {
            if (editorSession_ == null) return;

            // First chunk - initialize
            if (chunkIndex == 0)
            {
                contentChunks_.Clear();
                expectedTotalChunks_ = totalChunks;
                
                // Save state before first edit
                if (!editorSession_.IsModified)
                {
                    editorSession_.SaveState();
                    await InvokeAsync(StateHasChanged);
                }
            }

            // Add chunk
            contentChunks_.Add(chunk);

            // Last chunk - assemble and update
            if (contentChunks_.Count == expectedTotalChunks_)
            {
                var newContent = string.Concat(contentChunks_);
                contentChunks_.Clear();
                
                editorSession_.Content = newContent;
                
                // Check if content matches original state (handles undo back to original)
                editorSession_.UpdateModifiedState();

                // Cancel any pending notification
                cancellationTokenSource_?.Cancel();
                cancellationTokenSource_?.Dispose();
                cancellationTokenSource_ = new CancellationTokenSource();
                var token = cancellationTokenSource_.Token;

                try
                {
                    await Task.Delay(DebounceDelayMs, token);
                    
                    await InvokeAsync(() =>
                    {
                        StateHasChanged();
                    });

                    if (CssChanged.HasDelegate)
                    {
                        await CssChanged.InvokeAsync(newContent);
                    }
                }
                catch (TaskCanceledException)
                {
                    // User is still typing
                }
            }
        }

        /// <summary>
        /// Cancels editing and reverts to the original CSS content.
        /// Can be called from parent components.
        /// </summary>
        public async Task CancelAsync()
        {
            if (editorSession_ != null && isInitialized_)
            {
                editorSession_.CancelEdit();
                
                // Update editor content
                await JSRuntime.InvokeVoidAsync(
                    "monacoCssEditor.setContent", 
                    editorId_, 
                    editorSession_.Content);
                
                StateHasChanged();

                if (OnCancelled.HasDelegate)
                {
                    await OnCancelled.InvokeAsync();
                }
            }
        }

        /// <summary>
        /// Commits the current changes and resets the undo history.
        /// </summary>
        public void Commit()
        {
            editorSession_?.CommitEdit();
            StateHasChanged();
        }

        /// <summary>
        /// Undoes the last change.
        /// </summary>
        public async Task<bool> Undo()
        {
            if (editorSession_?.CanUndo == true && isInitialized_)
            {
                // Trigger undo in Monaco and get updated content
                var content = await JSRuntime.InvokeAsync<string>("monacoCssEditor.undo", editorId_);
                
                if (content != null)
                {
                    editorSession_.Undo();
                    editorSession_.Content = content;
                    StateHasChanged();
                    return true;
                }
            }
            return false;
        }

        /// <summary>
        /// Redoes the last undone change.
        /// </summary>
        public async Task<bool> Redo()
        {
            if (editorSession_?.CanRedo == true && isInitialized_)
            {
                // Trigger redo in Monaco and get updated content
                var content = await JSRuntime.InvokeAsync<string>("monacoCssEditor.redo", editorId_);
                
                if (content != null)
                {
                    editorSession_.Redo();
                    editorSession_.Content = content;
                    StateHasChanged();
                    return true;
                }
            }
            return false;
        }

        /// <summary>
        /// Sets the editor theme.
        /// </summary>
        /// <param name="theme">Theme name: 'vs', 'vs-dark', 'hc-black', or 'fluentui-css-auto' (default)</param>
        public async Task SetTheme(string theme)
        {
            if (isInitialized_)
            {
                await JSRuntime.InvokeVoidAsync("monacoCssEditor.setTheme", editorId_, theme);
            }
        }

        /// <summary>
        /// Refreshes the editor theme to match current FluentUI theme.
        /// Call this when the user changes the FluentUI theme (light/dark mode).
        /// </summary>
        public async Task RefreshTheme()
        {
            if (isInitialized_)
            {
                await JSRuntime.InvokeVoidAsync("monacoCssEditor.updateTheme", editorId_);
            }
        }

        /// <summary>
        /// Focuses the editor.
        /// </summary>
        public async Task Focus()
        {
            if (isInitialized_)
            {
                await JSRuntime.InvokeVoidAsync("monacoCssEditor.focus", editorId_);
            }
        }

        public async ValueTask DisposeAsync()
        {
            cancellationTokenSource_?.Cancel();
            cancellationTokenSource_?.Dispose();
            
            if (isInitialized_)
            {
                try
                {
                    await JSRuntime.InvokeVoidAsync("monacoCssEditor.dispose", editorId_);
                }
                catch
                {
                    // Best effort cleanup
                }
            }
            
            dotNetRef_?.Dispose();
        }
    }
}
