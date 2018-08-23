const path = require('path')
const app = require('@phantomchain/core-container')

module.exports = {
  setUp: async options =>
    app.setUp(
      '2.0.0',
      {
        data: options.data || '~/.phantom',
        config: options.config
          ? options.config
          : path.resolve(__dirname, '../../config/testnet'),
        token: options.token || 'phantom',
        network: options.network || 'testnet',
      },
      options,
    ),
}
