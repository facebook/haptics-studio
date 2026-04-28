/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

require('dotenv').config();

const fs = require('fs');
const {resolve, join} = require('path');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const env = process.env.NODE_ENV || 'production';
// if not declared is set equals to env
const developerMessages = process.env.DEVELOPER_MESSAGES || 'false';

const outputPath = join(__dirname, 'dist');
const configPath = join(__dirname, 'configs');
const isProd = env === 'production';

console.log(`DEVELOPER_MESSAGES ${developerMessages}\n`); // eslint-disable-line no-console

const GLOBALS = {
  'process.env.NODE_ENV': JSON.stringify(env),
  'process.env.DEVELOPER_MESSAGES': JSON.stringify(developerMessages),
  __DEV__: false,
};

function initConfigFile(environment) {
  const configFile = join(configPath, `configs.${environment}.json`);
  const exampleConfigFile = join(
    configPath,
    `configs.${environment}.json.example`,
  );
  if (!fs.existsSync(configFile) && fs.existsSync(exampleConfigFile)) {
    fs.copyFileSync(exampleConfigFile, configFile);
  }
}

initConfigFile(env);

module.exports = (webpackEnv, argv) => {
  const {platform = process.platform, arch = process.arch} = webpackEnv;
  console.log(
    `\nCompile main for ${env} environment on platform ${platform} and architecture ${arch}\n`,
  ); // eslint-disable-line no-console
  return {
    mode: isProd ? 'production' : 'development',
    context: resolve(__dirname, 'src'),
    entry: {main: './main'},
    target: 'electron-main',
    output: {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      path: outputPath,
      filename: '[name].js',
    },
    devtool: isProd ? undefined : 'source-map',
    optimization: {
      minimize: isProd,
    },

    /**
     * Disables webpack processing of __dirname and __filename.
     * If you run the bundle in node.js it falls back to these values of node.js.
     * https://github.com/webpack/webpack/issues/2010
     */
    node: {
      __dirname: false,
      __filename: false,
    },

    plugins: [
      new webpack.DefinePlugin(GLOBALS),

      new ESLintPlugin({
        exclude: [resolve(__dirname, 'node_modules')],
        overrideConfigFile: resolve(__dirname, 'eslint.config.js'),
        eslintPath: 'eslint/use-at-your-own-risk',
      }),

      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),

      new CopyWebpackPlugin(
        {
          patterns: [
            {
              from: `../configs/configs.${env}.json`,
              to: `configs/configs.${env}.json`,
            },
            {
              from: '../../node_modules/@ffmpeg/core/dist',
              to: './ffmpeg-core',
            },
            {
              from: '../assets',
              to: './assets',
            },
          ],
        },
        {debug: false},
      ),
    ],
    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx', '.node'],
      alias: {
        // @oss-disable
        // @oss-disable
          __dirname,// @oss-disable
          '..',// @oss-disable
          // @oss-disable
        // @oss-disable
        HapticsSdkNapi: resolve(
          __dirname,
          '..',
          `native/bin/${platform === 'win32' ? 'win' : 'mac'}/${isProd ? 'production' : 'development'}/HapticsSDK.node`,
        ),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: [resolve(__dirname, 'node_modules')],
          use: [{loader: 'ts-loader'}],
        },
        {
          include: [/@ffmpeg\/ffmpeg\/src\/node\/getCreateFFmpegCore\.js/],
          loader: 'string-replace-loader',
          options: {
            search: 'require(\\([^\'"])',
            replace: '__non_webpack_require__$1',
            flags: 'g',
          },
        },
        {
          test: /\.(m?js|node)$/,
          parser: {amd: false},
          use: [
            {
              loader: '@zeit/webpack-asset-relocator-loader',
              options: {
                outputAssetBase: 'native_modules',
              },
            },
          ],
        },
      ],
    },
    externals: [
      {
        bufferutil: 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
        '@ffmpeg/core': '@ffmpeg/core',
      },
    ],
  };
};
