# FluentUI.Blazor.Monaco.EditorPack.Wysiwyg

A WYSIWYG Markdown editor for Blazor, built on [Milkdown](https://milkdown.dev) (MIT) and themed with Fluent UI v5 design tokens. It is a companion to [FluentUI.Blazor.Monaco.EditorPack](https://www.nuget.org/packages/FluentUI.Blazor.Monaco.EditorPack/) and is installed separately.

> Preview release. Requires `Microsoft.FluentUI.AspNetCore.Components` 5.x.

## Install

```bash
dotnet add package FluentUI.Blazor.Monaco.EditorPack.Wysiwyg
```

The package depends on `FluentUI.Blazor.Monaco.EditorPack`; no extra script or stylesheet tags are needed. The editor imports its own JS module and styles on demand.

## Usage

```razor
@using FluentUI.Blazor.Monaco.EditorPack.Wysiwyg.Components

<WysiwygMarkdownEditor @bind-Value="markdown" Placeholder="Write something..." Style="height: 400px;" />

@code {
	private string markdown = "# Hello\n\nSome **bold** text.";
}
```

| Parameter | Description |
|---|---|
| `Value` / `ValueChanged` | The Markdown document. Changes are debounced (300 ms). |
| `ReadOnly` | Disables editing. |
| `Placeholder` | Text shown in an empty document. |
| `Id`, `Class`, `Style` | Host element attributes. |

Methods: `GetMarkdownAsync()`, `FocusAsync()`; property `IsInitialized`.

Because the editor and the Monaco source editor both work with plain Markdown strings, you can bind the same value to both for a WYSIWYG/source toggle (see the demo app).

## Features

Headings, emphasis, lists, task lists, tables, links, fenced code blocks (CodeMirror), block menu, floating toolbar, and read-only mode. YAML front matter is preserved verbatim.

## Known limitations

Markdown is normalized when the editor re-serializes it:

- Bare autolinks (`https://x`) become `<https://x>`.
- Runs of blank lines collapse; body line endings become `\n`.
- Markdig-specific extensions (grid tables, figures, etc.) have no WYSIWYG equivalent.
- Image blocks are disabled for now (the default handling rewrote alt text).
- Raw HTML is shown as inert text, never executed. Sanitize rendered output yourself when displaying user content.

## Rebuilding the JS bundle

The bundle in `wwwroot/js` is committed, so building the package needs no Node. To rebuild it after changing `Js/src/index.js` or dependencies:

```bash
cd Js
npm install
npm run build
node generate-notices.mjs
```

## License

MIT. Bundled third-party licenses are listed in `THIRD-PARTY-NOTICES.txt`.
