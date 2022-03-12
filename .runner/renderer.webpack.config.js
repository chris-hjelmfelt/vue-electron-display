'use strict'

process.env.BABEL_ENV = 'renderer'

const path = require('path')
const pkg = require('../package.json')
const webpack = require('webpack')

const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')

// List of node_modules to include in webpack bundle
let whiteListedModules = ['@vue']

let rendererConfig = {
  devtool: 'eval-cheap-module-source-map',
  entry: {
    renderer: path.join(__dirname, '../src/renderer/main.js')
  },
  externals: [
    ...Object.keys(pkg.dependencies || {}).filter(d => !whiteListedModules.includes(d))
  ],
  infrastructureLogging: { level: 'warn' },
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            extractCSS: process.env.NODE_ENV === 'production',
            loaders: {
              sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
              scss: 'vue-style-loader!css-loader!sass-loader',
              less: 'vue-style-loader!css-loader!less-loader'
            }
          }
        }
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader'
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },     
      {
        test: /\.(png|jpe?g|gif)(\?.*)?$/,        
        type: 'asset/resource',
        use: {
          options: {
            limit: 10000,
            name: 'imgs/[name]--[folder].[ext]'
          }
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.(mp4|mp3|webm|wav)(\?.*)?$/,
        type: 'asset/resource',        
        use: {
          options: {
            limit: 10000,
            name: 'media/[name]--[folder].[ext]'
          }
        }
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({filename: 'styles.css'}),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '../src/index.ejs'),
      templateParameters(compilation, assets, options) {
        return {
          compilation: compilation,
          webpack: compilation.getStats().toJson(),
          webpackConfig: compilation.options,
          htmlWebpackPlugin: {
            files: assets,
            options: options,
          },
          process,
        };
      },
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      nodeModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(__dirname, '../node_modules')
        : false
    })
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '../dist/electron'),
    clean: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src/renderer'),
      //'vue$': 'vue/dist/vue.esm.js'
      'vue': '@vue/runtime-dom'
    },
    extensions: ['.js', '.vue', '.json', '.css', '.node', '.tsx', '.ts']
  },
  target: 'electron-renderer',
}

/**
 * Adjust rendererConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  rendererConfig.plugins.push(
    //new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({       
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
}

/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  rendererConfig.devtool = false

  rendererConfig.plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, '../static'),
          to: path.join(__dirname, '../dist/electron/static'),
          globOptions: {
            ignore: ['.*']
          }
        }
      ],
      options: {  
        concurrency: 100,
      },
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'      
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
}

module.exports = rendererConfig