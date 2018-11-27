const app = require('@arkecosystem/core-container')

/**
 * Start a relay.
 * @param  {Object} options
 * @param  {String} version
 * @return {void}
 */
module.exports = async (options, version) => {
  await app.setUp(version, options, {
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
