const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');

module.exports = (env, argv) => {
    const isProductionMode = argv.mode === 'production';

    return {
        entry: ['./src/production.js'],
        mode: isProductionMode ? 'production' : 'development',
        devtool: isProductionMode ? 'source-map' : 'eval-source-map',
        output: {
            path: path.resolve(__dirname, './dist'),
            publicPath: '/',
            filename: 'app.js',
            libraryTarget: 'amd',
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                    },
                },
                // Vue SFC: <style lang="scss"> (and plain CSS) — needs sass-loader for SCSS
                {
                    test: /\.vue$/,
                    resourceQuery: /type=style/,
                    use: ['vue-style-loader', 'css-loader', 'sass-loader'],
                },
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: ['vue-style-loader', 'css-loader'],
                },
            ],
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
            extensions: ['.js', '.ts', '.vue'],
        },
        plugins: [
            new VueLoaderPlugin(),
            new WebpackShellPluginNext({
                onAfterDone: {
                    scripts: isProductionMode ? ['node zipFiles.js'] : [],
                    blocking: true,
                    parallel: false
                }
            })
        ],
    };
};
