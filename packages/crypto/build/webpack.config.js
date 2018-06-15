const path = require('path')
const merge = require('webpack-merge')
const pkg = require('../package.json')
const nodeExternals = require('webpack-node-externals')

const resolve = (dir) => path.resolve(__dirname, '..', dir)

const format = (dist) => ({
  path: resolve(path.dirname(dist)),
  filename: path.basename(dist)
})

const config = [
  {
    entry: resolve(pkg.main),
    target: 'web',
    node: {
      net: 'empty'
    },
    output: {
      ...format(pkg.browser),
      library: 'ArkCrypto',
      libraryExport: 'default',
      libraryTarget: 'umd'
    }
  },
  {
    target: 'node',
    externals: [nodeExternals({
      modulesFromFile: true,
      modulesDir: resolve('node_modules')
    })],
    entry: resolve(pkg.main),
    output: {
      ...format(pkg.module)
    }
  }
].map(entry => merge(require('./webpack.base'), entry));

module.exports = config
