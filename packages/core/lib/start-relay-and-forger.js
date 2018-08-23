const app = require('@phantomchain/core-container')

/**
 * Start a relay and forger.
 * @param  {Object} options
 * @param  {String} version
 * @return {void}
 */
module.exports = async (options, version) => {
  await app.setUp(version, options, {
    options: {
      '@phantomchain/core-p2p': {
        networkStart: options.networkStart,
        disableDiscovery: options.disableDiscovery,
        skipDiscovery: options.skipDiscovery,
      },
      '@phantomchain/core-blockchain': {
        networkStart: options.networkStart,
      },
      '@phantomchain/core-forger': {
        bip38: options.bip38 || process.env.PHANTOM_FORGER_BIP38,
        address: options.address,
        password: options.password || process.env.PHANTOM_FORGER_PASSWORD,
      },
    },
  })
}
