const path = require('path');

/** @type {import('webpack').Configuration} */
const extensionConfig = {
    mode: 'production',
    target: 'node',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    externals: {
        vscode: 'commonjs vscode'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader'
            }]
        }]
    }
};

/** @type {import('webpack').Configuration} */
const webviewConfig = {
    mode: 'production',
    target: 'web',
    entry: './webview/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webview.js',
        devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader',
                options: {
                    configFile: 'webview/tsconfig.json'
                }
            }]
        }]
    }
};

module.exports = [extensionConfig, webviewConfig];
