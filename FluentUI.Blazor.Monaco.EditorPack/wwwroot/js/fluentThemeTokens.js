// Fluent UI Blazor 5.x theme bridge for Monaco.
// - Reads theme values from CSS custom properties (the only runtime source of truth in 5.x)
// - Normalizes every value to a Monaco-safe hex color
// - Detects light/dark and notifies listeners when the theme changes
// - Translates legacy 4.x token names so existing callers keep working

(function () {
    'use strict';

    if (window.fluentThemeTokens) {
        return;
    }

    // Semantic key -> ordered list of CSS variables (first one that resolves wins).
    const TOKENS = {
        foreground:          { vars: ['--colorNeutralForeground1'] },
        foregroundMuted:     { vars: ['--colorNeutralForeground3', '--colorNeutralForeground2'] },
        background:          { vars: ['--colorNeutralBackground1'] },
        backgroundAlt:       { vars: ['--colorNeutralBackground2', '--colorNeutralBackground1'] },
        backgroundCard:      { vars: ['--colorNeutralBackground3', '--colorNeutralBackground2'] },
        backgroundHover:     { vars: ['--colorNeutralBackground1Hover', '--colorSubtleBackgroundHover'] },
        backgroundHoverAlt:  { vars: ['--colorNeutralBackground2Hover', '--colorNeutralBackground1Hover'] },
        stroke:              { vars: ['--colorNeutralStroke2', '--colorNeutralStroke1'] },
        scrollbar:           { vars: ['--colorNeutralStroke1'] },
        scrollbarHover:      { vars: ['--colorNeutralStroke1Hover', '--colorNeutralStroke1'] },
        scrollbarActive:     { vars: ['--colorNeutralStroke1Pressed', '--colorNeutralStroke1'] },
        brandBackground:     { vars: ['--colorBrandBackground'] },
        brandForeground:     { vars: ['--colorBrandForeground1', '--colorBrandBackground'] },
        successForeground:   { vars: ['--colorStatusSuccessForeground1'] },
        fontFamily:          { vars: ['--fontFamilyBase'], raw: true },
        radius:              { vars: ['--borderRadiusMedium'], raw: true }
    };

    // 4.x token name -> semantic key
    const LEGACY_ALIASES = {
        '--neutral-foreground-rest':        'foreground',
        '--neutral-foreground-hint':        'foregroundMuted',
        '--neutral-layer-1':                'background',
        '--neutral-fill-layer-rest':        'background',
        '--neutral-layer-card-container':   'backgroundCard',
        '--neutral-fill-hover':             'backgroundHover',
        '--neutral-fill-secondary-hover':   'backgroundHoverAlt',
        '--neutral-stroke-layer-rest':      'stroke',
        '--neutral-fill-stealth-rest':      'scrollbar',
        '--neutral-fill-stealth-hover':     'scrollbarHover',
        '--neutral-fill-stealth-active':    'scrollbarActive',
        '--accent-fill-rest':               'brandBackground',
        '--accent-foreground-rest':         'brandForeground',
        '--body-font':                      'fontFamily',
        '--control-corner-radius':          'radius'
    };

    const sources = () => [document.documentElement, document.body].filter(Boolean);

    function readVar(name) {
        for (const el of sources()) {
            const v = getComputedStyle(el).getPropertyValue(name).trim();
            if (v) return v;
        }
        return null;
    }

    let probe = null;
    function getProbe() {
        if (!probe) {
            probe = document.createElement('span');
            probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none;';
        }
        if (!probe.isConnected) {
            (document.body || document.documentElement).appendChild(probe);
        }
        return probe;
    }

    /** Resolve any CSS color (hex, rgb, hsl, color-mix, color(), named, var()) to #RRGGBB or #RRGGBBAA. */
    function toHex(value) {
        if (!value) return null;
        const el = getProbe();
        el.style.color = '';
        el.style.color = value;
        if (!el.style.color) return null;

        const resolved = getComputedStyle(el).color;
        const nums = resolved.match(/-?\d*\.?\d+(?:e-?\d+)?%?/g);
        if (!nums || nums.length < 3) return null;

        let channels;
        let alpha = nums.length >= 4 ? parseFloat(nums[3]) : 1;
        if (nums.length >= 4 && nums[3].endsWith('%')) alpha /= 100;

        if (/^color\(/i.test(resolved)) {
            // color(srgb r g b / a) with 0..1 components
            channels = nums.slice(0, 3).map(n => Math.round(parseFloat(n) * 255));
        } else {
            channels = nums.slice(0, 3).map(n => Math.round(parseFloat(n)));
        }

        const hex = channels.map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
        const a = alpha < 1 ? Math.round(alpha * 255).toString(16).padStart(2, '0') : '';
        return ('#' + hex + a).toUpperCase();
    }

    function relativeLuminance(hex) {
        const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex || '');
        if (!m) return null;
        const [r, g, b] = [m[1], m[2], m[3]].map(h => {
            const c = parseInt(h, 16) / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /** Resolve a semantic key, a 5.x CSS variable (--colorX) or a 4.x CSS variable to a value. */
    function get(nameOrKey) {
        if (!nameOrKey) return null;

        const key = TOKENS[nameOrKey] ? nameOrKey : LEGACY_ALIASES[nameOrKey];
        const def = key ? TOKENS[key] : { vars: [nameOrKey] };

        for (const name of def.vars) {
            const raw = readVar(name);
            if (!raw) continue;
            if (def.raw) return raw;
            const hex = toHex(raw);
            if (hex) return hex;
        }
        return null;
    }

    /** Light/dark detection that does not depend on any Fluent JS module. */
    function isLight() {
        const html = document.documentElement;

        const attr = (html.getAttribute('data-theme') || document.body?.getAttribute('data-theme') || '').toLowerCase();
        if (attr.includes('dark')) return false;
        if (attr.includes('light')) return true;

        const scheme = getComputedStyle(html).colorScheme || '';
        if (/\bdark\b/.test(scheme) && !/\blight\b/.test(scheme)) return false;
        if (/\blight\b/.test(scheme) && !/\bdark\b/.test(scheme)) return true;

        const bg = get('background');
        const lum = relativeLuminance(bg);
        if (lum !== null) return lum > 0.4;

        return !window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    }

    function signature() {
        return [isLight(), get('background'), get('foreground'), get('brandBackground')].join('|');
    }

    /**
     * Subscribe to theme changes. The callback only fires when the resolved values actually change.
     * @returns {() => void} dispose function
     */
    function onChange(callback) {
        let last = signature();
        let timer = null;

        const check = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const current = signature();
                if (current !== last) {
                    last = current;
                    try { callback(isLight()); } catch (e) { console.error('[FluentTheme] listener failed', e); }
                }
            }, 50);
        };

        const observer = new MutationObserver(check);
        const options = { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] };
        sources().forEach(el => observer.observe(el, options));

        const media = window.matchMedia?.('(prefers-color-scheme: dark)');
        media?.addEventListener?.('change', check);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
            media?.removeEventListener?.('change', check);
        };
    }

    /** Append an alpha byte (e.g. '40') to a #RRGGBB(AA) color. */
    function withAlpha(hex, alphaByte) {
        if (!hex) return hex;
        return hex.slice(0, 7) + alphaByte;
    }

    const strip = hex => (hex || '').replace('#', '');

    /**
     * Build a Monaco theme definition from the current Fluent 5.x tokens.
     * @param {{ language?: string }} [options] language suffix for token rules (e.g. 'css')
     */
    function buildMonacoTheme(options = {}) {
        const light = isLight();
        const suffix = options.language ? '.' + options.language : '';

        const c = {
            fg:        get('foreground')         || (light ? '#242424' : '#D4D4D4'),
            muted:     get('foregroundMuted')    || (light ? '#6E6E6E' : '#858585'),
            bg:        get('background')         || (light ? '#FFFFFF' : '#1E1E1E'),
            hover:     get('backgroundHover')    || get('backgroundHoverAlt') || (light ? '#F5F5F5' : '#2A2D2E'),
            stroke:    get('stroke')             || (light ? '#E0E0E0' : '#454545'),
            brand:     get('brandBackground')    || (light ? '#0F6CBD' : '#115EA3'),
            brandFg:   get('brandForeground')    || (light ? '#0F6CBD' : '#479EF5'),
            success:   get('successForeground')  || (light ? '#107C10' : '#54B054'),
            sb:        get('scrollbar')          || (light ? '#C8C6C4' : '#797979'),
            sbHover:   get('scrollbarHover')     || (light ? '#A19F9D' : '#646464'),
            sbActive:  get('scrollbarActive')    || (light ? '#605E5C' : '#BFBFBF')
        };

        return {
            base: light ? 'vs' : 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment' + suffix, foreground: strip(c.muted), fontStyle: 'italic' },
                { token: 'keyword' + suffix, foreground: strip(c.brandFg) },
                { token: 'string' + suffix,  foreground: strip(c.success) },
                { token: 'number' + suffix,  foreground: strip(c.brandFg) },
                { token: 'tag' + suffix,     foreground: strip(c.brandFg) }
            ],
            colors: {
                'editor.background': c.bg,
                'editor.foreground': c.fg,
                'editorGutter.background': c.bg,
                'editorLineNumber.foreground': c.muted,
                'editorLineNumber.activeForeground': c.fg,
                'editorCursor.foreground': c.brand,
                'editor.selectionBackground': withAlpha(c.brand, light ? '50' : '66'),
                'editor.inactiveSelectionBackground': withAlpha(c.brand, light ? '30' : '33'),
                'editor.lineHighlightBackground': c.hover,
                'editorWhitespace.foreground': withAlpha(c.muted, '40'),
                'editorIndentGuide.background': withAlpha(c.muted, '30'),
                'editorIndentGuide.activeBackground': withAlpha(c.muted, '60'),
                'scrollbarSlider.background': withAlpha(c.sb, '60'),
                'scrollbarSlider.hoverBackground': withAlpha(c.sbHover, '80'),
                'scrollbarSlider.activeBackground': withAlpha(c.sbActive, '90'),

                'editorSuggestWidget.background': c.bg,
                'editorSuggestWidget.foreground': c.fg,
                'editorSuggestWidget.border': c.stroke,
                'editorSuggestWidget.selectedBackground': c.hover,
                'editorSuggestWidget.selectedForeground': c.fg,
                'editorSuggestWidget.highlightForeground': c.brandFg,
                'editorSuggestWidget.focusHighlightForeground': c.brandFg,

                'editorHoverWidget.background': c.bg,
                'editorHoverWidget.foreground': c.fg,
                'editorHoverWidget.border': c.stroke,

                'peekView.border': c.stroke,
                'peekViewEditor.background': c.bg,
                'peekViewResult.background': c.bg,
                'peekViewTitle.background': c.bg
            }
        };
    }

    window.fluentThemeTokens = {
        TOKENS,
        LEGACY_ALIASES,
        get,
        toHex,
        withAlpha,
        isLight,
        onChange,
        buildMonacoTheme
    };

    console.log('[FluentTheme] Fluent UI Blazor 5.x theme bridge ready');
})();
