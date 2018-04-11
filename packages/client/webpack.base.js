const path = require('path')

function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  module: {
    rules: [{
      test: /\.js/,
      loaders: ['babel-loader'],
      exclude: /node_modules/
    }]
  },

  resolve: {
    // alias: {
    //   '@': resolve('src')
    // },
    extensions: ['.js']
  }
}
