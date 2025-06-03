const esbuild = require('esbuild');
const path = require('path');

// Build configuration for the main extension
const extensionConfig = {
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    outfile: './dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
    minify: true,
    target: 'node16',
    define: {
        'process.env.NODE_ENV': '"production"'
    }
};

// Build configuration for the webview
const webviewConfig = {
    entryPoints: ['./webview/index.tsx'],
    bundle: true,
    outfile: './dist/webview/webview.js',
    format: 'iife',
    platform: 'browser',
    sourcemap: true,
    minify: true,
    target: 'es2020',
    loader: {
        '.css': 'css',
        '.tsx': 'tsx',
        '.ts': 'ts'
    },
    define: {
        'process.env.NODE_ENV': '"production"'
    }
};

async function build() {
    try {
        console.log('Building extension...');
        await esbuild.build(extensionConfig);
        console.log('✅ Extension built successfully');

        console.log('Building webview...');
        await esbuild.build(webviewConfig);
        console.log('✅ Webview built successfully');

        console.log('🎉 All builds completed successfully!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Run build if this file is executed directly
if (require.main === module) {
    build();
}

module.exports = { build, extensionConfig, webviewConfig };