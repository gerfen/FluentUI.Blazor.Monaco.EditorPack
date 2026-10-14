// Round-trip fidelity tests: load the committed bundle in headless Chromium and verify
// setMarkdown -> getMarkdown behaviour. Run with `npm test` (needs `npx playwright install chromium`).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'wwwroot');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };

let server, browser, page, base;

before(async () => {
    server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x');
        if (url.pathname === '/') {
            res.setHeader('content-type', 'text/html');
            res.end('<!doctype html><html><body><div id="host"></div></body></html>');
            return;
        }
        const file = path.join(root, path.normalize(url.pathname));
        if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            res.statusCode = 404;
            res.end();
            return;
        }
        res.setHeader('content-type', types[path.extname(file)] ?? 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;

    browser = await chromium.launch();
    page = await browser.newPage();
    page.on('pageerror', e => { throw e; });
    await page.goto(base + '/');
    await page.evaluate(async url => {
        const mod = await import(url);
        window.__mod = mod;
        window.__roundTrip = async md => {
            const host = document.getElementById('host');
            host.replaceChildren();
            const editor = await mod.create(host, { value: md }, null);
            const out = editor.getMarkdown();
            await editor.destroy();
            return out;
        };
    }, base + '/js/milkdown-editor.js');
});

after(async () => {
    await browser?.close();
    await new Promise(r => server?.close(r));
});

const roundTrip = md => page.evaluate(m => window.__roundTrip(m), md);
const norm = s => s.replace(/\r\n/g, '\n').replace(/\n+$/, '');

// Documents that must come back unchanged (ignoring trailing newlines).
const stable = {
    'headings': '# H1\n\n## H2\n\n### H3',
    'dash bullets stay dashes': '- a\n- b\n  - c',
    'ordered list': '1. one\n2. two',
    'emphasis': '_em_ and **strong** and `code`',
    'fenced code': '```js\nconst x = 1;\n```',
    'table': '| a | b |\n| - | - |\n| 1 | 2 |',
    'task list': '- [ ] todo\n- [x] done',
    'link': '[text](https://example.com)',
    'image with title': '![alt](https://example.com/a.png "title")',
    'horizontal rule': 'a\n\n---\n\nb',
    'blockquote': '> quoted',
    'front matter': '---\ntitle: Hi\ntags: [a, b]\n---\n\n# Body',
};

for (const [name, md] of Object.entries(stable)) {
    test(`round-trip stable: ${name}`, async () => {
        assert.equal(norm(await roundTrip(md)), norm(md));
    });
}

test('front matter is preserved verbatim with CRLF', async () => {
    const out = await roundTrip('---\r\ntitle: Hi\r\n---\r\n\r\n# Body');
    assert.ok(out.startsWith('---\r\ntitle: Hi\r\n---'), JSON.stringify(out));
    assert.ok(out.includes('# Body'));
});

// Documented normalizations (see README "Known limitations"). If these start to fail, update the README.
test('known: bare autolink becomes angle-bracket form', async () => {
    assert.equal(norm(await roundTrip('see https://example.com')), 'see <https://example.com>');
});

test('known: runs of blank lines collapse', async () => {
    assert.equal(norm(await roundTrip('a\n\n\n\nb')), 'a\n\nb');
});

test('raw HTML is not executed', async () => {
    await roundTrip('<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>');
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__xss ?? null), null);
});

test('javascript: links are neutralized and do not execute on click', async () => {
    await page.evaluate(async () => {
        const host = document.getElementById('host');
        host.replaceChildren();
        window.__ed = await window.__mod.create(host, { value: '[click](javascript:window.__xss=1)', readOnly: true }, null);
    });
    assert.equal(await page.getAttribute('#host a', 'href'), '');
    await page.click('#host a');
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__xss ?? null), null);
    await page.evaluate(() => window.__ed.destroy());
});

test('pasted HTML is reduced to schema nodes (no scripts, handlers or styles)', async () => {
    await page.evaluate(async () => {
        const host = document.getElementById('host');
        host.replaceChildren();
        window.__ed = await window.__mod.create(host, { value: '' }, null);
    });
    await page.click('#host .ProseMirror');
    await page.evaluate(() => {
        const dt = new DataTransfer();
        dt.setData('text/html', '<p onclick="window.__xss=1" style="position:fixed">hi</p><script>window.__xss=1</script><img src=x onerror="window.__xss=1"><iframe src="about:blank"></iframe>');
        document.querySelector('#host .ProseMirror').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(300);
    const html = await page.innerHTML('#host .ProseMirror');
    assert.ok(!/onclick|onerror|<script|<iframe|position:fixed/i.test(html), html);
    assert.equal(await page.evaluate(() => window.__xss ?? null), null);
    await page.evaluate(() => window.__ed.destroy());
});

