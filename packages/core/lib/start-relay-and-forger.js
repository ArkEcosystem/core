const app = require('@arkecosystem/core-container')

/**
 * Start a relay and forger.
 * @param  {Object} options
 * @param  {String} version
 * @return {void}
 */
module.exports = async (options, version) => {
  await app.setUp(version, options, {
    options: {
      '@arkecosystem/core-p2p': {
        networkStart: options.networkStart,
        disableDiscovery: options.disableDiscovery,
        skipDiscovery: options.skipDiscovery,
      },
      '@arkecosystem/core-blockchain': {
        networkStart: options.networkStart,
      },
      '@arkecosystem/core-forger': {
        bip38: options.bip38 || process.env.ARK_FORGER_BIP38,
        address: options.address,
        password: options.password || process.env.ARK_FORGER_PASSWORD,
      },
    },
  })
}
