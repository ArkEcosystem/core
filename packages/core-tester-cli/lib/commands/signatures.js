'use strict'

const ark = require('arkjs')
const delay = require('delay')
const utils = require('../utils')
const logger = utils.logger
const transactionCommand = require('./transactions')

module.exports = async (options) => {
  const wallets = utils.generateWallets(options.number)
  await transactionCommand(options, wallets, 50, true)

  const transactions = []
  wallets.forEach((wallet, i) => {
    const transaction = ark.signature.createSignature(wallet.passphrase, wallet.passphrase, parseInt(options.fee))
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply signature transactions`)
    await delay(delaySeconds * 1000)

    wallets.forEach(async walletObject => {
      const wallet = await utils.getWallet(walletObject.address)

      if (wallet.secondPublicKey !== wallet.publicKey) {
        logger.error(`Invalid second signature for ${walletObject.address}.`)
      }
    })
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
  }
}
