const path = require('path')
const merge = require('webpack-merge')

module.exports = merge(require('./webpack.base'), {
  mode: 'production',

  context: __dirname,

  entry: {
    'index': './src/index.js',
    'index.min': './src/index.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      root: 'ArkClient',
      amd: 'ark-javascript-client',
      commonjs: 'ark-javascript-client'
    },
    libraryExport: 'default',
    libraryTarget: 'umd',
    globalObject: 'this'
  },

  externals: ['axios']
})
