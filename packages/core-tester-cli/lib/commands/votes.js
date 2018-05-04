'use strict'

const ark = require('arkjs')
const utils = require('../utils')
const logger = utils.logger
const transactionCommand = require('./transactions')

module.exports = async (options) => {
  const wallets = utils.generateWallet(options.number)
  await transactionCommand(options, wallets)

  logger.info('Waiting 30 seconds to apply transactions')
  utils.sleep(30000)

  const voters = await utils.getVoters(options.delegate)

  logger.info(`Delegate starting voters: ${voters.length}`)

  const transactions = []
  wallets.forEach((wallet, i) => {
    const transaction = ark.vote.createVote(wallet.passphrase, [`+${options.delegate}`])
    console.log(transaction)
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  logger.info(`Expected end voters: ${voters.length + wallets.length}`)

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

    const voters = await utils.getVoters(options.delegate)
    logger.info(`All transactions have been sent! Total voters: ${voters.length}`)
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.message}`)
  }
}
