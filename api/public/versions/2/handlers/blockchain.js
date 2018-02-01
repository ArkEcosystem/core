const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')

exports.index = {
  handler: (request, h) => {
    return {
      data: config.getConstants(blockchain.status.lastBlock.data.height)
    }
  }
}
