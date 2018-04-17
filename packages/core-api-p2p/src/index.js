const logger = require('@arkecosystem/core-pluggy').get('logger')
const P2PInterface = require('./p2pinterface')

exports.plugin = {
  pkg: require('../package.json'),
  register: async (hook, config, app) => {
    logger.info('Initialising P2P Interface...')

    const p2p = new P2PInterface(config, app.config)
    await p2p.warmup()

    await app.blockchainManager.attachNetworkInterface(p2p)
  }
}
