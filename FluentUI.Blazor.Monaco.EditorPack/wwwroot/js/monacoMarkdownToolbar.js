/**
 * Monaco Markdown Toolbar
 * Provides markdown formatting commands and toolbar UI for Monaco Editor
 */

window.monacoMarkdownToolbar = {
    /**
     * Register markdown formatting commands
     */
    registerMarkdownCommands: function(editor, editorId) {
        const commands = [
            {
                id: 'markdown.bold',
                label: 'Bold',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB,
                icon: 'format-bold',
                action: () => this.wrapSelection(editor, '**', '**', 'bold text')
            },
            {
                id: 'markdown.italic',
                label: 'Italic',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
                icon: 'format-italic',
                action: () => this.wrapSelection(editor, '*', '*', 'italic text')
            },
            {
                id: 'markdown.strikethrough',
                label: 'Strikethrough',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyX,
                icon: 'format-strikethrough',
                action: () => this.wrapSelection(editor, '~~', '~~', 'strikethrough text')
            },
            {
                id: 'markdown.code',
                label: 'Inline Code',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE,
                icon: 'code',
                action: () => this.wrapSelection(editor, '`', '`', 'code')
            },
            {
                id: 'markdown.codeBlock',
                label: 'Code Block',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC,
                icon: 'code-block',
                action: () => this.insertCodeBlock(editor)
            },
            {
                id: 'markdown.h1',
                label: 'Heading 1',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Digit1,
                icon: 'heading-1',
                action: () => this.insertHeading(editor, 1)
            },
            {
                id: 'markdown.h2',
                label: 'Heading 2',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Digit2,
                icon: 'heading-2',
                action: () => this.insertHeading(editor, 2)
            },
            {
                id: 'markdown.h3',
                label: 'Heading 3',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Digit3,
                icon: 'heading-3',
                action: () => this.insertHeading(editor, 3)
            },
            {
                id: 'markdown.bulletList',
                label: 'Bullet List',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
                icon: 'list-bullet',
                action: () => this.insertList(editor, '- ')
            },
            {
                id: 'markdown.numberedList',
                label: 'Numbered List',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO,
                icon: 'list-numbered',
                action: () => this.insertList(editor, '1. ')
            },
            {
                id: 'markdown.quote',
                label: 'Quote',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyQ,
                icon: 'quote',
                action: () => this.insertQuote(editor)
            },
            {
                id: 'markdown.link',
                label: 'Insert Link',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
                icon: 'link',
                action: () => this.insertLink(editor)
            },
            {
                id: 'markdown.image',
                label: 'Insert Image',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI,
                icon: 'image',
                action: () => this.insertImage(editor)
            },
            {
                id: 'markdown.table',
                label: 'Insert Table',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyT,
                icon: 'table',
                action: () => this.insertTable(editor)
            },
            {
                id: 'markdown.horizontalRule',
                label: 'Horizontal Rule',
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Minus,
                icon: 'horizontal-rule',
                action: () => this.insertHorizontalRule(editor)
            }
        ];

        // Register each command with Monaco
        commands.forEach(cmd => {
            editor.addAction({
                id: cmd.id,
                label: cmd.label,
                keybindings: [cmd.keybinding],
                contextMenuGroupId: 'markdown',
                contextMenuOrder: 1.5,
                run: cmd.action
            });
        });

        return commands;
    },

    /**
     * Wrap selected text with prefix and suffix
     */
    wrapSelection: function(editor, prefix, suffix, placeholder) {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        const newText = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${placeholder}${suffix}`;
        
        editor.executeEdits('markdown', [{
            range: selection,
            text: newText,
            forceMoveMarkers: true
        }]);

        // Select the inserted text (excluding markers)
        if (!selectedText) {
            const position = selection.getStartPosition();
            const newSelection = new monaco.Selection(
                position.lineNumber,
                position.column + prefix.length,
                position.lineNumber,
                position.column + prefix.length + placeholder.length
            );
            editor.setSelection(newSelection);
        }

        editor.focus();
    },

    /**
     * Insert heading at current line
     */
    insertHeading: function(editor, level) {
        const selection = editor.getSelection();
        const line = editor.getModel().getLineContent(selection.startLineNumber);
        const prefix = '#'.repeat(level) + ' ';
        
        // Remove existing heading markers
        const cleanLine = line.replace(/^#+\s*/, '');
        const newLine = prefix + (cleanLine || 'Heading ' + level);

        const lineRange = new monaco.Range(
            selection.startLineNumber, 1,
            selection.startLineNumber, line.length + 1
        );

        editor.executeEdits('markdown', [{
            range: lineRange,
            text: newLine,
            forceMoveMarkers: true
        }]);

        editor.focus();
    },

    /**
     * Insert code block
     */
    insertCodeBlock: function(editor) {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        
        // Determine if we need to add newlines
        const position = selection.getStartPosition();
        const currentLine = editor.getModel().getLineContent(position.lineNumber);
        const needsLeadingNewline = currentLine.trim().length > 0 && position.column > 1;
        
        let codeBlock;
        if (selectedText) {
            // Wrap existing selection
            codeBlock = needsLeadingNewline 
                ? `\n\`\`\`\n${selectedText}\n\`\`\`\n` 
                : `\`\`\`\n${selectedText}\n\`\`\`\n`;
        } else {
            // Insert template
            codeBlock = needsLeadingNewline 
                ? `\n\`\`\`javascript\n// Your code here\n\`\`\`\n` 
                : `\`\`\`javascript\n// Your code here\n\`\`\`\n`;
        }

        editor.executeEdits('markdown', [{
            range: selection,
            text: codeBlock,
            forceMoveMarkers: true
        }]);

        // If template was inserted, select the language part
        if (!selectedText) {
            const newPosition = needsLeadingNewline 
                ? new monaco.Position(position.lineNumber + 1, 4) // After newline and ```
                : new monaco.Position(position.lineNumber, 4); // After ```
            
            const languageSelection = new monaco.Selection(
                newPosition.lineNumber,
                newPosition.column,
                newPosition.lineNumber,
                newPosition.column + 'javascript'.length
            );
            editor.setSelection(languageSelection);
        }

        editor.focus();
    },

    /**
     * Insert list (bullet or numbered)
     */
    insertList: function(editor, prefix) {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);

        if (selectedText) {
            // Multi-line: add prefix to each line
            const lines = selectedText.split('\n');
            const listText = lines.map(line => prefix + line).join('\n');
            
            editor.executeEdits('markdown', [{
                range: selection,
                text: listText,
                forceMoveMarkers: true
            }]);
        } else {
            // Single line: insert list item
            const position = selection.getStartPosition();
            const line = editor.getModel().getLineContent(position.lineNumber);
            const isAtStart = position.column === 1 || line.substring(0, position.column - 1).trim() === '';

            if (isAtStart) {
                const lineRange = new monaco.Range(
                    position.lineNumber, 1,
                    position.lineNumber, 1
                );
                editor.executeEdits('markdown', [{
                    range: lineRange,
                    text: prefix,
                    forceMoveMarkers: true
                }]);
            } else {
                editor.executeEdits('markdown', [{
                    range: selection,
                    text: '\n' + prefix,
                    forceMoveMarkers: true
                }]);
            }
        }

        editor.focus();
    },

    /**
     * Insert blockquote
     */
    insertQuote: function(editor) {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);

        if (selectedText) {
            const lines = selectedText.split('\n');
            const quotedText = lines.map(line => '> ' + line).join('\n');
            
            editor.executeEdits('markdown', [{
                range: selection,
                text: quotedText,
                forceMoveMarkers: true
            }]);
        } else {
            editor.executeEdits('markdown', [{
                range: selection,
                text: '> Quote',
                forceMoveMarkers: true
            }]);
        }

        editor.focus();
    },

    /**
     * Insert link
     */
    insertLink: function(editor) {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        const linkText = selectedText || 'link text';
        const linkMarkdown = `[${linkText}](https://example.com)`;

        editor.executeEdits('markdown', [{
            range: selection,
            text: linkMarkdown,
            forceMoveMarkers: true
        }]);

        // Select URL part for easy editing
        const position = selection.getStartPosition();
        const urlStartCol = position.column + linkText.length + 3; // after ']('
        const urlEndCol = urlStartCol + 'https://example.com'.length;
        
        const urlSelection = new monaco.Selection(
            position.lineNumber,
            urlStartCol,
            position.lineNumber,
            urlEndCol
        );
        editor.setSelection(urlSelection);
        editor.focus();
    },

    /**
     * Insert image
     */
    insertImage: function(editor) {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        const altText = selectedText || 'image description';
        const imageMarkdown = `![${altText}](https://example.com/image.jpg)`;

        editor.executeEdits('markdown', [{
            range: selection,
            text: imageMarkdown,
            forceMoveMarkers: true
        }]);

        // Select URL part for easy editing
        const position = selection.getStartPosition();
        const urlStartCol = position.column + altText.length + 4; // after ']('
        const urlEndCol = urlStartCol + 'https://example.com/image.jpg'.length;
        
        const urlSelection = new monaco.Selection(
            position.lineNumber,
            urlStartCol,
            position.lineNumber,
            urlEndCol
        );
        editor.setSelection(urlSelection);
        editor.focus();
    },

    /**
     * Insert table
     */
    insertTable: function(editor) {
        const table = `| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;

        const selection = editor.getSelection();
        editor.executeEdits('markdown', [{
            range: selection,
            text: table,
            forceMoveMarkers: true
        }]);

        editor.focus();
    },

    /**
     * Insert horizontal rule
     */
    insertHorizontalRule: function(editor) {
        const selection = editor.getSelection();
        const position = selection.getStartPosition();
        const line = editor.getModel().getLineContent(position.lineNumber);
        
        // Insert on new line if current line has content
        const hrText = line.trim() ? '\n\n---\n\n' : '---\n\n';

        editor.executeEdits('markdown', [{
            range: selection,
            text: hrText,
            forceMoveMarkers: true
        }]);

        editor.focus();
    },

    /**
     * Create toolbar HTML
     */
    createToolbar: function(editorId, commands) {
        const toolbar = document.createElement('div');
        toolbar.className = 'monaco-markdown-toolbar';
        toolbar.id = `${editorId}-toolbar`;

        // Group commands by category
        const groups = [
            {
                name: 'Format',
                commands: ['markdown.bold', 'markdown.italic', 'markdown.strikethrough', 'markdown.code']
            },
            {
                name: 'Headings',
                commands: ['markdown.h1', 'markdown.h2', 'markdown.h3']
            },
            {
                name: 'Lists',
                commands: ['markdown.bulletList', 'markdown.numberedList', 'markdown.quote']
            },
            {
                name: 'Insert',
                commands: ['markdown.link', 'markdown.image', 'markdown.table']
            },
            {
                name: 'Other',
                commands: ['markdown.codeBlock', 'markdown.horizontalRule']
            }
        ];

        groups.forEach((group, groupIndex) => {
            if (groupIndex > 0) {
                const separator = document.createElement('div');
                separator.className = 'toolbar-separator';
                toolbar.appendChild(separator);
            }

            group.commands.forEach(cmdId => {
                const cmd = commands.find(c => c.id === cmdId);
                if (cmd) {
                    const button = this.createToolbarButton(cmd);
                    toolbar.appendChild(button);
                }
            });
        });

        return toolbar;
    },

    /**
     * Create toolbar button
     */
    createToolbarButton: function(command) {
        const button = document.createElement('button');
        button.className = 'toolbar-button';
        button.title = `${command.label} (${this.formatKeybinding(command.keybinding)})`;
        button.setAttribute('data-command', command.id);
        
        // Use Fluent UI icons via CSS classes
        const icon = document.createElement('span');
        icon.className = `toolbar-icon icon-${command.icon}`;
        icon.textContent = this.getIconText(command.icon);
        
        button.appendChild(icon);
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            command.action();
        });

        return button;
    },

    /**
     * Get icon text/symbol for command
     */
    getIconText: function(iconName) {
        const icons = {
            'format-bold': 'B',
            'format-italic': 'I',
            'format-strikethrough': 'S',
            'code': '<>',
            'code-block': '{ }',
            'heading-1': 'H1',
            'heading-2': 'H2',
            'heading-3': 'H3',
            'list-bullet': '•',
            'list-numbered': '1.',
            'quote': '"',
            'link': '??',
            'image': '??',
            'table': '?',
            'horizontal-rule': '?'
        };
        return icons[iconName] || '?';
    },

    /**
     * Format keybinding for display
     */
    formatKeybinding: function(keybinding) {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? '?' : 'Ctrl';
        const shiftKey = isMac ? '?' : 'Shift';
        const altKey = isMac ? '?' : 'Alt';

        // Parse Monaco keybinding - this is a bitwise combination
        let parts = [];
        
        // Check for modifiers (these are combined with bitwise OR)
        if (keybinding & monaco.KeyMod.CtrlCmd) {
            parts.push(ctrlKey);
        }
        if (keybinding & monaco.KeyMod.Shift) {
            parts.push(shiftKey);
        }
        if (keybinding & monaco.KeyMod.Alt) {
            parts.push(altKey);
        }
        
        // Extract the key code (mask out the modifiers)
        const keyCode = keybinding & 0x0000ffff;
        
        // Map common key codes to display names
        const keyNames = {
            [monaco.KeyCode.KeyA]: 'A',
            [monaco.KeyCode.KeyB]: 'B',
            [monaco.KeyCode.KeyC]: 'C',
            [monaco.KeyCode.KeyD]: 'D',
            [monaco.KeyCode.KeyE]: 'E',
            [monaco.KeyCode.KeyF]: 'F',
            [monaco.KeyCode.KeyG]: 'G',
            [monaco.KeyCode.KeyH]: 'H',
            [monaco.KeyCode.KeyI]: 'I',
            [monaco.KeyCode.KeyJ]: 'J',
            [monaco.KeyCode.KeyK]: 'K',
            [monaco.KeyCode.KeyL]: 'L',
            [monaco.KeyCode.KeyM]: 'M',
            [monaco.KeyCode.KeyN]: 'N',
            [monaco.KeyCode.KeyO]: 'O',
            [monaco.KeyCode.KeyP]: 'P',
            [monaco.KeyCode.KeyQ]: 'Q',
            [monaco.KeyCode.KeyR]: 'R',
            [monaco.KeyCode.KeyS]: 'S',
            [monaco.KeyCode.KeyT]: 'T',
            [monaco.KeyCode.KeyU]: 'U',
            [monaco.KeyCode.KeyV]: 'V',
            [monaco.KeyCode.KeyW]: 'W',
            [monaco.KeyCode.KeyX]: 'X',
            [monaco.KeyCode.KeyY]: 'Y',
            [monaco.KeyCode.KeyZ]: 'Z',
            [monaco.KeyCode.Digit1]: '1',
            [monaco.KeyCode.Digit2]: '2',
            [monaco.KeyCode.Digit3]: '3',
            [monaco.KeyCode.Digit4]: '4',
            [monaco.KeyCode.Digit5]: '5',
            [monaco.KeyCode.Digit6]: '6',
            [monaco.KeyCode.Digit7]: '7',
            [monaco.KeyCode.Digit8]: '8',
            [monaco.KeyCode.Digit9]: '9',
            [monaco.KeyCode.Digit0]: '0',
            [monaco.KeyCode.Minus]: '-',
            [monaco.KeyCode.Equal]: '=',
            [monaco.KeyCode.Enter]: 'Enter',
            [monaco.KeyCode.Space]: 'Space',
            [monaco.KeyCode.Tab]: 'Tab',
        };
        
        const keyName = keyNames[keyCode] || 'Key';
        parts.push(keyName);
        
        return parts.join('+');
    },

    /**
     * Execute a markdown command by ID (called from Blazor)
     */
    executeCommand: function(editorId, commandId) {
        const state = window.monacoMarkdownEditor.editors.get(editorId);
        if (!state || !state.editor) {
            console.error(`[MonacoMarkdownToolbar] Editor not found: ${editorId}`);
            return;
        }

        // Trigger the command via Monaco's action system
        state.editor.trigger('toolbar', commandId, null);
    }
};

console.log('[MonacoMarkdownToolbar] Module loaded');
