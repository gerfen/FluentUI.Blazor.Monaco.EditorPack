using FluentUI.Blazor.Monaco.EditorPack.Markdown;
using FluentUI.Blazor.Monaco.EditorPack.Memento;
using FluentUI.Blazor.Monaco.EditorPack.Monaco;
using Ganss.Xss;
using Markdig;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FluentUI.Blazor.Monaco.EditorPack.Components
{
    /// <summary>
    /// Monaco-based Markdown editor component using the official Monaco Editor from Microsoft CDN.
    /// Provides syntax highlighting, IntelliSense, and advanced editing features for Markdown.
    /// </summary>
    public partial class MonacoMarkdownEditor : ComponentBase, IAsyncDisposable
    {
        [Inject]
        public IHtmlSanitizer? HtmlSanitizer { get; set; }
        
        [Inject]
        public required IJSRuntime JSRuntime { get; set; }

        private TextEditorSession? editorSession_;
        private DotNetObjectReference<MonacoMarkdownEditor>? dotNetRef_;
        private string editorId_ = $"monaco-markdown-editor-{Guid.NewGuid():N}";
        private bool isInitialized_ = false;

        // =======================================================
        // CONTENT & DATA BINDING
        // =======================================================

        /// <summary>
        /// The Markdown content displayed and edited within the Monaco editor.
        /// Updating this parameter programmatically will update the editor content
        /// unless the editor is currently initializing.
        /// </summary>
        [Parameter]
        public string? Markdown
        {
            get => editorSession_?.Content;
            set
            {
                if (editorSession_ == null)
                {
                    editorSession_ = new TextEditorSession(value);
                }
                else if (editorSession_.Content != value)
                {
                    editorSession_ = new TextEditorSession(value);

                    // Update editor content if initialized
                    if (isInitialized_)
                    {
                        _ = JSRuntime.InvokeVoidAsync(
                            "monacoMarkdownEditor.setContent",
                            editorId_,
                            value ?? string.Empty);
                    }
                }
            }
        }

        /// <summary>
        /// Raised when the Markdown content changes.  
        /// This event is throttled and chunked internally to support large documents.
        /// </summary>
        [Parameter]
        public EventCallback<string> MarkdownChanged { get; set; }

        /// <summary>
        /// Optional DOM element ID for the editor container. If not provided,
        /// a unique ID is generated automatically.
        /// </summary>
        [Parameter]
        public string? Id { get; set; }



        // =======================================================
        // EDITOR CONFIGURATION
        // =======================================================

        /// <summary>
        /// Configuration options for Markdig Markdown processing.  
        /// These options affect Markdown parsing and rendering, not the Monaco editor.
        /// </summary>
        [Parameter]
        public MarkdownOptions? MarkdownOptions { get; set; }

        /// <summary>
        /// Configuration options for the Monaco editor instance, including editor
        /// behavior, theme, and optional front matter support.
        /// </summary>
        [Parameter]
        public MonacoOptions Options { get; set; } = new();



        // =======================================================
        // CSS INTELLISENSE INPUTS
        // =======================================================

        /// <summary>
        /// External CSS content used to provide IntelliSense for CSS class names.
        /// Parent components should aggregate CSS from multiple sources and pass
        /// the combined result here. This CSS is merged with <see cref="AdditionalCss"/>.
        /// </summary>
        [Parameter]
        public string? ExternalCss { get; set; }

        /// <summary>
        /// Additional CSS rules used to provide IntelliSense for CSS class names.
        /// This CSS is merged with <see cref="ExternalCss"/> and passed to the
        /// CSS class harvester for completion and hover support.
        /// </summary>
        [Parameter]
        public string? AdditionalCss { get; set; }



        // =======================================================
        // UI COMPOSITION
        // =======================================================

        /// <summary>
        /// Optional content rendered to the left of the editor toolbar area.
        /// Useful for injecting custom UI elements or controls.
        /// </summary>
        [Parameter]
        public RenderFragment? LeftContent { get; set; }

        /// <summary>
        /// Optional content rendered to the right of the editor toolbar area.
        /// Useful for injecting custom UI elements or controls.
        /// </summary>
        [Parameter]
        public RenderFragment? RightContent { get; set; }

        /// <summary>
        /// Raised when the user cancels editing, if the hosting component
        /// provides a cancel action.
        /// </summary>
        [Parameter]
        public EventCallback OnCancelled { get; set; }



        // =======================================================
        // LIFECYCLE EVENTS
        // =======================================================

        /// <summary>
        /// Callback invoked before the Monaco editor is created.  
        /// Provides access to the <see cref="IJSRuntime"/> so consumers may
        /// register language features, schemas, or other Monaco extensions
        /// prior to editor initialization.
        /// </summary>
        [Parameter]
        public Func<IJSRuntime, Task>? BeforeCreated { get; set; }

        /// <summary>
        /// Callback invoked after the Monaco editor has been fully initialized
        /// and the underlying <see cref="IJSObjectReference"/> for the editor
        /// instance is available.
        /// </summary>
        [Parameter]
        public Func<IJSObjectReference, Task>? AfterInitialized { get; set; }




        private CancellationTokenSource? cancellationTokenSource_;
        private const int ThrottleDelayMs = 500;
        private List<string> contentChunks_ = new();
        private int expectedTotalChunks_ = 0;

        /// <summary>
        /// Gets the unique editor ID used for DOM binding and JS interop.
        /// </summary>
        public string EditorId => editorId_;
        /// <summary>
        /// Gets a value indicating whether the editor's content has been modified
        /// since it was last loaded or saved. This reflects the state of the
        /// underlying <see cref="TextEditorSession"/> and updates as the user
        /// edits the document.
        /// </summary>
        public bool IsModified => editorSession_?.IsModified ?? false;

        /// <summary>
        /// Gets a value indicating whether the editor has at least one undoable
        /// operation available. This mirrors Monaco's internal undo stack and
        /// enables UI elements to reflect undo availability.
        /// </summary>
        public bool CanUndo => editorSession_?.CanUndo ?? false;

        /// <summary>
        /// Gets a value indicating whether the editor has at least one redoable
        /// operation available. This mirrors Monaco's internal redo stack and
        /// enables UI elements to reflect redo availability.
        /// </summary>
        public bool CanRedo => editorSession_?.CanRedo ?? false;

        /// <summary>
        /// Gets the rendered HTML produced from the current Markdown content.
        /// This value is updated whenever the Markdown changes and reflects the
        /// output of the configured Markdig pipeline.
        /// </summary>
        public MarkupString Html { get; private set; }

        protected override void OnParametersSet()
        {
            Html = CreateMarkupString();
            base.OnParametersSet();
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                try
                {
                    // 1. C# lifecycle hook BEFORE Monaco is created
                    if (BeforeCreated is not null)
                    {
                        await BeforeCreated.Invoke(JSRuntime);
                    }

                    // 2. Apply MonacoOptions BEFORE creating the editor
                    await ApplyMonacoOptionsAsync();

                    // 3. Create .NET object reference for callbacks
                    dotNetRef_ = DotNetObjectReference.Create(this);

                    // 4. Initialize the Monaco editor
                    isInitialized_ = await JSRuntime.InvokeAsync<bool>(
                        "monacoMarkdownEditor.init",
                        editorId_,
                        editorSession_?.Content ?? string.Empty,
                        dotNetRef_);

                    if (isInitialized_)
                    {
                        // Theme is managed automatically by FluentUI token integration.

                        // 5. Initialize CSS IntelliSense
                        await UpdateCssIntelliSenseAsync();
                        await InvokeAsync(StateHasChanged);

                        // 6. C# lifecycle hook AFTER Monaco is created
                        if (AfterInitialized is not null)
                        {
                            var editorRef = await JSRuntime.InvokeAsync<IJSObjectReference>(
                                "monacoMarkdownEditor.getEditor",
                                editorId_);

                            await AfterInitialized.Invoke(editorRef);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[MonacoMarkdownEditor] Error initializing: {ex.Message}");
                }
            }

            await base.OnAfterRenderAsync(firstRender);
        }

        private async Task ApplyMonacoOptionsAsync()
        {
            if (Options is null)
                return;

            // Front matter toggle
            if (Options.EnableFrontMatter)
            {
                await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.enableFrontMatter", true);
            }

            // Core editor options
            await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.setOption", "wordWrap", Options.WordWrap);
            await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.setOption", "minimap", Options.Minimap);
            await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.setOption", "lineNumbers", Options.LineNumbers);
            await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.setOption", "fontSize", Options.FontSize);

            if (!string.IsNullOrWhiteSpace(Options.FontFamily))
            {
                await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.setOption", "fontFamily", Options.FontFamily);
            }

            if (Options.LineHeight is not null)
            {
                await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.setOption", "lineHeight", Options.LineHeight);
            }

            // Theme is applied after editor creation in OnAfterRenderAsync.
        }

        protected override async Task OnParametersSetAsync()
        {
            await base.OnParametersSetAsync();
            
            // Update CSS IntelliSense when ExternalCss parameter changes
            if (isInitialized_)
            {
                await UpdateCssIntelliSenseAsync();
            }
        }

        /// <summary>
        /// Update CSS IntelliSense with external CSS content.
        /// Parent component is responsible for aggregating CSS from multiple sources.
        /// </summary>
        private async Task UpdateCssIntelliSenseAsync()
        {
            if (!isInitialized_) return;
            
            try
            {
                await JSRuntime.InvokeVoidAsync(
                    "monacoMarkdownEditor.updateCssClasses",
                    editorId_,
                    ExternalCss ?? "");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MonacoMarkdownEditor] Error updating CSS IntelliSense: {ex.Message}");
            }
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

                // Cancel any pending render
                cancellationTokenSource_?.Cancel();
                cancellationTokenSource_?.Dispose();
                cancellationTokenSource_ = new CancellationTokenSource();
                var token = cancellationTokenSource_.Token;

                try
                {
                    await Task.Delay(ThrottleDelayMs, token);
                    
                    await InvokeAsync(() =>
                    {
                        Html = CreateMarkupString();
                        StateHasChanged();
                    });

                    if (MarkdownChanged.HasDelegate)
                    {
                        await MarkdownChanged.InvokeAsync(newContent);
                    }
                }
                catch (TaskCanceledException)
                {
                    // User is still typing
                }
            }
        }

        private static MarkdownPipeline? defaultMarkdownPipeline_;

        private MarkdownPipeline GetMarkdownPipeline()
        {
            // If no options provided, keep previous behavior deterministic by using the existing default pipeline.
            if (MarkdownOptions is null)
            {
                return defaultMarkdownPipeline_ ??= CreateLegacyDefaultPipeline();
            }

            return MarkdownPipelineFactory.BuildPipeline(MarkdownOptions);
        }

        private static MarkdownPipeline CreateLegacyDefaultPipeline()
        {
            var pipeline = new MarkdownPipelineBuilder()
                .UseAdvancedExtensions() // Includes fenced code blocks, tables, etc.
                .UseGenericAttributes() // Allows setting classes on elements
                .UseYamlFrontMatter()
                .Build();

            return pipeline;
        }

        private MarkupString CreateMarkupString()
        {
            var content = editorSession_?.Content ?? string.Empty;
            
            if (string.IsNullOrWhiteSpace(content))
            {
                return new MarkupString(string.Empty);
            }

            var html = Markdig.Markdown.ToHtml(content, GetMarkdownPipeline());
            
            // Always sanitize HTML if sanitizer is available (injected via DI)
            if (HtmlSanitizer != null)
            {
                html = HtmlSanitizer.Sanitize(html);
            }

            var cssToApply = BuildCascadedCss();
            var wrapped = $"<div{(Id != null ? $" id=\"{Id}\"" : "")}>";
            
            if (!string.IsNullOrWhiteSpace(cssToApply))
            {
                wrapped += $"<style>{cssToApply}</style>";
            }
            
            wrapped += html + "</div>";
            return new MarkupString(wrapped);
        }

        private string BuildCascadedCss()
        {
            var cssBuilder = new System.Text.StringBuilder();
            
            // Note: GlobalCss, PageCss, ProjectCss, MarketCss have been removed
            // Parent components should aggregate and pass via ExternalCss parameter
            
            if (!string.IsNullOrWhiteSpace(ExternalCss))
            {
                cssBuilder.AppendLine("/* External CSS */");
                cssBuilder.AppendLine(CleanCss(ExternalCss));
            }
            
            if (!string.IsNullOrWhiteSpace(AdditionalCss))
            {
                if (cssBuilder.Length > 0)
                    cssBuilder.AppendLine();
                cssBuilder.AppendLine("/* Additional CSS */");
                cssBuilder.AppendLine(CleanCss(AdditionalCss));
            }
            
            return cssBuilder.ToString();
        }

        private static string CleanCss(string css)
        {
            if (string.IsNullOrWhiteSpace(css))
                return string.Empty;

            var cleaned = System.Text.RegularExpressions.Regex.Replace(
                css, 
                @"<\s*style[^>]*>|<\s*/\s*style\s*>", 
                string.Empty, 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase
            );

            return cleaned.Trim();
        }

        /// <summary>
        /// Cancels editing and reverts to original content.
        /// </summary>
        public async Task CancelAsync()
        {
            if (editorSession_ != null && isInitialized_)
            {
                editorSession_.CancelEdit();
                
                // Update editor content
                await JSRuntime.InvokeVoidAsync(
                    "monacoMarkdownEditor.setContent", 
                    editorId_, 
                    editorSession_.Content);
                
                Html = CreateMarkupString();
                StateHasChanged();

                if (OnCancelled.HasDelegate)
                {
                    await OnCancelled.InvokeAsync();
                }
            }
        }

        /// <summary>
        /// Commits the changes and clears undo history.
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
                var content = await JSRuntime.InvokeAsync<string>("monacoMarkdownEditor.undo", editorId_);
                
                if (content != null)
                {
                    editorSession_.Undo();
                    editorSession_.Content = content;
                    Html = CreateMarkupString();
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
                var content = await JSRuntime.InvokeAsync<string>("monacoMarkdownEditor.redo", editorId_);
                
                if (content != null)
                {
                    editorSession_.Redo();
                    editorSession_.Content = content;
                    Html = CreateMarkupString();
                    StateHasChanged();
                    return true;
                }
            }
            
            return false;
        }

        /// <summary>
        /// Disposes the component asynchronously.
        /// </summary>
        public async ValueTask DisposeAsync()
        {
            if (isInitialized_ && dotNetRef_ != null)
            {
                try
                {
                    // Dispose the Monaco editor
                    await JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.dispose", editorId_);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[MonacoMarkdownEditor] Error disposing: {ex.Message}");
                }
                finally
                {
                    dotNetRef_.Dispose();
                    dotNetRef_ = null;
                    isInitialized_ = false;
                }
            }
        }
    }
}
