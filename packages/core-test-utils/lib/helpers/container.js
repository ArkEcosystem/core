const path = require('path')
const container = require('@arkecosystem/core-container')

module.exports = {
  setUp: async options =>
    container.setUp(
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
