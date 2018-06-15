module.exports = {
  mode: 'production',

  context: __dirname,

  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader'
      }
    }]
  },

  resolve: {
    extensions: ['.js', '.json']
  }
}
