function notify() {
    setTimeout(() => {
        try { window.monacoMarkdownEditor?.refreshAllEditorThemes?.(); } catch { }
        try { window.monacoCssEditor?.refreshAllEditorThemes?.(); } catch { }
    }, 100);
}

export function sync(dark) {
    const root = document.documentElement;
    root.setAttribute("data-theme", dark ? "dark" : "light");
    root.style.colorScheme = dark ? "dark" : "light";
    document.body.setAttribute("data-theme", dark ? "dark" : "light");
    notify();
}
