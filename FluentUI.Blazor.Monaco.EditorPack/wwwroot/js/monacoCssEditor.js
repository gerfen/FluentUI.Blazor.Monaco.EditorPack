// Monaco CSS Editor JavaScript Interop
// Direct API implementation - no BlazorMonaco dependency
// Uses LOCAL Monaco Editor files (no CDN dependency)

window.monacoCssEditor = {
    editors: new Map(),
    monacoLoaded: false,
    fluentUITokenProvidersRegistered: false,
    cssColorProviderRegistered: false,  // Add flag for color provider

    /**
     * Load Monaco Editor from LOCAL files (bundled in wwwroot)
     */
    loadMonaco: async function() {
        if (this.monacoLoaded) {
            return Promise.resolve(true);
        }

        if (this.monacoLoadPromise) {
            return this.monacoLoadPromise;
        }

        this.monacoLoadPromise = new Promise((resolve, reject) => {
            // Configure Monaco's AMD loader to use local files from RCL static assets
            require.config({ 
                paths: { 
                    'vs': '/_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs'
                }
            });

            require(['vs/editor/editor.main'], () => {
                // Configure Monaco environment for web workers with absolute URL
                const baseUrl = window.location.origin;
                window.MonacoEnvironment = {
                    getWorkerUrl: function(workerId, label) {
                        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                            self.MonacoEnvironment = {
                                baseUrl: '${baseUrl}/_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/'
                            };
                            importScripts('${baseUrl}/_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/vs/base/worker/workerMain.js');
                        `)}`;
                    }
                };
                
                console.log('[MonacoCss] Monaco Editor loaded successfully from local files');
                this.monacoLoaded = true;
                resolve(true);
            }, (err) => {
                console.error('[MonacoCss] Failed to load Monaco Editor:', err);
                reject(err);
            });
        });

        return this.monacoLoadPromise;
    },
    
    /**
     * Configure Monaco CSS language defaults for color decorators and IntelliSense
     */
    configureCssLanguageDefaults: function() {
        try {
            if (window.monaco && monaco.languages && monaco.languages.css) {
                // Disable web workers - run language services in main thread
                // This avoids worker loading issues and works fine for small-medium CSS files
                window.MonacoEnvironment = {
                    getWorker: function() {
                        // Return null to disable web workers
                        // Monaco will fall back to running language services in main thread
                        return null;
                    }
                };
                
                monaco.languages.css.cssDefaults.setOptions({
                    validate: true,
                    lint: {
                        compatibleVendorPrefixes: 'warning',
                        vendorPrefix: 'warning',
                        duplicateProperties: 'warning',
                        emptyRules: 'warning',
                        importStatement: 'ignore',
                        boxModel: 'warning',
                        universalSelector: 'ignore',
                        zeroUnits: 'warning',
                        fontFaceProperties: 'warning',
                        hexColorLength: 'warning',
                        argumentsInColorFunction: 'warning',
                        unknownProperties: 'warning',
                        ieHack: 'ignore',
                        unknownVendorSpecificProperties: 'ignore',
                        propertyIgnoredDueToDisplay: 'warning',
                        important: 'ignore',
                        float: 'ignore',
                        idSelector: 'ignore'
                    }
                });
                
                // Register custom color provider for CSS variables (FluentUI tokens)
                this.registerCssVariableColorProvider();
                
                console.log('[MonacoCss] CSS language defaults configured - color decorators enabled');
                console.log('[MonacoCss] Running in main thread (web workers disabled) for compatibility');
            } else {
                console.warn('[MonacoCss] CSS language service not available for configuration');
            }
        } catch (error) {
            console.error('[MonacoCss] Failed to configure CSS language defaults:', error);
        }
    },
    
    /**
     * Register a custom color provider to show swatches for CSS variables ONLY
     * Regular colors (hex, rgb, named) are handled by Monaco's built-in provider
     */
    registerCssVariableColorProvider: function() {
        // Check if already registered
        if (this.cssColorProviderRegistered) {
            console.log('[MonacoCss] CSS color provider already registered');
            return;
        }
        
        try {
            monaco.languages.registerColorProvider('css', {
                provideDocumentColors: async function(model) {
                    const colors = [];
                    const text = model.getValue();
                    
                    // ONLY match var(--token-name) patterns - let Monaco handle regular colors
                    const varPattern = /var\(\s*(--[\w-]+)\s*\)/g;
                    let match;
                    
                    while ((match = varPattern.exec(text)) !== null) {
                        const varName = match[1];
                        
                        // Get token value from FluentUI design tokens
                        if (!window.fluentUIDesignTokens) continue;
                        
                        const varValue = await window.fluentUIDesignTokens.getTokenValue(varName);
                        
                        if (varValue && isColor(varValue)) {
                            const startPos = model.getPositionAt(match.index);
                            const endPos = model.getPositionAt(match.index + match[0].length);
                            
                            colors.push({
                                color: parseColor(varValue),
                                range: {
                                    startLineNumber: startPos.lineNumber,
                                    startColumn: startPos.column,
                                    endLineNumber: endPos.lineNumber,
                                    endColumn: endPos.column
                                }
                            });
                        }
                    }
                    
                    return colors;
                },
                
                provideColorPresentations: function(model, colorInfo) {
                    // Return empty - we don't want to allow editing CSS variable values
                    // Users should edit the design token definitions, not the var() references
                    return [];
                }
            });
            
            this.cssColorProviderRegistered = true;  // Set flag after successful registration
            console.log('[MonacoCss] CSS variable color provider registered (var(--token) only)');
        } catch (error) {
            console.error('[MonacoCss] Failed to register CSS variable color provider:', error);
        }

        // Helper function to check if a value is a color
        function isColor(value) {
            if (!value) return false;
            // Check for hex, rgb, rgba, hsl, hsla, or named colors
            return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value) ||
                   /^rgba?\(/.test(value) ||
                   /^hsla?\(/.test(value) ||
                   /^(transparent|currentColor|inherit|initial|unset)$/i.test(value) ||
                   isNamedColor(value);
        }
        
        // Helper function to check named colors
        function isNamedColor(value) {
            const namedColors = ['black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 
                               'gray', 'grey', 'orange', 'purple', 'pink', 'brown', 'lime', 'navy', 'teal'];
            return namedColors.includes(value.toLowerCase());
        }
        
        // Helper function to parse color string to Monaco color object
        function parseColor(colorString) {
            // Create a temporary element to parse the color
            const tempEl = document.createElement('div');
            tempEl.style.color = colorString;
            document.body.appendChild(tempEl);
            
            const computed = window.getComputedStyle(tempEl).color;
            document.body.removeChild(tempEl);
            
            // Parsergb(a) format
            const rgbaMatch = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbaMatch) {
                return {
                    red: parseInt(rgbaMatch[1]) / 255,
                    green: parseInt(rgbaMatch[2]) / 255,
                    blue: parseInt(rgbaMatch[3]) / 255,
                    alpha: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
                };
            }
            
            // Fallback
            return { red: 0, green: 0, blue: 0, alpha: 1 };
        }
        
        // Helper function to convert rgba to hex
        function rgbaToHex(color) {
            const r = Math.round(color.red * 255).toString(16).padStart(2, '0');
            const g = Math.round(color.green * 255).toString(16).padStart(2, '0');
            const b = Math.round(color.blue * 255).toString(16).padStart(2, '0');
            const a = color.alpha < 1 ? Math.round(color.alpha * 255).toString(16).padStart(2, '0') : '';
            return `#${r}${g}${b}${a}`.toUpperCase();
        }
    },

    /**
     * Get FluentUI design token value from computed styles
     */
    getFluentUIToken: function(tokenName) {
        const rootStyles = getComputedStyle(document.documentElement);
        const bodyStyles = getComputedStyle(document.body);
        
        // Try root first, then body
        let value = rootStyles.getPropertyValue(tokenName).trim();
        if (!value) {
            value = bodyStyles.getPropertyValue(tokenName).trim();
        }
        
        return value || null;
    },

    /**
     * Get luminance to determine if theme is light or dark
     */
    getGlobalLuminance: async function() {
        try {
            // Use FluentUI's luminance calculation
            const fluentModule = await import('/_content/Microsoft.FluentUI.AspNetCore.Components/Components/DesignSystemProvider/FluentDesignTheme.razor.js');
            const luminance = await fluentModule.GetGlobalLuminance();
            const realLuminance = luminance || '1.0';
            const isDark = parseFloat(realLuminance) < 0.5;
            return !isDark; // Return true if light mode
        } catch (error) {
            console.warn('[MonacoCss] Could not get luminance, falling back to computed style detection');
            // Fallback to checking computed background color
            const bodyBg = getComputedStyle(document.body).backgroundColor;
            if (bodyBg) {
                const rgb = bodyBg.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    const brightness = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
                    return brightness > 128; // Light if average > 128
                }
            }
            return false; // Default to dark
        }
    },

    /**
     * Define a custom Monaco theme based on FluentUI design tokens
     * Uses unique theme name to avoid conflicts with Markdown editor
     */
    defineFluentUITheme: async function(themeName = 'fluentui-css-auto') {
        if (!window.monaco) {
            console.warn('[MonacoCss] Monaco not loaded, cannot define theme');
            return themeName;
        }

        // Detect if FluentUI is in light or dark mode using luminance
        const isLightMode = await this.getGlobalLuminance();
        
        const baseTheme = isLightMode ? 'vs' : 'vs-dark';
        
        // Get FluentUI colors from CSS custom properties
        const backgroundColor = this.getFluentUIToken('--neutral-layer-1') || (isLightMode ? '#ffffff' : '#1e1e1e');
        const foregroundColor = this.getFluentUIToken('--neutral-foreground-rest') || (isLightMode ? '#000000' : '#d4d4d4');
        const editorBackground = this.getFluentUIToken('--neutral-fill-layer-rest') || (isLightMode ? '#ffffff' : '#1e1e1e');
        const lineNumberColor = this.getFluentUIToken('--neutral-foreground-hint') || (isLightMode ? '#6e6e6e' : '#858585');
        const selectionBackground = this.getFluentUIToken('--accent-fill-rest') || (isLightMode ? '#0078d4' : '#264f78');
        const cursorColor = this.getFluentUIToken('--accent-fill-rest') || (isLightMode ? '#000000' : '#aeafad');
        const commentColor = this.getFluentUIToken('--neutral-foreground-hint') || (isLightMode ? '#008000' : '#6a9955');
        const hoverBackground = this.getFluentUIToken('--neutral-fill-secondary-hover') || (isLightMode ? '#f3f2f1' : '#2a2d2e');
        const borderColor = this.getFluentUIToken('--neutral-stroke-layer-rest') || (isLightMode ? '#8a8886' : '#454545');
        
        // Define custom theme for CSS editor
        monaco.editor.defineTheme(themeName, {
            base: baseTheme,
            inherit: true,
            rules: [
                { token: 'comment.css', foreground: commentColor.replace('#', ''), fontStyle: 'italic' },
                { token: 'keyword.css', foreground: (this.getFluentUIToken('--accent-fill-rest') || (isLightMode ? '#0078d4' : '#569cd6')).replace('#', '') },
                { token: 'string.css', foreground: (this.getFluentUIToken('--colorStatusSuccessForeground1') || (isLightMode ? '#a31515' : '#ce9178')).replace('#', '') },
                { token: 'number.css', foreground: (this.getFluentUIToken('--accent-foreground-rest') || (isLightMode ? '#09885a' : '#b5cea8')).replace('#', '') },
                { token: 'variable.css', foreground: (this.getFluentUIToken('--colorStatusSuccessForeground1') || (isLightMode ? '#001080' : '#9cdcfe')).replace('#', '') },
                { token: 'tag.css', foreground: (this.getFluentUIToken('--accent-fill-rest') || (isLightMode ? '#800000' : '#569cd6')).replace('#', '') },
                // Make punctuation (including curly braces) more visible in light mode
                { token: 'delimiter.curly.css', foreground: isLightMode ? '000000' : 'dcdcdc', fontStyle: 'bold' },
                { token: 'delimiter.bracket.css', foreground: isLightMode ? '000000' : 'dcdcdc' },
                { token: 'delimiter.css', foreground: isLightMode ? '000000' : 'dcdcdc' },
            ],
            colors: {
                'editor.background': editorBackground,
                'editor.foreground': foregroundColor,
                'editorLineNumber.foreground': lineNumberColor,
                'editorLineNumber.activeForeground': foregroundColor,
                'editorCursor.foreground': cursorColor,
                'editor.selectionBackground': selectionBackground + (isLightMode ? '50' : '40'),
                'editor.inactiveSelectionBackground': selectionBackground + (isLightMode ? '30' : '20'),
                'editor.lineHighlightBackground': this.getFluentUIToken('--neutral-fill-hover') || (isLightMode ? '#f3f2f1' : '#2a2d2e'),
                'scrollbarSlider.background': (this.getFluentUIToken('--neutral-fill-stealth-rest') || (isLightMode ? '#c8c6c4' : '#797979')) + (isLightMode ? '60' : '40'),
                'scrollbarSlider.hoverBackground': (this.getFluentUIToken('--neutral-fill-stealth-hover') || (isLightMode ? '#a19f9d' : '#646464')) + (isLightMode ? '80' : '60'),
                'scrollbarSlider.activeBackground': (this.getFluentUIToken('--neutral-fill-stealth-active') || (isLightMode ? '#605e5c' : '#bfbfbf')) + (isLightMode ? '90' : '80'),
                'editorGutter.background': editorBackground,
                'editorWhitespace.foreground': lineNumberColor + (isLightMode ? '50' : '40'),
                'editorIndentGuide.background': lineNumberColor + (isLightMode ? '30' : '20'),
                'editorIndentGuide.activeBackground': lineNumberColor + (isLightMode ? '50' : '40'),
                
                // Suggest widget (IntelliSense dropdown)
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
                
                // Peek view
                'peekView.border': borderColor,
                'peekViewEditor.background': editorBackground,
                'peekViewResult.background': editorBackground,
                'peekViewTitle.background': editorBackground,
            }
        });

        console.log(`[MonacoCss] Defined FluentUI theme: ${themeName} (base: ${baseTheme}, light mode: ${isLightMode})`);
        return themeName;
    },

    /**
     * Register FluentUI design token completion and hover providers (once globally)
     */
    registerFluentUITokenProviders: async function() {
        // Check if already registered
        if (this.fluentUITokenProvidersRegistered) {
            console.log('[MonacoCss] FluentUI token providers already registered');
            return;
        }

        if (!window.monaco) {
            console.warn('[MonacoCss] Monaco not loaded, cannot register providers');
            return;
        }

        if (!window.fluentUIDesignTokens) {
            console.warn('[MonacoCss] Fluent UI design tokens not loaded');
            return;
        }

        try {
            // Ensure tokens are harvested
            console.log('[MonacoCss] Harvesting Fluent UI tokens...');
            await window.fluentUIDesignTokens.harvestTokens();
            
            const stats = await window.fluentUIDesignTokens.getStats();
            console.log('[MonacoCss] Token harvest complete:', stats);

            // Register ADDITIONAL completion provider for CSS that SUPPLEMENTS built-in IntelliSense
            monaco.languages.registerCompletionItemProvider('css', {
                provideCompletionItems: async function(model, position) {
                    const lineContent = model.getLineContent(position.lineNumber);
                    const textBeforeCursor = lineContent.substring(0, position.column - 1);
                    
                    // Only provide FluentUI tokens when inside var() or when typing --
                    // This allows built-in CSS IntelliSense to work normally
                    const isInVarFunction = /var\(\s*--[\w-]*$/.test(textBeforeCursor);
                    const isTypingCssVariable = /:\s*--[\w-]*$/.test(textBeforeCursor) || /\(\s*--[\w-]*$/.test(textBeforeCursor);
                    
                    if (!isInVarFunction && !isTypingCssVariable) {
                        // Return empty to let built-in CSS IntelliSense work
                        return { suggestions: [] };
                    }
                    
                    const word = model.getWordUntilPosition(position);
                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn
                    };
                    
                    // Get Fluent UI tokens as completion items
                    const tokens = await window.fluentUIDesignTokens.toMonacoCompletionItems();
                    
                    // Add range to each token
                    tokens.forEach(function(token) {
                        token.range = range;
                        // Lower sort text to prioritize after built-in suggestions
                        token.sortText = 'z' + (token.label || '');
                    });
                    
                    return {
                        suggestions: tokens
                    };
                }
            });

            // Register hover provider for CSS variables
            monaco.languages.registerHoverProvider('css', {
                provideHover: async function(model, position) {
                    const word = model.getWordAtPosition(position);
                    if (!word || !word.word.startsWith('--')) {
                        return null;
                    }
                    
                    const tokenInfo = await window.fluentUIDesignTokens.getTokenInfo(word.word);
                    if (!tokenInfo) {
                        return null;
                    }
                    
                    return {
                        range: new monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                        contents: [
                            { value: '**Fluent UI Design Token**' },
                            { value: '`' + tokenInfo.name + '`' },
                            { value: '**Category:** ' + tokenInfo.category },
                            { value: '**Type:** ' + tokenInfo.type },
                            { value: '**Current Value:** `' + tokenInfo.value + '`' },
                            { value: tokenInfo.description }
                        ]
                    };
                }
            });

            this.fluentUITokenProvidersRegistered = true;
            console.log('[MonacoCss] Fluent UI design token IntelliSense registered with ' + stats.total + ' tokens');
            console.log('[MonacoCss] Built-in CSS IntelliSense preserved - FluentUI tokens shown in var() context');

        } catch (error) {
            console.error('[MonacoCss] Failed to register token providers:', error);
        }
    },

    /**
     * Initialize a Monaco CSS editor instance
     */
    init: async function(containerId, initialContent, dotNetRef) {
        try {
            // Ensure Monaco is loaded
            await this.loadMonaco();
            
            // Configure CSS language defaults (color decorators, lint rules, etc.)
            this.configureCssLanguageDefaults();

            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`[MonacoCss] Container not found: ${containerId}`);
                return false;
            }

            // Define and get FluentUI theme name (now async)
            const themeName = await this.defineFluentUITheme();

            // Create Monaco editor
            const editor = monaco.editor.create(container, {
                value: initialContent || '',
                language: 'css',
                theme: themeName,  // Use FluentUI theme
                automaticLayout: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: this.getFluentUIToken('--body-font') || "'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace",
                tabSize: 2,
                insertSpaces: true,
                renderWhitespace: 'selection',
                folding: true,
                lineDecorationsWidth: 5,
                lineNumbersMinChars: 3,
                padding: { top: 10, bottom: 10 },
                // Enable CSS IntelliSense features
                quickSuggestions: {
                    other: 'on',
                    comments: 'off',
                    strings: 'on'
                },
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                wordBasedSuggestions: 'matchingDocuments',
                // Enable color decorators (color swatches)
                colorDecorators: true,
                // Enable color decorators to refresh
                'semanticHighlighting.enabled': true
            });
            
            // Log to verify color decorators are enabled
            console.log('[MonacoCss] Editor options - colorDecorators:', editor.getOption(monaco.editor.EditorOption.colorDecorators));

            // Register FluentUI token providers (once globally)
            await this.registerFluentUITokenProviders();

            // Store editor instance
            const editorState = {
                editor: editor,
                dotNetRef: dotNetRef,
                isComposing: false,
                changeTimeout: null,
                throttleDelay: 300,  // 300ms for CSS (faster than Markdown)
                chunkSize: 8192,     // 8KB chunks
                isProgrammaticChange: false  // Flag to track programmatic changes
            };

            this.editors.set(containerId, editorState);

            // Set up content change listener
            editor.onDidChangeModelContent((e) => {
                this.handleContentChange(containerId);
            });

            // Set up focus/blur listeners
            editor.onDidFocusEditorText(() => {
                console.log('[MonacoCss] Editor focused:', containerId);
            });

            editor.onDidBlurEditorText(() => {
                console.log('[MonacoCss] Editor blurred:', containerId);
            });

            console.log(`[MonacoCss] Editor initialized: ${containerId} with theme: ${themeName}`);
            return true;

        } catch (error) {
            console.error('[MonacoCss] Error initializing editor:', error);
            return false;
        }
    },

    /**
     * Handle content changes with throttling and sequential chunking
     */
    handleContentChange: function(containerId) {
        const state = this.editors.get(containerId);
        if (!state || state.isComposing) return;

        // Skip change notifications if this is a programmatic change
        if (state.isProgrammaticChange) {
            return;
        }

        // Clear existing timeout
        if (state.changeTimeout) {
            clearTimeout(state.changeTimeout);
        }

        // Set new timeout for throttled update
        state.changeTimeout = setTimeout(async () => {
            const content = state.editor.getValue();
            const chunkSize = state.chunkSize || 8192;
            const totalChunks = Math.ceil(content.length / chunkSize);

            try {
                // Send chunks SEQUENTIALLY with await
                for (let i = 0; i < totalChunks; i++) {
                    const start = i * chunkSize;
                    const chunk = content.substring(start, start + chunkSize);

                    // Notify Blazor with chunk and index - AWAIT each one
                    await state.dotNetRef.invokeMethodAsync(
                        'OnContentChunk',
                        chunk,
                        i,              // chunk index
                        totalChunks     // total chunks
                    );
                }
            } catch (err) {
                console.error('[MonacoCss] Error notifying chunks:', err);
            }
        }, state.throttleDelay);
    },

    /**
     * Get current content
     */
    getContent: function(containerId) {
        const state = this.editors.get(containerId);
        if (!state) {
            console.error(`[MonacoCss] Editor not found: ${containerId}`);
            return null;
        }

        return state.editor.getValue();
    },

    /**
     * Set content (with programmatic change flag to prevent loops)
     */
    setContent: function(containerId, content) {
        const state = this.editors.get(containerId);
        if (!state) {
            console.error(`[MonacoCss] Editor not found: ${containerId}`);
            return false;
        }

        // Save cursor position
        const position = state.editor.getPosition();
        
        // Set flag to prevent change notifications
        state.isProgrammaticChange = true;
        
        // Set content
        state.editor.setValue(content || '');
        
        // Reset flag after a short delay to ensure change event completes
        setTimeout(() => {
            state.isProgrammaticChange = false;
        }, 100);
        
        // Restore cursor position if possible
        if (position) {
            state.editor.setPosition(position);
        }

        return true;
    },

    /**
     * Focus editor
     */
    focus: function(containerId) {
        const state = this.editors.get(containerId);
        if (state) {
            state.editor.focus();
            return true;
        }
        return false;
    },

    /**
     * Undo
     */
    undo: function(containerId) {
        const state = this.editors.get(containerId);
        if (state) {
            state.editor.trigger('keyboard', 'undo', null);
            return state.editor.getValue();
        }
        return null;
    },

    /**
     * Redo
     */
    redo: function(containerId) {
        const state = this.editors.get(containerId);
        if (state) {
            state.editor.trigger('keyboard', 'redo', null);
            return state.editor.getValue();
        }
        return null;
    },

    /**
     * Set theme
     */
    setTheme: async function(containerId, theme) {
        const state = this.editors.get(containerId);
        if (state) {
            // If requesting FluentUI theme, define/update it first
            if (theme === 'fluentui-css-auto' || !theme) {
                theme = await this.defineFluentUITheme();
            }
            monaco.editor.setTheme(theme);
            return true;
        }
        return false;
    },

    /**
     * Update theme when FluentUI theme changes
     */
    updateTheme: async function(containerId) {
        const state = this.editors.get(containerId);
        if (!state?.editor) {
            console.warn('[MonacoCss] Editor not found for theme update:', containerId);
            return;
        }

        // Redefine theme with new FluentUI values
        const themeName = await this.defineFluentUITheme('fluentui-css-auto-updated');
        
        // Apply updated theme
        monaco.editor.setTheme(themeName);
        
        console.log('[MonacoCss] Theme updated for editor:', containerId);
    },

    /**
     * Dispose editor
     */
    dispose: function(containerId) {
        const state = this.editors.get(containerId);
        if (state) {
            if (state.changeTimeout) {
                clearTimeout(state.changeTimeout);
            }
            state.editor.dispose();
            this.editors.delete(containerId);
            console.log('[MonacoCss] Editor disposed:', containerId);
        }
    },

    /**
     * Dispose all editors
     */
    disposeAll: function() {
        this.editors.forEach((state, containerId) => {
            this.dispose(containerId);
        });
        console.log('[MonacoCss] All editors disposed');
    }
};

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    window.monacoCssEditor.disposeAll();
});

// Auto-refresh Monaco theme when FluentUI theme changes
// Listen for changes to the <body> data-theme attribute
const cssThemeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class')) {
            console.log('[MonacoCss] FluentUI theme changed, refreshing all CSS editors');
            
            // Refresh theme for all active editors (async)
            window.monacoCssEditor.editors.forEach(async (state, containerId) => {
                if (state?.editor) {
                    await window.monacoCssEditor.updateTheme(containerId);
                }
            });
            break;
        }
    }
});

// Start observing <body> for theme changes
if (document.body) {
    cssThemeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-theme', 'class']
    });
    console.log('[MonacoCss] Theme change observer activated');
} else {
    // If body not ready, wait for DOM
    document.addEventListener('DOMContentLoaded', () => {
        cssThemeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme', 'class']
        });
        console.log('[MonacoCss] Theme change observer activated (after DOM load)');
    });
}

console.log('[MonacoCss] Module loaded');
