const blockchain = require('app/core/blockchainManager').getInstance()
const config = require('app/core/config')

exports.index = {
  handler: (request, h) => {
    return {
      data: config.getConstants(blockchain.status.lastBlock.data.height)
    }
  }
}
