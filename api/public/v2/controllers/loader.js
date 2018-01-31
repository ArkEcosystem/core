const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

const status = (req, res, next) => {
  const lastBlock = blockchain.status.lastBlock

  blockchain.networkInterface.getNetworkHeight().then((networkHeight) => {
    utils
      .respondWith(req, res, 'ok', {
        loaded: blockchain.isSynced(lastBlock),
        now: lastBlock ? lastBlock.data.height : 0,
        blocksCount: networkHeight - lastBlock.data.height
      })
      .then(() => next())
  })
}

const syncing = (req, res, next) => {
  const lastBlock = blockchain.status.lastBlock

  blockchain.networkInterface.getNetworkHeight().then((networkHeight) => {
    utils
      .respondWith(req, res, 'ok', {
        syncing: !blockchain.isSynced(lastBlock),
        blocks: networkHeight - lastBlock.data.height,
        height: lastBlock.data.height,
        id: lastBlock.data.id
      })
      .then(() => next())
  })
}

const configuration = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', {
      nethash: config.network.nethash,
      token: config.network.client.token,
      symbol: config.network.client.symbol,
      explorer: config.network.client.explorer,
      version: config.network.pubKeyHash
    })
    .then(() => next())
}

module.exports = {
  status,
  syncing,
  configuration,
}
