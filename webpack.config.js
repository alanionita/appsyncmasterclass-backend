const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
    entry: slsw.lib.entries,
    stats: {
        assets: true,
        chunks: true,
        modules: true,
        children: true,
        excludeAssets: /node_modules/,
        source: false
    },
    mode: "production",
    target: 'node',
    optimization: {
        minimize: true
    },
    externals: [
        nodeExternals({
            allowlist: [
                /^(?!@aws-sdk|aws-sdk|@smithy)/
            ]
        })
    ],
    resolve: {
        extensions: ['.js', '.mjs', '.json'],
        mainFields: ['main', 'module'] // Prioritize CommonJS
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins: [
        new BundleAnalyzerPlugin({
            analyzerMode: 'disabled', // Don't open automatically
            generateStatsFile: true,
            statsFilename: 'stats.json',
            openAnalyzer: false
        })
    ]

};