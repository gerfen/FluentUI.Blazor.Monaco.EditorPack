// Monaco Editor JavaScript Interop for Markdown Editing
// Uses LOCAL Monaco Editor files (no CDN dependency)
// https://microsoft.github.io/monaco-editor/

window.monacoMarkdownEditor = {
    editors: new Map(),
    monacoLoaded: false,
    cssClassProviderRegistered: false,

    /**
     * Get base path for _content resources (respects base href)
     */
    getContentBasePath: function() {
        const baseElement = document.querySelector('base');
        const baseHref = baseElement ? baseElement.getAttribute('href') : '/';
        
        // If base href is just '/', use absolute path (local dev)
        if (baseHref === '/') {
            return '/_content/FluentUI.Blazor.Monaco.EditorPack';
        }
        
        // Otherwise use relative path (GitHub Pages, etc.)
        return '_content/FluentUI.Blazor.Monaco.EditorPack';
    },

    // Load Monaco Editor from LOCAL files (bundled in wwwroot)
    loadMonaco: async function() {
        if (this.monacoLoaded) {
            return Promise.resolve(true);
        }

        if (this.monacoLoadPromise) {
            return this.monacoLoadPromise;
        }

        this.monacoLoadPromise = new Promise((resolve, reject) => {
            const contentBasePath = this.getContentBasePath();
            const monacoBasePath = `${contentBasePath}/lib/monaco-editor/min/vs`;
            
            console.log('[MonacoMarkdown] Monaco base path:', monacoBasePath);
            
            // Configure Monaco's AMD loader to use local files from RCL static assets
            require.config({ 
                paths: { 
                    'vs': monacoBasePath
                }
            });

            require(['vs/editor/editor.main'], () => {
                // Configure Monaco environment for web workers with dynamic base URL
                const baseUrl = window.location.origin;
                const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
                const workerBasePath = baseHref === '/' 
                    ? '/_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/'
                    : `${baseUrl}${baseHref}_content/FluentUI.Blazor.Monaco.EditorPack/lib/monaco-editor/min/`;
                
                window.MonacoEnvironment = {
                    getWorkerUrl: function(workerId, label) {
                        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                            self.MonacoEnvironment = {
                                baseUrl: '${workerBasePath}'
                            };
                            importScripts('${workerBasePath}vs/base/worker/workerMain.js');
                        `)}`;
                    }
                };
                
                console.log('[MonacoMarkdown] Monaco Editor loaded successfully from local files');
                this.monacoLoaded = true;
                resolve(true);
            }, (err) => {
                console.error('[MonacoMarkdown] Failed to load Monaco Editor:', err);
                reject(err);
            });
        });

        return this.monacoLoadPromise;
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
     * Define a custom Monaco theme based on FluentUI design tokens
     */
    defineFluentUITheme: function(themeName = 'fluentui-auto') {
        if (!window.monaco) {
            console.warn('[MonacoMarkdown] Monaco not loaded, cannot define theme');
            return themeName;
        }

        // Get FluentUI colors from CSS custom properties
        const backgroundColor = this.getFluentUIToken('--neutral-layer-1') || '#1e1e1e';
        const foregroundColor = this.getFluentUIToken('--neutral-foreground-rest') || '#d4d4d4';
        const editorBackground = this.getFluentUIToken('--neutral-fill-layer-rest') || '#1e1e1e';
        const lineNumberColor = this.getFluentUIToken('--neutral-foreground-hint') || '#858585';
        const selectionBackground = this.getFluentUIToken('--accent-fill-rest') || '#264f78';
        const cursorColor = this.getFluentUIToken('--accent-fill-rest') || '#aeafad';
        const commentColor = this.getFluentUIToken('--neutral-foreground-hint') || '#6a9955';
        const hoverBackground = this.getFluentUIToken('--neutral-fill-secondary-hover') || '#2a2d2e';
        const borderColor = this.getFluentUIToken('--neutral-stroke-layer-rest') || '#454545';
        
        // Define custom theme
        monaco.editor.defineTheme(themeName, {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: commentColor.replace('#', ''), fontStyle: 'italic' },
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
                'editor.lineHighlightBackground': this.getFluentUIToken('--neutral-fill-hover') || '#2a2d2e',
                // Match scrollbar colors from CSS editor using FluentUI tokens
                'scrollbarSlider.background': (this.getFluentUIToken('--neutral-fill-stealth-rest') || '#797979') + '40',
                'scrollbarSlider.hoverBackground': (this.getFluentUIToken('--neutral-fill-stealth-hover') || '#646464') + '60',
                'scrollbarSlider.activeBackground': (this.getFluentUIToken('--neutral-fill-stealth-active') || '#bfbfbf') + '80',
                'scrollbar.shadow': '#00000033',
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
                
                // Peek view
                'peekView.border': borderColor,
                'peekViewEditor.background': editorBackground,
                'peekViewResult.background': editorBackground,
                'peekViewTitle.background': editorBackground,
            }
        });

        console.log(`[MonacoMarkdown] Defined FluentUI theme: ${themeName}`);
        return themeName;
    },

    /**
     * Register a custom theme for Markdown editing
     */
    registerCustomTheme: function() {
        // Clear any existing theme
        if (window.monaco) {
            window.monaco.editor.setTheme('vs-dark');
        }
        
        // Register new theme
        this.defineFluentUITheme('fluentui-markdown-auto');
    },

    /**
     * Register CSS class completion provider for Markdown
     */
    registerCssClassProvider: function() {
        if (this.cssClassProviderRegistered) {
            console.log('[MonacoMarkdown] CSS class provider already registered');
            return;
        }
        
        if (!window.monaco) {
            console.warn('[MonacoMarkdown] Monaco not loaded, cannot register CSS class provider');
            return;
        }
        
        if (!window.cssClassHarvester) {
            console.warn('[MonacoMarkdown] CSS class harvester not loaded');
            return;
        }
        
        // Register completion provider for Markdown
        monaco.languages.registerCompletionItemProvider('markdown', {
            triggerCharacters: ['{', '.'],
            
            provideCompletionItems: function(model, position, token, context) {
                const lineContent = model.getLineContent(position.lineNumber);
                const textBeforeCursor = lineContent.substring(0, position.column - 1);
                
                // Only provide classes when typing {.className pattern (Markdig syntax)
                const inClassAttribute = /\{\.[\w-]*$/.test(textBeforeCursor);
                
                if (!inClassAttribute) {
                    return { suggestions: [] };
                }
                
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                
                // Get CSS classes as completion items
                const classes = window.cssClassHarvester.toMonacoCompletionItems();
                
                // Add range to each class
                classes.forEach(function(item) {
                    item.range = range;
                });
                
                return {
                    suggestions: classes
                };
            }
        });
        
        // Register hover provider for CSS classes in Markdown with color swatches
        monaco.languages.registerHoverProvider('markdown', {
            provideHover: function(model, position) {
                console.log('[MonacoMarkdown] Hover provider called at position:', position);
                
                const lineContent = model.getLineContent(position.lineNumber);
                console.log('[MonacoMarkdown] Line content:', lineContent);
                
                // Match complete {.class1 .class2 selector} pattern
                // This regex captures everything between { and }
                const attributePattern = /\{([^}]+)\}/g;
                let match;
                let hoveredItem = null;
                let matchRange = null;
                
                // Find all {...} patterns in the line
                while ((match = attributePattern.exec(lineContent)) !== null) {
                    const attributeContent = match[1];
                    const attributeStart = match.index + 1; // +1 to skip "{"
                    
                    // Parse individual items (classes, IDs, selectors) within the attribute
                    // Matches: .class-name or #id-name or element-selector
                    const itemPattern = /([.#]?[a-zA-Z0-9_-]+)/g;
                    let itemMatch;
                    
                    while ((itemMatch = itemPattern.exec(attributeContent)) !== null) {
                        const item = itemMatch[0];
                        const itemStartCol = attributeStart + itemMatch.index;
                        const itemEndCol = itemStartCol + item.length;
                        
                        // Check if cursor is within this item
                        if (position.column >= itemStartCol && position.column <= itemEndCol) {
                            // Determine if it's a class (.class-name) or other selector
                            if (item.startsWith('.')) {
                                hoveredItem = {
                                    type: 'class',
                                    name: item.substring(1) // Remove leading "."
                                };
                            } else if (item.startsWith('#')) {
                                hoveredItem = {
                                    type: 'id',
                                    name: item.substring(1) // Remove leading "#"
                                };
                            } else {
                                hoveredItem = {
                                    type: 'element',
                                    name: item
                                };
                            }
                            
                            matchRange = new monaco.Range(
                                position.lineNumber,
                                itemStartCol,
                                position.lineNumber,
                                itemEndCol
                            );
                            console.log('[MonacoMarkdown] Found hovered item:', hoveredItem);
                            break;
                        }
                    }
                    
                    if (hoveredItem) break;
                }
                
                if (!hoveredItem) {
                    console.log('[MonacoMarkdown] No class name found at cursor position');
                    return null;
                }
                
                // Only provide documentation for CSS classes (not IDs or elements)
                if (hoveredItem.type !== 'class') {
                    console.log('[MonacoMarkdown] Hovered item is not a CSS class:', hoveredItem.type);
                    return null;
                }
                
                console.log('[MonacoMarkdown] Looking up class info for:', hoveredItem.name);
                const classInfo = window.cssClassHarvester.getClassInfo(hoveredItem.name);
                console.log('[MonacoMarkdown] Class info found:', classInfo);
                
                if (classInfo) {
                    // Check for color properties and extract color value
                    let colorValue = null;
                    
                    if (classInfo.properties) {
                        for (const prop of classInfo.properties) {
                            // Match any color-related property (color, background-color, border-color, etc.)
                            const colorMatch = prop.match(/(color|background-color|border-color|background):\s*(var\(--[^)]+\)|#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)/i);
                            if (colorMatch) {
                                colorValue = colorMatch[2]; // Get the color value from group 2
                                
                                // Resolve CSS variable
                                if (colorValue.startsWith('var(')) {
                                    const varName = colorValue.match(/var\(\s*(--[\w-]+)\s*\)/);
                                    if (varName && window.fluentUIDesignTokens && window.fluentUIDesignTokens._harvestedTokens) {
                                        const token = window.fluentUIDesignTokens._harvestedTokens.find(t => t.name === varName[1]);
                                        if (token && token.value) {
                                            colorValue = token.value;
                                        }
                                    }
                                }
                                break; // Only show one color per class
                            }
                        }
                    }
                    
                    const documentation = window.cssClassHarvester.formatDocumentation(classInfo);
                    console.log('[MonacoMarkdown] Formatted documentation:', documentation);
                    
                    // Build hover content - add color swatch as separate content block if available
                    const contents = [];
                    
                    // Title with color indicator
                    if (colorValue) {
                        contents.push({
                            value: `<div style="display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:14px;height:14px;border:1px solid #888;border-radius:2px;background-color:${colorValue};"></span><strong>CSS Class</strong> <code style="margin-left:8px;">${colorValue}</code></div>`,
                            isTrusted: true,
                            supportHtml: true
                        });
                    } else {
                        contents.push({
                            value: '**CSS Class**',
                            isTrusted: true,
                            supportHtml: true
                        });
                    }
                    
                    // Documentation
                    contents.push({ 
                        value: documentation,
                        isTrusted: true,
                        supportHtml: true
                    });
                    
                    return {
                        range: matchRange,
                        contents: contents
                    };
                } else {
                    console.log('[MonacoMarkdown] No class info found for:', hoveredItem.name);
                }
                
                return null;
            }
        });
        
        this.cssClassProviderRegistered = true;
        console.log('[MonacoMarkdown] CSS class IntelliSense registered with inline color swatches');
        
        // Register color decorations for CSS classes (shows color swatch in editor)
        this.registerMarkdownColorDecorations();
    },
    
    /**
     * Register color decorations to show color swatches next to CSS classes
     * This creates the visual color indicator in the editor gutter
     */
    registerMarkdownColorDecorations: function() {
        try {
            monaco.languages.registerColorProvider('markdown', {
                provideDocumentColors: async function(model) {
                    const colors = [];
                    const text = model.getValue();
                    const lines = text.split('\n');
                    
                    // Find all {.className} patterns and check if they have color properties
                    const attributePattern = /\{\.([a-zA-Z0-9_-]+)[^}]*\}/g;
                    
                    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                        const lineContent = lines[lineIndex];
                        let match;
                        
                        while ((match = attributePattern.exec(lineContent)) !== null) {
                            const className = match[1];
                            const classInfo = window.cssClassHarvester?.getClassInfo(className);
                            
                            if (classInfo && classInfo.properties) {
                                // Check if this class has color properties
                                for (const prop of classInfo.properties) {
                                    const colorMatch = prop.match(/(color|background-color|border-color|background):\s*(var\(--[^)]+\)|#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)/i);
                                    if (colorMatch) {
                                        let colorValue = colorMatch[2]; // Get the color value from group 2
                                        
                                        // Resolve CSS variable
                                        if (colorValue.startsWith('var(')) {
                                            const varName = colorValue.match(/var\(\s*(--[\w-]+)\s*\)/);
                                            if (varName && window.fluentUIDesignTokens && window.fluentUIDesignTokens._harvestedTokens) {
                                                const token = window.fluentUIDesignTokens._harvestedTokens.find(t => t.name === varName[1]);
                                                if (token && token.value) {
                                                    colorValue = token.value;
                                                }
                                            }
                                        }
                                        
                                        // Parse color and add to decorations
                                        const parsedColor = parseColorValue(colorValue);
                                        if (parsedColor) {
                                            const startCol = match.index + 1; // After {
                                            const endCol = startCol + className.length + 1; // Include .
                                            
                                            colors.push({
                                                color: parsedColor,
                                                range: {
                                                    startLineNumber: lineIndex + 1,
                                                    startColumn: startCol,
                                                    endLineNumber: lineIndex + 1,
                                                    endColumn: endCol
                                                }
                                            });
                                        }
                                        break; // Only show one color per class
                                    }
                                }
                            }
                        }
                        
                        attributePattern.lastIndex = 0; // Reset regex
                    }
                    
                    return colors;
                },
                // Return empty array for color presentations to disable interactive picker
                provideColorPresentations: function(model, colorInfo, token) {
                    // No-op: return empty array to disable color picker
                    return [];
                }
            });
            
            console.log('[MonacoMarkdown] Color decorations registered (display-only, no picker)');
            
        } catch (error) {
            console.error('[MonacoMarkdown] Failed to register color decorations:', error);
        }
        
        // Helper function to parse color values to Monaco color format
        function parseColorValue(colorStr) {
            if (!colorStr) return null;
            
            // Create temp element to parse color
            const temp = document.createElement('div');
            temp.style.color = colorStr;
            document.body.appendChild(temp);
            const computed = window.getComputedStyle(temp).color;
            document.body.removeChild(temp);
            
            // Parse rgb(a) format
            const rgbaMatch = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbaMatch) {
                return {
                    red: parseInt(rgbaMatch[1]) / 255,
                    green: parseInt(rgbaMatch[2]) / 255,
                    blue: parseInt(rgbaMatch[3]) / 255,
                    alpha: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0
                };
            }
            
            return null;
        }
    },

    /**
     * Update CSS classes for IntelliSense
     * @param {string} editorId - Editor ID
     * @param {string} cssContent - Aggregated CSS content from parent component
     */
    updateCssClasses: function(editorId, cssContent) {
        if (!window.cssClassHarvester) {
            console.warn('[MonacoMarkdown] CSS class harvester not loaded');
            return;
        }
        
        // Get previous CSS class count
        const prevStats = window.cssClassHarvester.getStats();
        const prevCount = prevStats.total;
        
        // Update harvester with CSS content (source is always 'External' now)
        window.cssClassHarvester.parseCssText(cssContent || '', 'External CSS');
        
        const stats = window.cssClassHarvester.getStats();
        console.log(`[MonacoMarkdown] Updated CSS classes for editor ${editorId}:`, stats);
        
        // Only refresh color decorations if the CSS actually changed (class count changed)
        if (stats.total !== prevCount) {
            const state = this.editors.get(editorId);
            if (state?.editor) {
                this.refreshColorDecorations(state.editor);
            }
        }
    },

    // Initialize a Monaco editor instance
    init: async function(containerId, initialContent, dotNetRef) {
        try {
            // Ensure Monaco is loaded
            await this.loadMonaco();

            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`[MonacoMarkdown] Container not found: ${containerId}`);
                return false;
            }

            // Define and get FluentUI theme name
            const themeName = this.defineFluentUITheme();

            // Create Monaco editor (no wrapper needed - toolbar is in Blazor)
            const editor = monaco.editor.create(container, {
                value: initialContent || '',
                language: 'markdown',
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

                // Enable hover explicitly with smart positioning
                hover: {
                    enabled: true,
                    delay: 300,
                    sticky: true,
                    above: false  // Prefer showing below the line to avoid toolbar overlap
                }
            });

            // Register markdown commands (but don't create HTML toolbar)
            if (window.monacoMarkdownToolbar) {
                window.monacoMarkdownToolbar.registerMarkdownCommands(editor, containerId);
                console.log('[MonacoMarkdown] Markdown commands registered');
            } else {
                console.warn('[MonacoMarkdown] Markdown toolbar module not loaded');
            }

            // Store editor instance
            const editorState = {
                editor: editor,
                dotNetRef: dotNetRef,
                isComposing: false,
                changeTimeout: null,
                throttleDelay: 500,
                isProgrammaticChange: false  // Flag to track programmatic changes
            };

            this.editors.set(containerId, editorState);

            // Set up content change listener
            editor.onDidChangeModelContent((e) => {
                this.handleContentChange(containerId);
            });

            // Set up focus/blur listeners
            editor.onDidFocusEditorText(() => {
                console.log('[MonacoMarkdown] Editor focused');
            });

            editor.onDidBlurEditorText(() => {
                console.log('[MonacoMarkdown] Editor blurred');
            });

            console.log(`[MonacoMarkdown] Editor initialized: ${containerId} with theme: ${themeName}`);
            
            // Register CSS class provider (once globally)
            this.registerCssClassProvider();
            
            return true;

        } catch (error) {
            console.error('[MonacoMarkdown] Error initializing editor:', error);
            return false;
        }
    },

    //// Handle content changes with throttling
    //handleContentChange: function(containerId) {
    //    const state = this.editors.get(containerId);
    //    if (!state || state.isComposing) return;

    //    // Clear existing timeout
    //    if (state.changeTimeout) {
    //        clearTimeout(state.changeTimeout);
    //    }

    //    // Set new timeout for throttled update
    //    state.changeTimeout = setTimeout(() => {
    //        const content = state.editor.getValue();

    //        // Notify Blazor
    //        state.dotNetRef.invokeMethodAsync('OnContentChanged', content)
    //            .catch(err => console.error('[MonacoMarkdown] Error notifying content change:', err));
    //    }, state.throttleDelay);
    //},

    // Handle content changes with throttling and sequential chunking
    handleContentChange: function (containerId) {
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
            const chunkSize = state.chunkSize || 8192; // default 8 KB per chunk
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
                console.error('[MonacoMarkdown] Error notifying chunks:', err);
            }
        }, state.throttleDelay);
    },


    // Get current content
    getContent: function(containerId) {
        const state = this.editors.get(containerId);
        if (!state) {
            console.error(`[MonacoMarkdown] Editor not found: ${containerId}`);
            return null;
        }

        return state.editor.getValue();
    },

    // Set content
    setContent: function(containerId, content) {
        const state = this.editors.get(containerId);
        if (!state) {
            console.error(`[MonacoMarkdown] Editor not found: ${containerId}`);
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

    // Focus editor
    focus: function(containerId) {
        const state = this.editors.get(containerId);
        if (state) {
            state.editor.focus();
            return true;
        }
        return false;
    },

    // Undo
    undo: function(containerId) {
        const state = this.editors.get(containerId);
        if (state) {
            state.editor.trigger('keyboard', 'undo', null);
            return state.editor.getValue();
        }
        return null;
    },

    // Redo
    redo: function(containerId) {
        const state = this.editors.get(containerId);
        if (state) {
            state.editor.trigger('keyboard', 'redo', null);
            return state.editor.getValue();
        }
        return null;
    },

    // Set theme
    setTheme: function(editorId, themeName = 'fluentui-auto') {
        const editorData = this.editors[editorId];
        if (!editorData?.editor) {
            console.error('[MonacoMarkdownEditor] Editor not found:', editorId);
            return;
        }

        // If requesting FluentUI theme, define/update it first
        if (themeName === 'fluentui-auto' || !themeName) {
            themeName = this.defineFluentUITheme();
        }

        monaco.editor.setTheme(themeName);
        console.log('[MonacoMarkdownEditor] Theme set to:', themeName);
    },

    // Set language
    setLanguage: function(containerId, language) {
        const state = this.editors.get(containerId);
        if (state) {
            const model = state.editor.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
                return true;
            }
        }
        return false;
    },

    /**
     * Initialize the Monaco editor
     */
    async initialize(editorId, initialContent, dotNetRef) {
        console.log('[MonacoMarkdownEditor] Initializing editor:', editorId);

        try {
            // Define FluentUI theme before creating editor
            const themeName = this.defineFluentUITheme();

            const container = document.getElementById(editorId);
            if (!container) {
                console.error('[MonacoMarkdownEditor] Container not found:', editorId);
                throw new Error(`Container element with id "${editorId}" not found`);
            }

            // Create Monaco editor instance
            const editor = monaco.editor.create(container, {
                value: initialContent || '',
                language: 'markdown',
                theme: themeName, // Use FluentUI theme
                automaticLayout: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: this.getFluentUIToken('--body-font') || 'Consolas, "Courier New", monospace',
                lineHeight: 1.6,
                padding: { top: 10, bottom: 10 },
                renderWhitespace: 'selection',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: true,
                               
            });

            // Store editor reference
            this.editors[editorId] = {
                editor: editor,
                dotNetRef: dotNetRef,
                isInitialized: true
            };

            // Set up content change listener
            editor.onDidChangeModelContent(() => {
                const content = editor.getValue();
                if (dotNetRef) {
                    // Send content to .NET in chunks to avoid SignalR size limits
                    this.sendContentInChunks(editorId, content, dotNetRef);
                }
            });

            console.log('[MonacoMarkdownEditor] Editor initialized successfully');
            return true;

        } catch (error) {
            console.error('[MonacoMarkdownEditor] Initialization error:', error);
            throw error;
        }
    },

    /**
     * Send content to .NET in chunks to avoid SignalR size limits
     */
    sendContentInChunks(editorId, content, dotNetRef) {
        const CHUNK_SIZE = 32000; // 32KB chunks (safe for SignalR)
        const totalChunks = Math.ceil(content.length / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, content.length);
            const chunk = content.substring(start, end);
            
            dotNetRef.invokeMethodAsync('OnContentChunk', chunk, i, totalChunks)
                .catch(error => {
                    console.error('[MonacoMarkdownEditor] Error sending chunk:', error);
                });
        }
    },

    /**
     * Update theme when FluentUI theme changes
     */
    updateTheme: async function(containerId) {
        const state = this.editors.get(containerId);
        if (!state?.editor) {
            console.warn('[MonacoMarkdown] Editor not found for theme update:', containerId);
            return;
        }

        // First, refresh design tokens to get new color values
        if (window.fluentUIDesignTokens) {
            await window.fluentUIDesignTokens.refreshTokens();
            console.log('[MonacoMarkdown] Design tokens refreshed for new theme');
        }

        // Redefine theme with new FluentUI values
        const themeName = this.defineFluentUITheme('fluentui-auto-updated');
        
        // Apply updated theme
        monaco.editor.setTheme(themeName);
        
        // Force refresh of color decorations to pick up new design token values
        this.refreshColorDecorations(state.editor);
        
        console.log('[MonacoMarkdown] Theme updated for editor:', containerId);
    },
    
    /**
     * Refresh color decorations in the editor
     * This forces Monaco to re-evaluate color values from CSS variables
     */
    refreshColorDecorations: function(editor) {
        if (!editor) return;
        
        try {
            // Get the model
            const model = editor.getModel();
            if (!model) return;
            
            // Find the editor state by searching through all editors
            let editorState = null;
            for (const [containerId, state] of this.editors.entries()) {
                if (state.editor === editor) {
                    editorState = state;
                    break;
                }
            }
            
            // Save cursor position
            const position = editor.getPosition();
            const content = model.getValue();
            
            // Set flag to prevent change notifications if we found the state
            if (editorState) {
                editorState.isProgrammaticChange = true;
            }
            
            // Force Monaco to re-evaluate colors by triggering the color provider
            // The color provider will automatically re-read design tokens
            model.setValue(content);
            
            // Reset flag after a short delay if we found the state
            if (editorState) {
                setTimeout(() => {
                    editorState.isProgrammaticChange = false;
                }, 100);
            }
            
            // Restore cursor position
            if (position) {
                editor.setPosition(position);
            }
            
            console.log('[MonacoMarkdown] Color decorations refreshed');
        } catch (error) {
            console.error('[MonacoMarkdown] Error refreshing color decorations:', error);
        }
    },

    setValue(editorId, value) {
        const editorData = this.editors[editorId];
        if (!editorData?.editor) {
            console.error('[MonacoMarkdownEditor] Editor not found:', editorId);
            return;
        }

        editorData.editor.setValue(value || '');
    },

    getValue(editorId) {
        const editorData = this.editors[editorId];
        if (!editorData?.editor) {
            console.error('[MonacoMarkdownEditor] Editor not found:', editorId);
            return '';
        }

        return editorData.editor.getValue();
    },

    setTheme(editorId, themeName) {
        const editorData = this.editors[editorId];
        if (!editorData?.editor) {
            console.error('[MonacoMarkdownEditor] Editor not found:', editorId);
            return;
        }

        // If requesting FluentUI theme, define/update it first
        if (themeName === 'fluentui-auto' || !themeName) {
            themeName = this.defineFluentUITheme();
        }

        monaco.editor.setTheme(themeName);
        console.log('[MonacoMarkdownEditor] Theme set to:', themeName);
    },

    focus(editorId) {
        const editorData = this.editors[editorId];
        if (!editorData?.editor) {
            console.error('[MonacoMarkdownEditor] Editor not found:', editorId);
            return;
        }

        editorData.editor.focus();
    },

    dispose(editorId) {
        const editorData = this.editors[editorId];
        if (editorData?.editor) {
            editorData.editor.dispose();
            delete this.editors[editorId];
            console.log('[MonacoMarkdownEditor] Editor disposed:', editorId);
        }
    },

    disposeAll() {
        Object.keys(this.editors).forEach(editorId => {
            this.dispose(editorId);
        });
        console.log('[MonacoMarkdownEditor] All editors disposed');
    },
    
    /**
     * Manually refresh all Monaco editor themes
     * Useful when FluentUI colors change without triggering DOM attribute changes
     * This should be called from Blazor components after color updates
     */
    refreshAllEditorThemes: async function() {
        console.log('[MonacoMarkdown] Manually refreshing all editor themes');
        
        // First, refresh design tokens to get new color values
        if (window.fluentUIDesignTokens) {
            await window.fluentUIDesignTokens.refreshTokens();
            console.log('[MonacoMarkdown] Design tokens refreshed');
        }
        
        // Then update all Monaco editors
        const updatePromises = [];
        this.editors.forEach((state, containerId) => {
            if (state?.editor) {
                updatePromises.push(this.updateTheme(containerId));
            }
        });
        
        await Promise.all(updatePromises);
        console.log('[MonacoMarkdown] All editor themes refreshed');
    }
};

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    window.monacoMarkdownEditor.disposeAll();
});

// Auto-refresh Monaco theme when FluentUI theme changes
// Listen for changes to the <body> data-theme attribute
const themeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class')) {
            console.log('[MonacoMarkdown] FluentUI theme changed, refreshing all Monaco editors');
            
            // Refresh theme for all active editors
            window.monacoMarkdownEditor.editors.forEach((state, containerId) => {
                if (state?.editor) {
                    window.monacoMarkdownEditor.updateTheme(containerId);
                }
            });
            break;
        }
    }
});

// Start observing <body> for theme changes
if (document.body) {
    themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-theme', 'class']
    });
    console.log('[MonacoMarkdown] Theme change observer activated');
} else {
    // If body not ready, wait for DOM
    document.addEventListener('DOMContentLoaded', () => {
        themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme', 'class']
        });
        console.log('[MonacoMarkdown] Theme change observer activated (after DOM load)');
    });
}

console.log('[MonacoMarkdownEditor] Module loaded');
