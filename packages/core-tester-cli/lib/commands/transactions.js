'use strict'

const ark = require('arkjs')
const config = require('../config')
const utils = require('../utils')
const logger = utils.logger

module.exports = async (options) => {
  const transactions = []
  let totalDeductions = 0

  const address = ark.crypto.getAddress(ark.crypto.getKeys(config.passphrase).publicKey)
  const walletBalance = await utils.getWalletBalance(address)

  logger.info(`Wallet starting balance: ${walletBalance}`)

  for (let i = 0; i < options.number; i++) {
    const wallet = utils.generateWallet()
    const amount = 1 * Math.pow(10, 8)
    const transaction = ark.transaction.createTransaction(wallet.address, amount, `TID: ${i}`, config.passphrase)

    totalDeductions += amount + transaction.fee

    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  }

  logger.info(`Wallet expected ending balance: ${walletBalance - totalDeductions}`)

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

    const walletBalance = await utils.getWalletBalance(address)
    logger.info(`All transactions have been sent! Wallet ending balance: ${walletBalance}`)
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.message}`)
  }
}
