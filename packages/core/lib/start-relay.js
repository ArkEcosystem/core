'use strict'

const container = require('@arkecosystem/core-container')

/**
 * Start a relay.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  await container.start({
    data: options.data,
    config: options.config
  }, {
    exclude: ['@arkecosystem/core-forger'],
    options: {
      '@arkecosystem/core-blockchain': {
        networkStart: options.networkStart
      }
    }
  })
}
