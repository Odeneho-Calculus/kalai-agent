const path = require('path');

module.exports = {
    mode: 'production',
    entry: './webview/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist', 'webview'),
        filename: 'webview.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
        modules: ['node_modules']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devtool: 'source-map'
};
