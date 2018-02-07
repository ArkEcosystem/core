const blockchain = require('app/core/blockchainManager').getInstance()
const config = require('app/core/config')

exports.calculateApproval = (delegate) => {
  const lastBlock = blockchain.state.lastBlock.data
  const constants = config.getConstants(lastBlock.height)
  const totalSupply = config.genesisBlock.totalAmount + (lastBlock.height - constants.height) * constants.reward

  return ((delegate.balance / totalSupply) * 100).toFixed(2)
}

exports.calculateProductivity = (delegate) => {
  return (100 - (delegate.missedBlocks / ((delegate.producedBlocks + delegate.missedBlocks) / 100))).toFixed(2)
}
