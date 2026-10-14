import { build } from 'esbuild';

await build({
    entryPoints: ['src/index.js'],
    outfile: '../wwwroot/js/milkdown-editor.js',
    bundle: true,
    format: 'esm',
    minify: true,
    target: 'es2020',
    legalComments: 'none',
    metafile: false,
    loader: { '.woff': 'dataurl', '.woff2': 'dataurl', '.ttf': 'dataurl', '.svg': 'dataurl' },
    logLevel: 'info'
});
