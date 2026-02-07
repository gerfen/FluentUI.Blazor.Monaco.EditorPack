using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FluentUI.Blazor.Monaco.EditorPack.Monaco
{
    public sealed class MonacoOptions
    {
        // --- Core Editor Behavior ---
        public bool WordWrap { get; set; } = true;
        public bool Minimap { get; set; } = false;
        public bool LineNumbers { get; set; } = true;
        public bool SmoothScrolling { get; set; } = true;
        public bool RenderWhitespace { get; set; } = false;

        public int FontSize { get; set; } = 14;
        public string? FontFamily { get; set; }
        public double? LineHeight { get; set; }

        // --- Theme ---
        public string Theme { get; set; } = "fluentui-auto";

        // --- Front Matter ---
        public bool EnableFrontMatter { get; set; } = false;
    }
}
