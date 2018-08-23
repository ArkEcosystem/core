const container = require('@arkecosystem/core-container')
const { feeManager, dynamicFeeManager } = require('@arkecosystem/crypto')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')

/**
 * Determine if transaction matches the accepted fee by delegate or max fee set by sender
 * @param {Transaction} Transaction - transaction to check
 * @return {Boolean} matches T/F
 */
module.exports = (transaction) => {
  const staticFee = feeManager.getForTransaction(transaction)
  const blockchain = container.resolvePlugin('blockchain')
  const feeConstants = config.getConstants(blockchain.getLastBlock().data.height).fees

  if (!feeConstants.dynamic && transaction.fee !== staticFee) {
    logger.debug(`Received transaction fee '${transaction.fee}' for '${transaction.id}' does not match static fee of '${staticFee}'`)
    return false
  }

  if (feeConstants.dynamic) {
    const calculatedFee = dynamicFeeManager.calculateFee(config.delegates.dynamicFees.feeMultiplier, transaction)

    if (transaction.fee < config.delegates.dynamicFees.minAcceptableFee) {
      logger.debug(`Fee not accepted - Received transaction "${transaction.id}" with a fee of "${transaction.fee}" which is below the minimum accepted fee of "${config.delegates.dynamicFees.minAcceptableFee}" by this delegate.`)
      return false
    }

    if (calculatedFee > transaction.fee) {
      logger.debug(`Fee not accepted - Received transaction "${transaction.id}" with a fee of "${transaction.fee}" which is below the minimum accepted of "${calculatedFee}" by the network.`)
      return false
    }

    if (transaction.fee > staticFee) {
      logger.debug(`Fee not accepted - Received transaction "${transaction.id}" with a fee of "${transaction.fee}" which is higher than the static fee of "${feeManager.get(transaction.type)}".`)
      return false
    }

    logger.debug(`Transaction accepted with fee of '${transaction.fee}' for '${transaction.id}' - calculated fee for transaction is '${calculatedFee}'`)
  }
  return true
}
