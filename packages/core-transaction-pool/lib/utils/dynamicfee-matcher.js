const container = require('@arkecosystem/core-container')
const { feeManager, dynamicFeeManager, formatArktoshi } = require('@arkecosystem/crypto')

const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')

/**
 * Determine if transaction matches the accepted fee by delegate or max fee set by sender
 * @param {Transaction} Transaction - transaction to check
 * @return {Boolean} matches T/F
 */
module.exports = transaction => {
  const transactionFee = +transaction.fee.toFixed()
  const staticFee = feeManager.getForTransaction(transaction)
  const blockchain = container.resolvePlugin('blockchain')
  const feeConstants = config.getConstants(
    blockchain.getLastBlock().data.height,
  ).fees

  if (!feeConstants.dynamic && transactionFee !== staticFee) {
    logger.debug(
      `Fee declined - Received transaction (${
        transaction.id
      }) with a fee of ${
        formatArktoshi(transactionFee)
      } does not match static fee of ${
        formatArktoshi(staticFee)
      }`,
    )
    return false
  }

  if (feeConstants.dynamic) {
    const minFeeFixed = config.delegates.dynamicFees.minAcceptableFee
    if (transactionFee < minFeeFixed) {
      logger.debug(
        `Fee declined - Received transaction (${
          transaction.id
        }) with a fee of ${
          formatArktoshi(transactionFee)
        } which is below the minimum accepted fixed fee of ${
          formatArktoshi(minFeeFixed)
        }`,
      )
      return false
    }

    const minFeeCalculated = dynamicFeeManager.calculateFee(
      config.delegates.dynamicFees.feeMultiplier,
      transaction,
    )

    if (transactionFee < minFeeCalculated) {
      logger.debug(
        `Fee declined - Received transaction (${
          transaction.id
        }) with a fee of ${
          formatArktoshi(transactionFee)
        } which is below the calculated minimum fee of ${
          formatArktoshi(minFeeCalculated)
        }`,
      )
      return false
    }

    logger.debug(
      `Fee accepted - Received transaction (${
        transaction.id
      }) with a fee of ${
        formatArktoshi(transactionFee)
      } which is ${
        transactionFee > minFeeCalculated ? 'higher than' : 'equal to'
      } the calculated minimum fee of ${
        formatArktoshi(minFeeCalculated)
      }`,
    )
  }
  return true
}
