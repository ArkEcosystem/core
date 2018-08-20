const container = require('@arkecosystem/core-container')
const { feeManager, dynamicFeeManager } = require('@arkecosystem/crypto')
const config = container.resolvePlugin('config')

/**
 * Determine if transaction matches the accepted fee by delegate or max fee set by sender
 * @param {Transaction} Transaction - transaction to check
 * @return {Boolean} matches T/F
 */
module.exports = (transaction) => {
  const blockchain = container.resolvePlugin('blockchain')
  const feeConstants = config.getConstants(blockchain.getLastBlock().data.height).fees
  if (!feeConstants.dynamic && transaction.fee !== feeManager.get(transaction.type)) {
    // logger.debug(`Received transaction fee '${transaction.fee}' for '${transaction.id}' does not match static fee of '${feeManager.get(transaction.type)}'`)
    return false
  }

  if (feeConstants.dynamic) {
    const dynamicFee = dynamicFeeManager.calculateFee(config.delegates.dynamicFees.feeMultiplier, transaction)

    if (transaction.fee < config.delegates.dynamicFees.minAcceptableFee) {
      // logger.debug(`Fee not accepted - transaction fee of '${transaction.fee}' for '${transaction.id}' is below delegate minimum fee of '${config.delegates.dynamicFees.minAcceptableFee}'`)
      return false
    }

    if (dynamicFee > transaction.fee) {
      // logger.debug(`Fee not accepted - calculated delegate fee of '${dynamicFee}' is above maximum transcation fee of '${transaction.fee}' for '${transaction.id}'`)
      return false
    }

    if (transaction.fee > feeManager.get(transaction.type)) {
      // logger.debug(`Fee not accepted - transaction fee of '${transaction.fee}' for '${transaction.id}' is above static fee of '${feeManager.get(transaction.type)}'`)
      return false
    }
    // logger.debug(`Transaction accepted with fee of '${transaction.fee}' for '${transaction.id}' - calculated fee for transaction is '${dynamicFee}'`)
  }
  return true
}
