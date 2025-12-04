using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FluentUI.Blazor.Monaco.EditorPack.Components
{
    /// <summary>
    /// Toolbar component for markdown formatting commands in Monaco Editor
    /// </summary>
    public partial class MarkdownToolbar : ComponentBase
    {
        [Inject]
        public required IJSRuntime JSRuntime { get; set; }

        /// <summary>
        /// The ID of the Monaco editor instance to control
        /// </summary>
        [Parameter]
        public required string EditorId { get; set; }

        /// <summary>
        /// Execute a markdown command in the Monaco editor
        /// </summary>
        private async Task ExecuteCommand(string commandId)
        {
            try
            {
                await JSRuntime.InvokeVoidAsync("monacoMarkdownToolbar.executeCommand", EditorId, commandId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MarkdownToolbar] Error executing command '{commandId}': {ex.Message}");
            }
        }

        /// <summary>
        /// Get tooltip text with keyboard shortcut
        /// </summary>
        private string GetTooltip(string label, string shortcut)
        {
            // Detection de la plateforme Mac pour l'affichage correct des touches
    var isMac = JSRuntime is IJSInProcessRuntime jsInProcess 
        ? jsInProcess.Invoke<bool>("eval", "navigator.platform.toUpperCase().indexOf('MAC') >= 0")
        : false;

            var displayShortcut = shortcut;
            if (isMac)
            {
                displayShortcut = shortcut
                    .Replace("Ctrl", "?")
                    .Replace("Alt", "?")
                    .Replace("Shift", "?");
            }

            return $"{label} ({displayShortcut})";
        }
    }
}
