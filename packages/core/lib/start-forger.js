const app = require('@arkecosystem/core-container')

/**
 * Start a forger.
 * @param  {Object} options
 * @param  {String} version
 * @return {void}
 */
module.exports = async (options, version) => {
  await app.setUp(version, options, {
    include: [
      '@arkecosystem/core-event-emitter',
      '@arkecosystem/core-config',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston',
      '@arkecosystem/core-forger',
    ],
    options: {
      '@arkecosystem/core-forger': {
        bip38: options.bip38 || process.env.ARK_FORGER_BIP38,
        address: options.address,
        password: options.password || process.env.ARK_FORGER_PASSWORD,
      },
    },
  })
}
