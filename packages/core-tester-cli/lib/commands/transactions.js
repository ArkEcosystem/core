'use strict'

const ark = require('arkjs')
const config = require('../config')
const delay = require('delay')
const utils = require('../utils')
const logger = utils.logger

module.exports = async (options, wallets) => {
  if (wallets === undefined) {
    wallets = utils.generateWallet(options.number)
  }
  const address = ark.crypto.getAddress(ark.crypto.getKeys(config.passphrase).publicKey)
  const walletBalance = await utils.getWalletBalance(address)

  logger.info(`Sender starting balance: ${walletBalance}`)

  const transactions = []
  let totalDeductions = 0
  const transactionAmount = 2 * Math.pow(10, 8)
  wallets.forEach((wallet, i) => {
    const transaction = ark.transaction.createTransaction(wallet.address, transactionAmount, `TID: ${i}`, config.passphrase)
    transactions.push(transaction)
    totalDeductions += transactionAmount + transaction.fee

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  const expectedSenderBalance = walletBalance - totalDeductions
  logger.info(`Sender expected ending balance: ${expectedSenderBalance}`)

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

    logger.info('Waiting 30 seconds to apply transfer transactions')
    await delay(30000)

    const walletBalance = await utils.getWalletBalance(address)
    logger.info('All transactions have been sent!')

    if (walletBalance !== expectedSenderBalance) {
      logger.error(`Sender balance incorrect: '${walletBalance}' but should be '${expectedSenderBalance}'`)
    }

    wallets.forEach(async wallet => {
      const balance = await utils.getWalletBalance(wallet.address)

      if (balance !== transactionAmount) {
        logger.error(`Incorrect destination balance for ${wallet.address}. Should be '${transactionAmount}' but is '${balance}'`)
      }
    })
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.message}`)
  }
}
