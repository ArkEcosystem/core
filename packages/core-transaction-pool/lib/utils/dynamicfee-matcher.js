const app = require('@arkecosystem/core-container')
const {
  feeManager,
  dynamicFeeManager,
  formatArktoshi,
} = require('@arkecosystem/crypto')
const pluralize = require('pluralize')
const peersMatchingFee = require('./peers-matching-fee')

/**
 * Determine if a transaction's fee meets the minimum requirements for broadcasting
 * and for entering the transaction pool.
 * @param {Transaction} Transaction - transaction to check
 * @return {Object} { broadcast: Boolean, enterPool: Boolean }
 */
module.exports = transaction => {
  const config = app.resolvePlugin('config')
  const logger = app.resolvePlugin('logger')

  const fee = +transaction.fee.toFixed()
  const id = transaction.id

  const blockchain = app.resolvePlugin('blockchain')
  const fees = config.getConstants(blockchain.getLastBlock().data.height).fees

  let broadcast
  let enterPool

  if (fees.dynamic) {
    const matchingPeers = peersMatchingFee(transaction)

    if (matchingPeers.length) {
      broadcast = true
      logger.debug(
        `Transaction ${id} eligible for broadcast - ${pluralize(
          'peer',
          matchingPeers.length,
          true,
        )} accept fee of ${formatArktoshi(fee)}`,
      )
    } else {
      broadcast = false
      logger.debug(
        `Transaction ${id} not eligible for broadcast - no peers match fee of ${formatArktoshi(
          fee,
        )}`,
      )
    }

    const minFeePool = dynamicFeeManager.calculateFee(
      fees.dynamicFees.minFeePool,
      transaction,
    )
    if (fee >= minFeePool) {
      enterPool = true
      logger.debug(
        `Transaction ${id} eligible to enter pool - fee of ${formatArktoshi(
          fee,
        )} is ${
          fee === minFeePool ? 'equal to' : 'greater than'
        } minimum fee (${formatArktoshi(minFeePool)})`,
      )
    } else {
      enterPool = false
      logger.debug(
        `Transaction ${id} not eligible to enter pool - fee of ${formatArktoshi(
          fee,
        )} is smaller than minimum fee (${formatArktoshi(minFeePool)})`,
      )
    }
  } else {
    // Static fees
    const staticFee = feeManager.getForTransaction(transaction)

    if (fee === staticFee) {
      broadcast = true
      enterPool = true
      logger.debug(
        `Transaction ${id} eligible for broadcast and to enter pool - fee of ${formatArktoshi(
          fee,
        )} is equal to static fee (${formatArktoshi(staticFee)})`,
      )
    } else {
      broadcast = false
      enterPool = false
      logger.debug(
        `Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${formatArktoshi(
          fee,
        )} does not match static fee (${formatArktoshi(staticFee)})`,
      )
    }
  }

  return { broadcast, enterPool }
}
