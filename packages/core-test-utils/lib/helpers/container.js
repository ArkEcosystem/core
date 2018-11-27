const path = require('path')
const app = require('@arkecosystem/core-container')

module.exports = {
  setUp: async options =>
    app.setUp(
      '2.0.0',
      {
        data: options.data || '~/.ark',
        config: options.config
          ? options.config
          : path.resolve(__dirname, '../../config/testnet'),
        token: options.token || 'ark',
        network: options.network || 'testnet',
      },
      options,
    ),
}
