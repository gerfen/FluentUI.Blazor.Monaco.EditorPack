// Monaco Editor Pack - Single script loader for Blazor apps
// Loads all required Monaco Editor Pack scripts in the correct order
//
// Usage in Blazor apps (after loading Monaco's loader.js):
//   <script src="_content/FluentUI.Blazor.Monaco.EditorPack/js/monaco-editor-pack.js"></script>

(function() {
    'use strict';
    
    // Automatically detect base path from document's base href
    // This supports both local development (/) and GitHub Pages (/repo-name/)
    function getBasePath() {
        const baseElement = document.querySelector('base');
        const baseHref = baseElement ? baseElement.getAttribute('href') : '/';
        
        // If base href is just '/', we're in local dev - use absolute path
        if (baseHref === '/') {
            return '/_content/FluentUI.Blazor.Monaco.EditorPack/js/';
        }
        
        // Otherwise (GitHub Pages, etc.) - use relative path to respect base href
        return '_content/FluentUI.Blazor.Monaco.EditorPack/js/';
    }
    
    const basePath = getBasePath();
    console.log('[Monaco Editor Pack] Using base path:', basePath);
    
    // Scripts must load in this order (dependencies)
    const scripts = [
        'fluentUIDesignTokens.js',      // Must load first (used by editors)
        'cssClassHarvester.js',          // Used by editors
        'monacoCssEditorTheme.js',       // CSS editor theme
        'monacoCssEditor.js',            // CSS editor
        'monacoMarkdownEditor.js',       // Markdown editor
        'monacoMarkdownToolbar.js'       // Markdown toolbar
    ];
    
    let loadedCount = 0;
    
    function loadScript(index) {
        if (index >= scripts.length) {
            console.log(`[Monaco Editor Pack] All ${loadedCount} scripts loaded successfully`);
            // Dispatch event that Blazor can listen to if needed
            window.dispatchEvent(new CustomEvent('monaco-editor-pack-loaded', {
                detail: {
                    scriptsLoaded: loadedCount,
                    totalScripts: scripts.length
                }
            }));
            return;
        }
        
        const script = document.createElement('script');
        script.src = basePath + scripts[index];
        script.async = false; // Ensure sequential loading
        
        script.onload = () => {
            loadedCount++;
            console.log(`[Monaco Editor Pack] Loaded ${scripts[index]} (${loadedCount}/${scripts.length})`);
            loadScript(index + 1);
        };
        
        script.onerror = () => {
            console.error(`[Monaco Editor Pack] Failed to load: ${scripts[index]}`);
            // Continue loading other scripts even if one fails
            loadScript(index + 1);
        };
        
        document.head.appendChild(script);
    }
    
    // Start loading after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[Monaco Editor Pack] Starting script loading...');
            loadScript(0);
        });
    } else {
        console.log('[Monaco Editor Pack] Starting script loading...');
        loadScript(0);
    }
})();
