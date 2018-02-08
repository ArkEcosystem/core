const blockchain = require('app/core/blockchainManager').getInstance()
const state = blockchain.getState()
const config = require('app/core/config')

exports.index = {
  handler: (request, h) => {
    return {
      data: config.getConstants(state.lastBlock.data.height)
    }
  }
}
