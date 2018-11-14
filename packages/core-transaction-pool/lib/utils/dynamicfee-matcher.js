const container = require('@arkecosystem/core-container')
const { feeManager, dynamicFeeManager } = require('@arkecosystem/crypto')

/**
 * Determine if a transaction's fee meets the minimum requirements for broadcasting
 * and for entering the transaction pool.
 * @param {Transaction} Transaction - transaction to check
 * @return {Object} { broadcast: Boolean, enterPool: Boolean }
 */
module.exports = transaction => {
  const config = container.resolvePlugin('config')
  const logger = container.resolvePlugin('logger')

  const fee = +transaction.fee.toFixed()
  const id = transaction.id

  const blockchain = container.resolvePlugin('blockchain')
  const fees = config.getConstants(blockchain.getLastBlock().data.height).fees

  let broadcast
  let enterPool

  if (fees.dynamic) {
    const minWhatever1 = dynamicFeeManager.calculateFee(fees.dynamicFees.minWhatever1, transaction)
    if (fee >= minWhatever1) {
      broadcast = true
      logger.debug(`Transaction ${id} eligible for broadcast (fee=${fee} >= min=${minWhatever1})`)
    } else {
      broadcast = false
      logger.debug(`Transaction ${id} not eligible for broadcast (fee=${fee} < min=${minWhatever1})`)
    }

    const minWhatever2 = dynamicFeeManager.calculateFee(fees.dynamicFees.minWhatever2, transaction)
    if (fee >= minWhatever2) {
      enterPool = true
      logger.debug(`Transaction ${id} eligible to enter pool (fee=${fee} >= min=${minWhatever2})`)
    } else {
      enterPool = false
      logger.debug(`Transaction ${id} not eligible to enter pool (fee=${fee} < min=${minWhatever2})`)
    }
  } else {
    // Static fees
    const staticFee = feeManager.getForTransaction(transaction)

    if (fee === staticFee) {
      broadcast = true
      enterPool = true
      logger.debug(`Transaction ${id} eligible for broadcast and to enter pool (fee=${fee} = static=${staticFee})`)
    } else {
      broadcast = false
      enterPool = false
      logger.debug(`Transaction ${id} not eligible for broadcast and not eligible to enter pool (fee=${fee} != static=${staticFee})`)
    }
  }

  return { broadcast: broadcast, enterPool: enterPool }
}
