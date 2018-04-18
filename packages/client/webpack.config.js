const path = require('path')
const merge = require('webpack-merge')

module.exports = merge(require('./webpack.base'), {
  mode: 'production',

  context: __dirname,

  entry: {
    'index': './lib/index.js',
    'index.min': './lib/index.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: 'ark-javascript-client',
    libraryTarget: 'umd',
    globalObject: 'this'
  },

  externals: ['axios']
})
