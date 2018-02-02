const blockchain = require('core/blockchainManager').getInstance()
const config = require('core/config')

exports.index = {
  handler: (request, h) => {
    return {
      data: config.getConstants(blockchain.status.lastBlock.data.height)
    }
  }
}
