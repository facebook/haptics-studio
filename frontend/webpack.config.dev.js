/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {resolve, join} = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const env = process.env.NODE_ENV || 'development';
const BROWSER = process.env.BROWSER || 'none';
const outputPath = join(__dirname, 'src');

module.exports = {
  mode: 'development',
  context: resolve(__dirname, 'src'),
  entry: {
    app: [
      // activate HMR for React
      'react-hot-loader/patch',

      './index',
      // the entry point of our app
    ],
  },
  target: 'electron-renderer',
  output: {
    path: outputPath,
    publicPath: '/',
    filename: '[name].js',
  },
  node: {
    __filename: true,
  },
  devtool: 'inline-source-map',
  resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom',
    },
    fallback: {
      fs: false,
      buffer: require.resolve('buffer/'),
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: true,
    moduleIds: 'named',
  },
  devServer: {
    // Change it if other port needs to be used
    port: '8080',

    hot: true,

    historyApiFallback: true,
    open: BROWSER !== 'none',
    allowedHosts: 'all',

    client: {
      overlay: false,
    },

    static: {
      directory: resolve(__dirname, 'src'),
      // match the output `publicPath`
      publicPath: '/',
    },
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
          {loader: 'style-loader'},
          {loader: 'css-loader', options: {sourceMap: true}},
          {loader: 'postcss-loader', options: {sourceMap: true}},
          {loader: 'fast-sass-loader', options: {sourceMap: true}},
        ],
      },
      {
        test: /^((?!\.global).)*\.(sa|sc|c)ss$/,
        use: [
          {loader: 'style-loader'},
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
    // Tells React to build in dev mode. https://facebook.github.io/react/downloads.html
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),

    new ESLintPlugin({
      exclude: [resolve(__dirname, 'node_modules')],
      overrideConfigFile: resolve(__dirname, 'eslint.config.js'),
      eslintPath: 'eslint/use-at-your-own-risk',
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
};
