const container = require('@arkecosystem/core-container')
const { feeManager, dynamicFeeManager } = require('@arkecosystem/crypto')
const config = container.resolvePlugin('config')

/**
 * Determine any transactions that do not match the accepted fee by delegate or max fee set by sender
 * A new array is return with transactions matching fee conditions
 * @param {Transactions[]} transactions - incooming payload of transactions to verify
 * @return {Object} transactions - array of transactions matching the fee confitions of a delegate, and array of transactions not matching
 */
 module.exports = (transactions) => {
    const blockchain = container.resolvePlugin('blockchain')
    // reject if not ready
    if (!blockchain) {
      return {
        'feesMatching': [],
        'invalidFees': [...transactions]
      }
    }
    const feeConstants = config.getConstants(blockchain.getLastBlock().data.height).fees
    let invalidFees = []
    const acceptedTransactions = transactions.filter(transaction => {
      if (!feeConstants.dynamic && transaction.fee !== feeManager.get(transaction.type)) {
        // logger.debug(`Received transaction fee '${transaction.fee}' for '${transaction.id}' does not match static fee of '${feeManager.get(transaction.type)}'`)
        invalidFees.push(transaction)
        return false
      }

      if (feeConstants.dynamic) {
        const dynamicFee = dynamicFeeManager.calculateFee(config.delegates.dynamicFees.feeMultiplier, transaction)

        if (transaction.fee < config.delegates.dynamicFees.minAcceptableFee) {
          // logger.debug(`Fee not accepted - transaction fee of '${transaction.fee}' for '${transaction.id}' is below delegate minimum fee of '${config.delegates.dynamicFees.minAcceptableFee}'`)

          invalidFees.push(transaction)
          return false
        }

        if (dynamicFee > transaction.fee) {
          // logger.debug(`Fee not accepted - calculated delegate fee of '${dynamicFee}' is above maximum transcation fee of '${transaction.fee}' for '${transaction.id}'`)

          invalidFees.push(transaction)
          return false
        }

        if (transaction.fee > feeManager.get(transaction.type)) {
          // logger.debug(`Fee not accepted - transaction fee of '${transaction.fee}' for '${transaction.id}' is above static fee of '${feeManager.get(transaction.type)}'`)

          invalidFees.push(transaction)
          return false
        }
        // logger.debug(`Transaction accepted with fee of '${transaction.fee}' for '${transaction.id}' - calculated fee for transaction is '${dynamicFee}'`)
      }
      return true
    })

    return {
      'feesMatching': acceptedTransactions,
      'invalidFees': invalidFees
    }
  }
