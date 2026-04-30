/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {resolve, join} = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const env = process.env.NODE_ENV || 'production';
const outputPath = join(__dirname, 'dist');

console.log(`\nCompile frontend for ${env} environment\n`); // eslint-disable-line no-console

module.exports = {
  mode: 'production',
  context: resolve(__dirname, 'src'),
  entry: {
    app: ['./index'],
  },
  target: 'electron-renderer',
  output: {
    path: outputPath,
    publicPath: '',
    filename: '[name].[contenthash].js',
  },
  node: {
    __filename: true,
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  optimization: {
    runtimeChunk: true,
    moduleIds: 'named',
    chunkIds: 'total-size',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)?$/,
        use: [
          {loader: 'babel-loader', options: {cacheDirectory: true}},
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
        exclude: [resolve(__dirname, 'node_modules')],
      },
      {enforce: 'pre', test: /\.js$/, loader: 'source-map-loader'},
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {test: /\.(woff|woff2|eot|ttf|otf)$/i, type: 'asset/resource'},
      {test: /\.(png|svg|jpg|jpeg|gif)$/i, type: 'asset/resource'},
      {
        test: /\.ico$/,
        type: 'asset/resource',
        generator: {filename: '[name][ext]'},
      },
      {
        test: /\.mp4$/,
        type: 'asset/resource',
        generator: {filename: '[name][ext]'},
      },

      {
        test: /\.global\.(sa|sc|c)ss$/,
        use: [
          {loader: MiniCssExtractPlugin.loader},
          {loader: 'css-loader', options: {sourceMap: true}},
          {loader: 'postcss-loader', options: {sourceMap: true}},
          {loader: 'fast-sass-loader', options: {sourceMap: true}},
        ],
      },
      {
        test: /^((?!\.global).)*\.(sa|sc|c)ss$/,
        use: [
          {loader: MiniCssExtractPlugin.loader},
          {
            loader: 'css-loader',
            options: {
              modules: {
                mode: 'local',
                localIdentName: '[name]__[local]___[hash:base64:5]',
              },
              sourceMap: true,
              importLoaders: 1,
            },
          },
          {loader: 'postcss-loader', options: {sourceMap: true}},
          {loader: 'fast-sass-loader', options: {sourceMap: true}},
        ],
      },
    ],
  },
  plugins: [
    // Tells React to build in prod mode. https://facebook.github.io/react/downloads.html
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'production',
      ),
    }),

    new ESLintPlugin({
      exclude: [resolve(__dirname, 'node_modules')],
      overrideConfigFile: resolve(__dirname, 'eslint.config.js'),
      eslintPath: 'eslint/use-at-your-own-risk',
    }),

    // Generate an external css file with a hash in the filename
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].css',
    }),

    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),

    // Generate HTML file that contains references to generated bundles. See here for how this works: https://github.com/ampedandwired/html-webpack-plugin#basic-usage
    new HtmlWebpackPlugin({
      template: './index.ejs',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      inject: true,
    }),
  ],
  performance: false,
};
