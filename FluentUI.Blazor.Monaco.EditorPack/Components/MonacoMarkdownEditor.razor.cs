using Ganss.Xss;
using Markdig;
using Microsoft.AspNetCore.Components;
using FluentUI.Blazor.Monaco.EditorPack.Memento;
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
                        _ = JSRuntime.InvokeVoidAsync("monacoMarkdownEditor.setContent", editorId_, value ?? string.Empty);
                    }
                }
            }
        }

        [Parameter]
        public string? Id { get; set; }

        [Parameter]
        public string? Css { get; set; }
        
        /// <summary>
        /// External CSS content to provide IntelliSense for class names.
        /// Parent components should aggregate CSS from multiple sources (Global, Page, Project, Market)
        /// and pass the combined CSS here.
        /// </summary>
        [Parameter]
        public string? ExternalCss { get; set; }

        [Parameter]
        public RenderFragment? LeftContent { get; set; }

        [Parameter]
        public RenderFragment? RightContent { get; set; }

        [Parameter]
        public EventCallback<string> MarkdownChanged { get; set; }

        [Parameter]
        public EventCallback OnCancelled { get; set; }

        private CancellationTokenSource? cancellationTokenSource_;
        private const int ThrottleDelayMs = 500;
        private List<string> contentChunks_ = new();
        private int expectedTotalChunks_ = 0;

        public bool IsModified => editorSession_?.IsModified ?? false;
        public bool CanUndo => editorSession_?.CanUndo ?? false;
        public bool CanRedo => editorSession_?.CanRedo ?? false;
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
                    // Create .NET object reference for callbacks
                    dotNetRef_ = DotNetObjectReference.Create(this);
                    
                    // Initialize the Monaco editor (FluentUI theme applied automatically in init)
                    isInitialized_ = await JSRuntime.InvokeAsync<bool>(
                        "monacoMarkdownEditor.init", 
                        editorId_,
                        editorSession_?.Content ?? string.Empty,
                        dotNetRef_);
                        
                    if (isInitialized_)
                    {
                        // Initialize CSS IntelliSense with provided external CSS
                        await UpdateCssIntelliSenseAsync();
                        await InvokeAsync(StateHasChanged);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[MonacoMarkdownEditor] Error initializing: {ex.Message}");
                }
            }
            
            await base.OnAfterRenderAsync(firstRender);
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

        private static MarkdownPipeline? markdownPipeline_;
        private static MarkdownPipeline MarkdownPipeline
        {
            get
            {
                if (markdownPipeline_ == null)
                {
                    markdownPipeline_ = new MarkdownPipelineBuilder()
                        .UseAdvancedExtensions() // Includes fenced code blocks, tables, etc.
                        .UseGenericAttributes() // Allows setting classes on elements
                        .Build();
                }
                return markdownPipeline_;
            }
        }

        private MarkupString CreateMarkupString()
        {
            var content = editorSession_?.Content ?? string.Empty;
            
            if (string.IsNullOrWhiteSpace(content))
            {
                return new MarkupString(string.Empty);
            }

            var html = Markdig.Markdown.ToHtml(content, MarkdownPipeline);
            
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
            
            if (!string.IsNullOrWhiteSpace(Css))
            {
                if (cssBuilder.Length > 0)
                    cssBuilder.AppendLine();
                cssBuilder.AppendLine("/* Additional CSS */");
                cssBuilder.AppendLine(CleanCss(Css));
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
