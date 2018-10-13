const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    entry: "./src/index.ts",
    output: {
        filename: "index.js",
        path: __dirname + "/dist",
        libraryTarget: "commonjs2"
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
    target : 'node',

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    plugins: [
        new CleanWebpackPlugin(['dist']),
    ],
    module: {
      loaders: [
        { test: /.ts$/, loader: 'awesome-typescript-loader' }
      ]
    },
    watch: true
};
