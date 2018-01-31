const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

const index = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', config.getConstants(blockchain.status.lastBlock.data.height))
    .then(() => next())
}

module.exports = {
  index
}
