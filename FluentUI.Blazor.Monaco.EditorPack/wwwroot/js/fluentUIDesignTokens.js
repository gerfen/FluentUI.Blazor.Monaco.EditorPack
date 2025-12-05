// Fluent UI Design Tokens for Monaco CSS Editor IntelliSense
// Dynamically harvested from the browser's computed styles
// https://github.com/microsoft/fluentui-blazor

window.fluentUIDesignTokens = {
    _harvestedTokens: null,
    _harvestInProgress: false,

    /**
     * Harvest all CSS custom properties (design tokens) from the document
     * This runs after FluentUI has loaded and applied customizations
     */
    async harvestTokens() {
        if (this._harvestInProgress) {
            console.log('[FluentUI Tokens] Harvest already in progress, waiting...');
            // Wait for harvest to complete
            while (this._harvestInProgress) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this._harvestedTokens;
        }

        if (this._harvestedTokens) {
            console.log('[FluentUI Tokens] Using cached tokens:', this._harvestedTokens.length);
            return this._harvestedTokens;
        }

        this._harvestInProgress = true;
        console.log('[FluentUI Tokens] Starting harvest from DOM...');

        try {
            const tokens = new Map();
            
            // Get all computed styles from document root
            const rootStyles = getComputedStyle(document.documentElement);
            
            // Also check body element (FluentDesignTheme applies to body)
            const bodyStyles = getComputedStyle(document.body);
            
            // Combine both style sources
            const styleSources = [
                { styles: rootStyles, element: 'document root' },
                { styles: bodyStyles, element: 'body' }
            ];

            for (const { styles, element } of styleSources) {
                // Iterate through all CSS properties
                for (let i = 0; i < styles.length; i++) {
                    const propName = styles[i];
                    
                    // Only process CSS custom properties (start with --)
                    if (propName.startsWith('--')) {
                        const propValue = styles.getPropertyValue(propName).trim();
                        
                        // Skip if empty or already exists
                        if (!propValue || tokens.has(propName)) {
                            continue;
                        }

                        // Determine token type based on name and value
                        const type = this._inferTokenType(propName, propValue);
                        const category = this._categorizeToken(propName);
                        const description = this._generateDescription(propName, category);

                        tokens.set(propName, {
                            name: propName,
                            value: propValue,
                            type: type,
                            category: category,
                            description: description
                        });
                    }
                }
            }

            // Convert to array and sort
            this._harvestedTokens = Array.from(tokens.values()).sort((a, b) => 
                a.name.localeCompare(b.name)
            );

            console.log(`[FluentUI Tokens] Harvested ${this._harvestedTokens.length} tokens from ${styleSources.length} sources`);
            console.log('[FluentUI Tokens] Sample tokens:', this._harvestedTokens.slice(0, 5).map(t => t.name));
            
            return this._harvestedTokens;
        } catch (error) {
            console.error('[FluentUI Tokens] Harvest failed:', error);
            this._harvestedTokens = [];
            return [];
        } finally {
            this._harvestInProgress = false;
        }
    },

    /**
     * Infer the CSS type of a token based on its name and value
     */
    _inferTokenType(name, value) {
        // Color detection (hex, rgb, rgba, hsl, hsla, named colors)
        if (
            /^#[0-9a-f]{3,8}$/i.test(value) ||
            /^rgb\(/.test(value) ||
            /^rgba\(/.test(value) ||
            /^hsl\(/.test(value) ||
            /^hsla\(/.test(value) ||
            name.includes('color') ||
            name.includes('fill') ||
            name.includes('stroke') ||
            name.includes('foreground') ||
            name.includes('background') ||
            name.includes('border')
        ) {
            return 'color';
        }

        // Length detection (px, rem, em, %, etc.)
        if (
            /^\d+(\.\d+)?(px|rem|em|%|vh|vw)$/.test(value) ||
            name.includes('size') ||
            name.includes('height') ||
            name.includes('width') ||
            name.includes('radius') ||
            name.includes('spacing') ||
            name.includes('gap')
        ) {
            return 'length';
        }

        // Font family
        if (name.includes('font-family') || name.includes('font')) {
            return 'font-family';
        }

        // Font weight
        if (name.includes('weight')) {
            return 'font-weight';
        }

        // Number (unitless values)
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return 'number';
        }

        // Shadow
        if (name.includes('shadow') || /^\d+px\s+\d+px/.test(value)) {
            return 'shadow';
        }

        // Duration/timing
        if (/^\d+m?s$/.test(value)) {
            return 'time';
        }

        // Direction
        if (name.includes('direction')) {
            return 'direction';
        }

        // Default
        return 'value';
    },

    /**
     * Categorize a token based on its name
     */
    _categorizeToken(name) {
        if (name.includes('neutral')) return 'Neutral Colors';
        if (name.includes('accent')) return 'Accent Colors';
        if (name.includes('font') || name.includes('type-ramp') || name.includes('body-font')) return 'Typography';
        if (name.includes('layer')) return 'Layers';
        if (name.includes('stroke')) return 'Strokes & Borders';
        if (name.includes('fill')) return 'Fills';
        if (name.includes('foreground')) return 'Foreground Colors';
        if (name.includes('focus')) return 'Focus States';
        if (name.includes('elevation') || name.includes('shadow')) return 'Elevation & Shadows';
        if (name.includes('corner') || name.includes('radius')) return 'Border Radius';
        if (name.includes('spacing') || name.includes('gap') || name.includes('design-unit')) return 'Spacing';
        if (name.includes('height') || name.includes('width') || name.includes('multiplier')) return 'Sizing';
        if (name.includes('opacity')) return 'Opacity';
        if (name.includes('direction')) return 'Direction';
        if (name.includes('duration') || name.includes('timing')) return 'Animation';
        if (name.includes('Status') || name.includes('Success') || name.includes('Warning') || name.includes('Danger') || name.includes('Error')) return 'Status Colors';
        
        return 'Other';
    },

    /**
     * Generate a human-readable description for a token
     */
    _generateDescription(name, category) {
        // Remove leading dashes
        const cleanName = name.replace(/^--/, '');
        
        // Split by hyphens and capitalize
        const words = cleanName.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        );

        // Generate description based on patterns
        const joinedWords = words.join(' ');
        
        // Add context based on category
        const categoryPrefix = category ? `[${category}] ` : '';
        
        return `${categoryPrefix}${joinedWords}`;
    },

    /**
     * Get all harvested tokens
     */
    async getAllTokens() {
        if (!this._harvestedTokens) {
            await this.harvestTokens();
        }
        return this._harvestedTokens || [];
    },

    /**
     * Convert tokens to Monaco completion items
     */
    async toMonacoCompletionItems() {
        const tokens = await this.getAllTokens();
        
        return tokens.map(token => ({
            label: token.name,
            kind: monaco.languages.CompletionItemKind.Variable,
            detail: `${token.type} (${token.category})`,
            documentation: {
                value: `**${token.description}**\n\n` +
                       `**Type:** ${token.type}\n\n` +
                       `**Category:** ${token.category}\n\n` +
                       `**Current Value:** \`${token.value}\``,
                isTrusted: true
            },
            insertText: token.name,
            sortText: `${token.category}_${token.name}`
        }));
    },

    /**
     * Get token info for hover (with current value)
     */
    async getTokenInfo(tokenName) {
        const tokens = await this.getAllTokens();
        return tokens.find(t => t.name === tokenName);
    },

    /**
     * Get tokens by category
     */
    async getTokensByCategory(category) {
        const tokens = await this.getAllTokens();
        return tokens.filter(t => t.category === category);
    },

    /**
     * Get all categories
     */
    async getCategories() {
        const tokens = await this.getAllTokens();
        const categories = new Set(tokens.map(t => t.category));
        return Array.from(categories).sort();
    },

    /**
     * Search tokens by name pattern
     */
    async searchTokens(pattern) {
        const tokens = await this.getAllTokens();
        const regex = new RegExp(pattern, 'i');
        return tokens.filter(t => regex.test(t.name) || regex.test(t.description));
    },

    /**
     * Refresh tokens (re-harvest from DOM)
     * Useful if theme changes at runtime
     */
    async refreshTokens() {
        console.log('[FluentUI Tokens] Refreshing tokens...');
        this._harvestedTokens = null;
        this._harvestInProgress = false; // Reset in-progress flag to force re-harvest
        return await this.harvestTokens();
    },

    /**
     * Get token value by name
     * @param {string} tokenName - Token name (e.g., '--accent-fill-rest')
     * @returns {string|null} Token value or null
     */
    async getTokenValue(tokenName) {
        const tokens = await this.getAllTokens();
        const token = tokens.find(t => t.name === tokenName);
        return token ? token.value : null;
    },
    
    /**
     * Get statistics about harvested tokens
     */
    async getStats() {
        const tokens = await this.getAllTokens();
        const categories = await this.getCategories();
        
        const stats = {
            total: tokens.length,
            categories: categories.length,
            byCategory: {},
            byType: {}
        };

        // Count by category
        for (const token of tokens) {
            stats.byCategory[token.category] = (stats.byCategory[token.category] || 0) + 1;
            stats.byType[token.type] = (stats.byType[token.type] || 0) + 1;
        }

        return stats;
    },

    /**
     * Debug: Check if a token exists in DOM (even if not harvested)
     * This helps diagnose why a token might be missing
     */
    async debugToken(tokenName) {
        console.log(`[FluentUI Tokens] Debugging token: ${tokenName}`);
        
        // Ensure token starts with --
        const normalizedName = tokenName.startsWith('--') ? tokenName : `--${tokenName}`;
        
        // Check document root
        const rootStyles = getComputedStyle(document.documentElement);
        const rootValue = rootStyles.getPropertyValue(normalizedName).trim();
        
        // Check body
        const bodyStyles = getComputedStyle(document.body);
        const bodyValue = bodyStyles.getPropertyValue(normalizedName).trim();
        
        // Check all stylesheets for definition
        let foundInStylesheet = false;
        let stylesheetInfo = [];
        
        for (const sheet of document.styleSheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                if (rules) {
                    for (const rule of rules) {
                        if (rule.style && rule.style.getPropertyValue(normalizedName)) {
                            foundInStylesheet = true;
                            stylesheetInfo.push({
                                href: sheet.href || 'inline',
                                selector: rule.selectorText,
                                value: rule.style.getPropertyValue(normalizedName)
                            });
                        }
                    }
                }
            } catch (e) {
                // Cross-origin stylesheets may throw errors
            }
        }
        
        // Check if token was harvested
        const harvestedToken = await this.getTokenInfo(normalizedName);
        
        const debugInfo = {
            tokenName: normalizedName,
            rootValue: rootValue || '(empty)',
            bodyValue: bodyValue || '(empty)',
            foundInStylesheet: foundInStylesheet,
            stylesheetOccurrences: stylesheetInfo,
            wasHarvested: !!harvestedToken,
            harvestedToken: harvestedToken || null
        };
        
        console.log('[FluentUI Tokens] Debug results:', debugInfo);
        return debugInfo;
    },

    /**
     * Debug: List all tokens matching a pattern (case-insensitive)
     */
    async debugSearchTokens(pattern) {
        console.log(`[FluentUI Tokens] Searching for tokens matching: ${pattern}`);
        
        const tokens = await this.getAllTokens();
        const regex = new RegExp(pattern, 'i');
        const matches = tokens.filter(t => 
            regex.test(t.name) || regex.test(t.description)
        );
        
        console.log(`[FluentUI Tokens] Found ${matches.length} matching tokens:`);
        matches.forEach(t => {
            console.log(`  ${t.name}: ${t.value} (${t.category})`);
        });
        
        return matches;
    },

    /**
     * Debug: List ALL CSS custom properties in DOM (raw)
     * This shows everything, even empty values
     */
    async debugListAllCustomProperties() {
        console.log('[FluentUI Tokens] Listing ALL CSS custom properties in DOM...');
        
        const allProps = new Set();
        
        // From document root
        const rootStyles = getComputedStyle(document.documentElement);
        for (let i = 0; i < rootStyles.length; i++) {
            const propName = rootStyles[i];
            if (propName.startsWith('--')) {
                allProps.add(propName);
            }
        }
        
        // From body
        const bodyStyles = getComputedStyle(document.body);
        for (let i = 0; i < bodyStyles.length; i++) {
            const propName = bodyStyles[i];
            if (propName.startsWith('--')) {
                allProps.add(propName);
            }
        }
        
        const propsArray = Array.from(allProps).sort();
        console.log(`[FluentUI Tokens] Found ${propsArray.length} custom properties total`);
        console.log('[FluentUI Tokens] All properties:', propsArray);
        
        return propsArray;
    }
};


// DISABLED AUTO-HARVEST: Triggers FluentUI colorContrast recursion bug
// Tokens are now harvested on-demand when Monaco editors initialize
// or when explicitly called via refreshTokens()

// Auto-harvest tokens when DOM is ready
/*if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[FluentUI Tokens] DOM loaded, scheduling harvest...');
        // Wait a bit for FluentUI to initialize
        setTimeout(() => {
            window.fluentUIDesignTokens.harvestTokens();
        }, 500);
    });
} else {
    console.log('[FluentUI Tokens] DOM already loaded, scheduling harvest...');
    // Wait a bit for FluentUI to initialize
    setTimeout(() => {
        window.fluentUIDesignTokens.harvestTokens();
    }, 500);
}*/

console.log('[FluentUI Tokens] Module loaded and ready');
