const container = require('@arkecosystem/core-container')

/**
 * Start a relay.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async options => {
  await container.setUp(options, {
    exclude: ['@arkecosystem/core-forger'],
    options: {
      '@arkecosystem/core-p2p': {
        networkStart: options.networkStart,
        disableDiscovery: options.disableDiscovery,
        skipDiscovery: options.skipDiscovery,
      },
      '@arkecosystem/core-blockchain': {
        networkStart: options.networkStart,
      },
    },
  })
}
