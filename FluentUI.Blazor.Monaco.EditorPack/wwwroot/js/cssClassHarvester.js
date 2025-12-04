// CSS Class Harvester for Monaco IntelliSense
// Parses CSS text and extracts class names for autocomplete

window.cssClassHarvester = {
    classes: new Map(), // class name -> { selector, source, properties }
    
    /**
     * Parse CSS text and extract class names
     * @param {string} cssText - CSS content to parse
     * @param {string} source - Source identifier (e.g., 'External CSS')
     */
    parseCssText: function(cssText, source) {
        // Clear existing classes before parsing new content
        this.classes.clear();
        
        if (!cssText || typeof cssText !== 'string') {
            return;
        }
        
        // Remove comments
        const cleanCss = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Match CSS rules with selectors
        // Pattern: .className { ... } or .className, .other { ... }
        const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
        let match;
        
        while ((match = rulePattern.exec(cleanCss)) !== null) {
            const selectorText = match[1].trim();
            const propertiesText = match[2].trim();
            
            // Extract class names from selector
            const classMatches = selectorText.matchAll(/\.([a-zA-Z0-9_-]+)/g);
            
            for (const classMatch of classMatches) {
                const className = classMatch[1];
                
                // Parse properties
                const properties = this.parseProperties(propertiesText);
                
                // Store class info (overwrite if duplicate)
                this.classes.set(className, {
                    className: className,
                    selector: selectorText,
                    source: source,
                    properties: properties
                });
            }
        }
        
        console.log(`[CssHarvester] Parsed ${this.classes.size} CSS classes from ${source}`);
    },
    
    /**
     * Parse CSS properties from rule body
     * @param {string} propertiesText - CSS properties text
     * @returns {Array} Array of property strings
     */
    parseProperties: function(propertiesText) {
        if (!propertiesText) return [];
        
        const props = [];
        const propPattern = /([a-zA-Z-]+)\s*:\s*([^;]+)/g;
        let match;
        
        while ((match = propPattern.exec(propertiesText)) !== null) {
            props.push(`${match[1].trim()}: ${match[2].trim()}`);
            if (props.length >= 5) break; // Limit to first 5 properties
        }
        
        return props;
    },
    
    /**
     * Update CSS classes from multiple sources
     * @param {Object} cssContent - Object with keys: global, page, project, market
     */
    updateFromSources: function(cssContent) {
        // Clear existing classes
        this.classes.clear();
        
        // Parse each source
        if (cssContent.global) {
            this.parseCssText(cssContent.global, 'Global CSS');
        }
        if (cssContent.page) {
            this.parseCssText(cssContent.page, 'Page CSS');
        }
        if (cssContent.project) {
            this.parseCssText(cssContent.project, 'Project CSS');
        }
        if (cssContent.market) {
            this.parseCssText(cssContent.market, 'Market CSS');
        }
        
        console.log(`[CssHarvester] Parsed ${this.classes.size} CSS classes from ${Object.keys(cssContent).length} sources`);
    },
    
    /**
     * Get all unique class names
     * @returns {Array} Array of class names
     */
    getClassNames: function() {
        const uniqueClasses = new Set();
        this.classes.forEach((info, key) => {
            uniqueClasses.add(info.className);
        });
        return Array.from(uniqueClasses);
    },
    
    /**
     * Get class info by name
     * @param {string} className - Class name to look up
     * @returns {Object|null} Class info object or null
     */
    getClassInfo: function(className) {
        return this.classes.get(className) || null;
    },
    
    /**
     * Convert to Monaco completion items
     * @returns {Array} Array of Monaco completion items
     */
    toMonacoCompletionItems: function() {
        const items = [];
        
        this.classes.forEach((info, className) => {
            items.push({
                label: info.className,
                kind: monaco.languages.CompletionItemKind.Class,
                detail: `CSS Class (${info.source})`,
                documentation: {
                    value: this.formatDocumentation(info)
                },
                insertText: info.className,
                sortText: 'a' + info.className // Sort before other suggestions
            });
        });
        
        return items;
    },
    
    /**
     * Format documentation with color swatches for hover display
     * @param {Object} classInfo - Class info object
     * @returns {string} Markdown formatted documentation with color swatches
     */
    formatDocumentation: function(classInfo) {
        if (!classInfo) {
            return '';
        }
        
        let doc = `**Source:** ${classInfo.source}\n\n`;
        doc += `**Selector:** \`${classInfo.selector}\`\n\n`;
        
        if (classInfo.properties && classInfo.properties.length > 0) {
            doc += `**Properties:**\n\n`;
            classInfo.properties.forEach(prop => {
                // Extract property name and value
                const propMatch = prop.match(/^([^:]+):\s*(.+)$/);
                if (!propMatch) {
                    doc += `- \`${prop}\`\n`;
                    return;
                }
                
                const propName = propMatch[1].trim();
                const propValue = propMatch[2].trim();
                
                // Check if this is a color property
                const colorMatch = propValue.match(/^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|var\(--[^)]+\))$/i);
                
                if (colorMatch) {
                    let colorValue = colorMatch[0];
                    
                    // For CSS variables, try to resolve the value
                    if (colorValue.startsWith('var(')) {
                        const varName = colorValue.match(/var\(\s*(--[\w-]+)\s*\)/);
                        if (varName && window.fluentUIDesignTokens && window.fluentUIDesignTokens._harvestedTokens) {
                            const token = window.fluentUIDesignTokens._harvestedTokens.find(t => t.name === varName[1]);
                            if (token && token.value) {
                                const resolvedColor = token.value;
                                // Just show variable and resolved value, no special characters
                                doc += `- **${propName}:** \`${colorValue}\` ? \`${resolvedColor}\`\n`;
                                return;
                            }
                        }
                        // CSS variable but not resolved
                        doc += `- **${propName}:** \`${colorValue}\` (CSS variable)\n`;
                    } else {
                        // Direct color value
                        doc += `- **${propName}:** \`${colorValue}\`\n`;
                    }
                } else {
                    // Non-color property
                    doc += `- **${propName}:** \`${propValue}\`\n`;
                }
            });
        }
        
        return doc;
    },
    
    /**
     * Get an appropriate color emoji based on the color value
     * @param {string} colorValue - CSS color value
     * @returns {string} Colored square emoji or simple indicator
     */
    getColorEmoji: function(colorValue) {
        // Removed - not using emoji anymore due to font support issues
        return '';
    },
    
    /**
     * Get statistics
     * @returns {Object} Statistics object
     */
    getStats: function() {
        return {
            total: this.classes.size,
            classes: this.getClassNames(),
            sampleClasses: this.getClassNames().slice(0, 10)
        };
    }
};

console.log('[CssHarvester] Module loaded');
