// Monaco CSS Editor FluentUI Theme Integration (Fluent UI Blazor 5.x)
// Theme values come from CSS custom properties via window.fluentThemeTokens.

window.monacoCssEditorTheme = {
    _dispose: null,

    /**
     * Get a Fluent UI token (5.x CSS variable, semantic key or legacy 4.x name) as a Monaco-safe value
     */
    getFluentUIToken: function(tokenName) {
        return window.fluentThemeTokens.get(tokenName);
    },

    /**
     * Define a custom Monaco theme based on the current Fluent UI 5.x tokens
     */
    defineFluentUITheme: function(themeName = 'fluentui-css-editor') {
        if (!window.monaco) {
            console.warn('[MonacoCssEditor] Monaco not loaded, cannot define theme');
            return themeName;
        }

        monaco.editor.defineTheme(themeName, window.fluentThemeTokens.buildMonacoTheme());

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
        if (this._dispose) {
            console.log('[MonacoCssEditor] Theme observer already active');
            return;
        }

        this._dispose = window.fluentThemeTokens.onChange(() => {
            console.log('[MonacoCssEditor] FluentUI theme changed, refreshing...');
            this.applyTheme();
        });
        console.log('[MonacoCssEditor] Theme change observer activated');
    },

    /**
     * Stop watching for theme changes
     */
    stopWatching: function() {
        if (this._dispose) {
            this._dispose();
            this._dispose = null;
            console.log('[MonacoCssEditor] Theme change observer stopped');
        }
    }
};

console.log('[MonacoCssEditorTheme] Module loaded');
