const app = require('@phantomchain/core-container')

/**
 * Start a relay.
 * @param  {Object} options
 * @param  {String} version
 * @return {void}
 */
module.exports = async (options, version) => {
  await app.setUp(version, options, {
    exclude: ['@phantomchain/core-forger'],
    options: {
      '@phantomchain/core-p2p': {
        networkStart: options.networkStart,
        disableDiscovery: options.disableDiscovery,
        skipDiscovery: options.skipDiscovery,
      },
      '@phantomchain/core-blockchain': {
        networkStart: options.networkStart,
      },
    },
  })
}
