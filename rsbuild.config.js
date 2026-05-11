const path = require('node:path');

// When building for GitHub Pages (https://accamax.github.io/spine_debugger/),
// generated asset URLs must be prefixed with the repo subpath.
// Local dev/build stays at '/'.
const isPagesBuild = process.env.GITHUB_PAGES === 'true';

export default {
    html: {
        template: './public/index.html',
    },
    entry: './src/index.ts',
    output: {
        distPath: {
            root: 'builds/dev',
            js: 'resource/js',
        },
        assetPrefix: isPagesBuild ? '/spine_debugger/' : '/',
    },
    target: 'web',
    sourcemap: true,
    loader: {
        '.png': 'file',
        '.json': 'file',
        '.atlas': 'file',
        '.css': 'css',
    },
    resolveExtensions: ['.ts', '.js'],
};
