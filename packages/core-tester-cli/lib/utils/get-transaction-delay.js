const config = require('../config')
const getConstants = require('./get-constants')

module.exports = async (transactions) => {
  const constants = await getConstants()
  const waitPerBlock = (Math.round(constants.blocktime / 10) * 10)

  return Math.max(config.transactionWaitDelay, waitPerBlock * (transactions.length / constants.block.maxTransactions))
}
