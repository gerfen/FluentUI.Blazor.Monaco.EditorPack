// ES module wrapper around Milkdown Crepe. Bundled by esbuild into wwwroot/js/milkdown-editor.js.
import { CrepeBuilder } from '@milkdown/crepe/builder';
import { replaceAll } from '@milkdown/kit/utils';
import { remarkStringifyOptionsCtx } from '@milkdown/kit/core';
import { blockEdit } from '@milkdown/crepe/feature/block-edit';
import { codeMirror } from '@milkdown/crepe/feature/code-mirror';
import { cursor } from '@milkdown/crepe/feature/cursor';
import { linkTooltip } from '@milkdown/crepe/feature/link-tooltip';
import { listItem } from '@milkdown/crepe/feature/list-item';
import { placeholder } from '@milkdown/crepe/feature/placeholder';
import { table } from '@milkdown/crepe/feature/table';
import { toolbar } from '@milkdown/crepe/feature/toolbar';

// Only the stylesheets for enabled features (common/style.css would also pull in ~1.4 MB of KaTeX fonts)
import '@milkdown/crepe/theme/common/prosemirror.css';
import '@milkdown/crepe/theme/common/reset.css';
import '@milkdown/crepe/theme/common/block-edit.css';
import '@milkdown/crepe/theme/common/code-mirror.css';
import '@milkdown/crepe/theme/common/cursor.css';
import '@milkdown/crepe/theme/common/link-tooltip.css';
import '@milkdown/crepe/theme/common/list-item.css';
import '@milkdown/crepe/theme/common/placeholder.css';
import '@milkdown/crepe/theme/common/toolbar.css';
import '@milkdown/crepe/theme/common/table.css';

const DEBOUNCE_MS = 300;

// YAML front matter is not part of CommonMark: the editor would mangle it into a rule + heading.
// It is split off before the editor sees the document and re-attached verbatim on the way out.
const FRONT_MATTER = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;

function splitFrontMatter(markdown) {
    const text = markdown ?? '';
    const match = FRONT_MATTER.exec(text);
    if (!match) return { frontMatter: '', body: wrapGridTables(text) };

    // Normalize to exactly one blank line between front matter and body on output.
    return { frontMatter: match[0].replace(/\s+$/, '') + '\n', body: wrapGridTables(text.slice(match[0].length).replace(/^(?:\r?\n)+/, '')) };
}

// Markdig grid tables (+---+ ... | cell |) are not understood by the editor and would be mangled into escaped text.
// They are shown as a monospace code block and unwrapped verbatim on the way out.
const GRID_FENCE = 'gridtable';
const GRID_LINE = /^[+|].*[+|][ \t]*$/;
const GRID_BORDER = /^\+[-=:+]+\+[ \t]*$/;

function wrapGridTables(body) {
    const lines = body.split(/\r?\n/);
    const out = [];
    let fence = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*(```|~~~)/.test(line)) fence = !fence;
        if (!fence && GRID_BORDER.test(line)) {
            let j = i;
            while (j < lines.length && GRID_LINE.test(lines[j])) j++;
            if (j - i >= 3) {
                out.push('```' + GRID_FENCE, ...lines.slice(i, j), '```');
                i = j - 1;
                continue;
            }
        }
        out.push(line);
    }
    return out.join('\n');
}

function unwrapGridTables(markdown) {
    return markdown.replace(new RegExp('^```' + GRID_FENCE + '[ \\t]*\\n([\\s\\S]*?)\\n```[ \\t]*$', 'gm'), (_m, table) => table);
}
// Stylesheets are resolved relative to this module so base href / _content paths just work.
// The Fluent theme is appended last so its variable mapping overrides Crepe's defaults.
function ensureStyles() {
    for (const href of ['./milkdown-editor.css', '../css/fluent-milkdown-theme.css']) {
        const url = new URL(href, import.meta.url).href;
        if (!document.querySelector(`link[data-editorpack-wysiwyg][href="${url}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.dataset.editorpackWysiwyg = '';
            document.head.appendChild(link);
        }
    }
}

/**
 * Creates an editor inside `element`.
 * @param {HTMLElement} element container (owned by JS; Blazor must never render children into it)
 * @param {{ value?: string, readOnly?: boolean, placeholder?: string }} options
 * @param {{ invokeMethodAsync: (name: string, ...args: any[]) => Promise<any> } | null} dotNetRef
 */
export async function create(element, options, dotNetRef) {
    ensureStyles();

    const initial = splitFrontMatter(options.value);
    let frontMatter = initial.frontMatter;
    const compose = raw => {
        const body = unwrapGridTables(raw);
        return frontMatter ? frontMatter + (body ? '\n' + body : '') : body;
    };

    const builder = new CrepeBuilder({ root: element, defaultValue: initial.body });

    // Keep '-' list markers (the remark default is '*') so round-tripping doesn't rewrite users' documents.
    builder.editor.config(ctx => {
        ctx.update(remarkStringifyOptionsCtx, prev => ({ ...prev, bullet: '-', rule: '-' }));
    });

    builder
        .addFeature(cursor)
        .addFeature(listItem)
        .addFeature(linkTooltip)
        .addFeature(blockEdit)
        .addFeature(toolbar)
        .addFeature(table)
        .addFeature(codeMirror)
        .addFeature(placeholder, { text: options.placeholder ?? 'Write something...' });

    let timer = null;
    let lastSent = compose(initial.body);
    let disposed = false;

    builder.on(listener => {
        listener.markdownUpdated((_ctx, markdown, prevMarkdown) => {
            if (disposed || markdown === prevMarkdown) return;
            clearTimeout(timer);
            timer = setTimeout(() => {
                const full = compose(markdown);
                if (disposed || full === lastSent) return;
                lastSent = full;
                dotNetRef?.invokeMethodAsync('OnMarkdownChanged', full)
                    .catch(err => console.error('[EditorPack.Wysiwyg] change notification failed', err));
            }, DEBOUNCE_MS);
        });
    });

    await builder.create();
    builder.setReadonly(!!options.readOnly);

    // Milkdown rewrites unsafe URLs (javascript:, data:) to an empty href, which would navigate to the host page itself.
    const blockEmptyLinks = e => {
        const a = e.target instanceof Element ? e.target.closest('a') : null;
        if (a && !a.getAttribute('href')) e.preventDefault();
    };
    element.addEventListener('click', blockEmptyLinks, true);

    return {
        getMarkdown: () => compose(builder.getMarkdown()),
        setMarkdown: markdown => {
            const next = splitFrontMatter(markdown);
            frontMatter = next.frontMatter;
            builder.editor.action(replaceAll(next.body));
            // Suppress the echo using the editor's normalized form (e.g. trailing newline added).
            lastSent = compose(builder.getMarkdown());
            clearTimeout(timer);
        },
        setReadOnly: value => { builder.setReadonly(!!value); },
        focus: () => element.querySelector('.ProseMirror')?.focus(),
        async destroy() {
            disposed = true;
            clearTimeout(timer);
            element.removeEventListener('click', blockEmptyLinks, true);
            await builder.destroy();
        }
    };
}
