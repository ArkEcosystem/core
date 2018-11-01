'use strict'

const blockIndex = require('./index/block')
const transactionIndex = require('./index/transaction')
const walletIndex = require('./index/wallet')
const roundIndex = require('./index/round')
const client = require('./services/client')
const storage = require('./services/storage')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'arkx:elastic',
  async register (container, options) {
    const logger = container.resolvePlugin('logger')

    logger.info('[Elasticsearch] Initialising History :hourglass:')
    storage.ensure('history')

    logger.info('[Elasticsearch] Initialising Client :joystick:')
    await client.setUp(options.client)

    blockIndex.setUp(options.chunkSize)
    transactionIndex.setUp(options.chunkSize)
    walletIndex.setUp(options.chunkSize)
    roundIndex.setUp(options.chunkSize)

    return require('./server')(options.server)
  },
  async deregister (container, options) {
    container.resolvePlugin('logger').info('[Elasticsearch] Stopping API :warning:')

    return container.resolvePlugin('arkx:elastic').stop()
  }
}
