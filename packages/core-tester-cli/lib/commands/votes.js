'use strict'

const ark = require('arkjs')
const delay = require('delay')
const utils = require('../utils')
const logger = utils.logger
const transactionCommand = require('./transactions')

module.exports = async (options) => {
  const wallets = utils.generateWallets(options.number)
  await transactionCommand(options, wallets, 2, true)

  const voters = await utils.getVoters(options.delegate)

  logger.info(`Delegate starting voters: ${voters.length}`)

  const transactions = []
  wallets.forEach((wallet, i) => {
    const transaction = ark.vote.createVote(wallet.passphrase, [`+${options.delegate}`])
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
  }

  const expectedVoters = voters.length + wallets.length
  logger.info(`Expected end voters: ${expectedVoters}`)

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply vote transactions`)
    await delay(delaySeconds * 1000)

    const voters = await utils.getVoters(options.delegate)
    logger.info(`All transactions have been sent! Total voters: ${voters.length}`)

    if (voters.length !== expectedVoters) {
      logger.error(`Delegate voter count incorrect. '${voters.length}' but should be '${expectedVoters}'`)
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
  }
}
