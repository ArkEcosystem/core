'use strict'

const { client } = require('@arkecosystem/crypto')
const delay = require('delay')
const sample = require('lodash/sample')
const utils = require('../utils')
const config = require('../config')
const logger = utils.logger
const transferCommand = require('./transfer')

module.exports = async (options) => {
  utils.applyConfigOptions(options)

  const wallets = utils.generateWallets(options.quantity)
  await transferCommand(options, wallets, 2, true)

  if (!options.delegate) {
    const delegates = await utils.getDelegates()
    if (!delegates.length) {
      logger.error('Could not find any delegates to vote for')
      process.exit(1)
    }

    options.delegate = sample(delegates).publicKey
  }
  let voters = await utils.getVoters(options.delegate)

  logger.info(`Sending ${options.quantity} vote transactions`)

  const builder = client.getBuilder().vote()
  const transactions = []
  wallets.forEach((wallet, i) => {
    const transaction = builder
      .fee(utils.parseFee(options.voteFee))
      .votesAsset([`+${options.delegate}`])
      .sign(wallet.passphrase)
      .secondSign(config.secondPassphrase)
      .build()

    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (fee: ${transaction.fee})`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  const expectedVoters = voters.length + wallets.length
  if (!options.skipValidation) {
    logger.info(`Expected end voters: ${expectedVoters}`)
  }
  try {
    await utils.postTransactions(transactions)

    if (options.skipValidation) {
      return
    }

    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply vote transactions`)
    await delay(delaySeconds * 1000)

    let voters = 0
    voters += (await utils.getVoters(options.delegate)).length

    logger.info(`All transactions have been sent! Total voters: ${voters}`)

    if (voters !== expectedVoters) {
      logger.error(`Delegate voter count incorrect. '${voters}' but should be '${expectedVoters}'`)
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response ? error.response.data.message : error}`)
  }
}
