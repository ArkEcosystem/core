const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

const fee = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', {
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.secondsignature
    })
    .then(() => next())
}

module.exports = {
  fee,
}
