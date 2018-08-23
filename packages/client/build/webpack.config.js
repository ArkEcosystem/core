const path = require('path')
const merge = require('webpack-merge')
const pkg = require('../package.json')
const base = require('./webpack.base')
const nodeExternals = require('webpack-node-externals')

const resolve = (dir) => path.resolve(__dirname, '..', dir)

const format = (dist) => ({
  path: resolve(path.dirname(dist)),
  filename: path.basename(dist)
})

// bundle without crypto package
const browserConfig = {
  entry: resolve(pkg.main),
  target: 'web',
  babel: {
    modules: 'umd',
    useBuiltIns: 'usage',
    targets: {
      browsers: 'defaults'
    }
  },
  output: {
    ...format(pkg.browser),
    library: 'phantomcoreClient',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'this'
  }
}

const moduleConfig = {
  target: 'node',
  babel: {
    modules: 'commonjs',
    targets: {
      node: 'current'
    }
  },
  externals: [nodeExternals({
    modulesFromFile: true,
    modulesDir: resolve('node_modules')
  })],
  entry: resolve(pkg.main),
  output: {
    ...format(pkg.module),
    libraryTarget: 'commonjs2'
  },
  optimization: {
    minimize: false
  }
}

module.exports = [browserConfig, moduleConfig].map(({ babel, ...entry }) => merge(base(babel), entry));
