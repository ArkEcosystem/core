const blockchain = require('../../../../../core/managers/blockchain').getInstance()
const config = require('../../../../../core/config')

exports.index = {
  handler: (request, h) => {
    return {
      data: config.getConstants(blockchain.getState().lastBlock.data.height)
    }
  }
}
