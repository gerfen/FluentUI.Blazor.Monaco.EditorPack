// Monaco CSS Editor FluentUI Theme Integration
// Provides automatic theme synchronization for BlazorMonaco CSS editor

window.monacoCssEditorTheme = {
    _observer: null,

    /**
     * Get FluentUI design token value from computed styles
     * Reuses existing fluentUIDesignTokens if available
     */
    getFluentUIToken: function(tokenName) {
        // Try to use existing token harvester first
        if (window.fluentUIDesignTokens?.getFluentUIToken) {
            return window.fluentUIDesignTokens.getFluentUIToken(tokenName);
        }
        
        // Fallback: read directly from DOM
        const rootStyles = getComputedStyle(document.documentElement);
        const bodyStyles = getComputedStyle(document.body);
        
        let value = rootStyles.getPropertyValue(tokenName).trim();
        if (!value) {
            value = bodyStyles.getPropertyValue(tokenName).trim();
        }
        
        return value || null;
    },

    /**
     * Define a custom Monaco theme based on FluentUI design tokens
     */
    defineFluentUITheme: function(themeName = 'fluentui-css-editor') {
        if (!window.monaco) {
            console.warn('[MonacoCssEditor] Monaco not loaded, cannot define theme');
            return themeName;
        }

        // Get FluentUI colors from CSS custom properties
        const editorBackground = this.getFluentUIToken('--neutral-fill-layer-rest') || '#1e1e1e';
        const foregroundColor = this.getFluentUIToken('--neutral-foreground-rest') || '#d4d4d4';
        const lineNumberColor = this.getFluentUIToken('--neutral-foreground-hint') || '#858585';
        const selectionBackground = this.getFluentUIToken('--accent-fill-rest') || '#264f78';
        const cursorColor = this.getFluentUIToken('--accent-fill-rest') || '#aeafad';
        const lineHighlight = this.getFluentUIToken('--neutral-fill-hover') || '#2a2d2e';
        const hoverBackground = this.getFluentUIToken('--neutral-fill-secondary-hover') || '#2a2d2e';
        const borderColor = this.getFluentUIToken('--neutral-stroke-layer-rest') || '#454545';
        
        // Define custom theme (same color mapping as markdown editor)
        monaco.editor.defineTheme(themeName, {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: (this.getFluentUIToken('--neutral-foreground-hint') || '#6a9955').replace('#', ''), fontStyle: 'italic' },
                { token: 'keyword', foreground: (this.getFluentUIToken('--accent-fill-rest') || '#569cd6').replace('#', '') },
                { token: 'string', foreground: (this.getFluentUIToken('--colorStatusSuccessForeground1') || '#ce9178').replace('#', '') },
                { token: 'number', foreground: (this.getFluentUIToken('--accent-foreground-rest') || '#b5cea8').replace('#', '') },
            ],
            colors: {
                'editor.background': editorBackground,
                'editor.foreground': foregroundColor,
                'editorLineNumber.foreground': lineNumberColor,
                'editorLineNumber.activeForeground': foregroundColor,
                'editorCursor.foreground': cursorColor,
                'editor.selectionBackground': selectionBackground + '40',
                'editor.inactiveSelectionBackground': selectionBackground + '20',
                'editor.lineHighlightBackground': lineHighlight,
                'scrollbarSlider.background': (this.getFluentUIToken('--neutral-fill-stealth-rest') || '#797979') + '40',
                'scrollbarSlider.hoverBackground': (this.getFluentUIToken('--neutral-fill-stealth-hover') || '#646464') + '60',
                'scrollbarSlider.activeBackground': (this.getFluentUIToken('--neutral-fill-stealth-active') || '#bfbfbf') + '80',
                'editorGutter.background': editorBackground,
                'editorWhitespace.foreground': lineNumberColor + '40',
                'editorIndentGuide.background': lineNumberColor + '20',
                'editorIndentGuide.activeBackground': lineNumberColor + '40',
                
                // Suggest widget (dropdown/IntelliSense)
                'editorSuggestWidget.background': editorBackground,
                'editorSuggestWidget.foreground': foregroundColor,
                'editorSuggestWidget.border': borderColor,
                'editorSuggestWidget.selectedBackground': hoverBackground,
                'editorSuggestWidget.selectedForeground': foregroundColor,
                'editorSuggestWidget.highlightForeground': selectionBackground,
                'editorSuggestWidget.focusHighlightForeground': selectionBackground,
                
                // Hover widget
                'editorHoverWidget.background': editorBackground,
                'editorHoverWidget.foreground': foregroundColor,
                'editorHoverWidget.border': borderColor,
                
                // Peek view (used in some IntelliSense scenarios)
                'peekView.border': borderColor,
                'peekViewEditor.background': editorBackground,
                'peekViewResult.background': editorBackground,
                'peekViewTitle.background': editorBackground,
            }
        });

        console.log(`[MonacoCssEditor] Defined FluentUI theme: ${themeName}`);
        return themeName;
    },

    /**
     * Apply FluentUI theme to Monaco editor
     */
    applyTheme: function() {
        if (!window.monaco) {
            console.warn('[MonacoCssEditor] Monaco not loaded, cannot apply theme');
            return;
        }

        const themeName = this.defineFluentUITheme();
        monaco.editor.setTheme(themeName);
        console.log('[MonacoCssEditor] FluentUI theme applied:', themeName);
    },

    /**
     * Start watching for FluentUI theme changes
     */
    startWatching: function() {
        if (this._observer) {
            console.log('[MonacoCssEditor] Theme observer already active');
            return;
        }

        this._observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class')) {
                    console.log('[MonacoCssEditor] FluentUI theme changed, refreshing...');
                    this.applyTheme();
                    break;
                }
            }
        });

        if (document.body) {
            this._observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['data-theme', 'class']
            });
            console.log('[MonacoCssEditor] Theme change observer activated');
        } else {
            console.warn('[MonacoCssEditor] Body element not found, cannot observe theme changes');
        }
    },

    /**
     * Stop watching for theme changes
     */
    stopWatching: function() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
            console.log('[MonacoCssEditor] Theme change observer deactivated');
        }
    }
};

console.log('[MonacoCssEditor] Theme module loaded');
