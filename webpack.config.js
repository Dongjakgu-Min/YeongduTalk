const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const prod = process.env.NODE_ENV === 'production';

module.exports = {
    mode: prod ? 'production' : 'development',
    devtool: prod ? 'hidden-source-map' : 'eval',
    target: 'electron-renderer',

    devServer: {
        historyApiFallback: true,
        port: 3000,
        hot: true,
        static: {
            publicPath: '/',
        }
    },

    entry: './src/index.tsx',

    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },

    module: {
        rules: [
            {
                test: /\.(ts|tsx)?$/,
                use: ['babel-loader', 'ts-loader'],
            },
            {
                test:/\.css$/,
                use:['style-loader' ,'file-loader', 'url-loader', 'css-loader'],
            },
            {
                test: /\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader',
                options: {
                    name: '[hash].[ext]',
                    limit: 10000,
                },
            }
        ],
    },

    output: {
        path: path.join(__dirname, '/dist'),
        filename: 'bundle.js',
    },

    plugins: [
        new webpack.ProvidePlugin({
            React: 'react',
        }),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
    ],
};