'use strict'

const { client } = require('@arkecosystem/crypto')
const delay = require('delay')
const utils = require('../utils')
const config = require('../config')
const logger = utils.logger
const superheroes = require('superheroes')
const transferCommand = require('./transfer')

module.exports = async (options) => {
  utils.applyConfigOptions(options)

  const wallets = utils.generateWallets(options.number)
  await transferCommand(options, wallets, 50, true)

  const delegates = await utils.getDelegates()

  logger.info(`Sending ${options.number} delegate registration transactions`)
  if (!options.skipValidation) {
    logger.info(`Starting delegate count: ${delegates.length}`)
  }

  const builder = client.getBuilder().delegateRegistration()
  const transactions = []
  const usedDelegateNames = delegates.map(delegate => delegate.username)
  wallets.forEach((wallet, i) => {
    wallet.username = superheroes.random()

    while (usedDelegateNames.includes(wallet.username)) {
      wallet.username = superheroes.random()
    }

    wallet.username = wallet.username.toLowerCase().replace(/ /g, '_')
    usedDelegateNames.push(wallet.username)

    const transaction = builder
      .fee(utils.parseFee(options.delegateFee))
      .usernameAsset(wallet.username)
      .sign(wallet.passphrase)
      .secondSign(config.secondPassphrase)
      .build()

    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (fee: ${transaction.fee}, username: ${wallet.username})`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  const expectedDelegates = delegates.length + wallets.length
  if (!options.skipValidation) {
    logger.info(`Expected end delegate count: ${expectedDelegates}`)
  }

  try {
    await utils.postTransactions(transactions)

    if (options.skipValidation) {
      return
    }

    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply delegate transactions`)
    await delay(delaySeconds * 1000)

    const delegates = await utils.getDelegates()
    logger.info(`All transactions have been sent! Total delegates: ${delegates.length}`)

    if (delegates.length !== expectedDelegates) {
      logger.error(`Delegate count incorrect. '${delegates.length}' but should be '${expectedDelegates}'`)
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response ? error.response.data.message : error}`)
  }
}
