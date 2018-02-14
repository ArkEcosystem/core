const blockchain = require('app/core/managers/blockchain').getInstance()
const config = require('app/core/config')

exports.index = {
  handler: (request, h) => {
    return {
      data: config.getConstants(blockchain.getState().lastBlock.data.height)
    }
  }
}
