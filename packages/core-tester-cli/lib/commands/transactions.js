'use strict'

const ark = require('arkjs')
const delay = require('delay')
const config = require('../config')
const utils = require('../utils')
const logger = utils.logger

const primaryAddress = ark.crypto.getAddress(ark.crypto.getKeys(config.passphrase).publicKey)
const sendTransactionsWithResults = async (transactions, wallets, transactionAmount, expectedSenderBalance) => {
  let successfulTest = true

  const postResponse = await utils.request.post('/peer/transactions', {transactions}, true)
  if (!postResponse.data.success) {
    logger.error('Transaction request failed')

    return false
  }
  for (const transaction of transactions) {
    if (!postResponse.data.transactionIds.find(transactionId => (transaction.id === transactionId))) {
      logger.error(`Transaction '${transaction.id}' didn't get applied on the network`)
    }
  }
  if (!postResponse.data.transactionIds.length) {
    return false
  }

  const delaySeconds = await utils.getTransactionDelay(transactions)
  logger.info(`Waiting ${delaySeconds} seconds for node to process and forge transfer transactions`)
  await delay(delaySeconds * 1000)

  const walletBalance = await utils.getWalletBalance(primaryAddress)
  logger.info('All transactions have been received and forged!')

  if (walletBalance !== expectedSenderBalance) {
    successfulTest = false
    logger.error(`Sender balance incorrect: '${walletBalance}' but should be '${expectedSenderBalance}'`)
  }

  wallets.forEach(async wallet => {
    const balance = await utils.getWalletBalance(wallet.address)

    if (balance !== transactionAmount) {
      successfulTest = false
      logger.error(`Incorrect destination balance for ${wallet.address}. Should be '${transactionAmount}' but is '${balance}'`)
    }
  })

  return successfulTest
}

module.exports = async (options, wallets, arkPerTransaction, skipTestingAgain) => {
  if (wallets === undefined) {
    wallets = utils.generateWallets(options.number)
  }
  const walletBalance = await utils.getWalletBalance(primaryAddress)

  logger.info(`Sender starting balance: ${walletBalance}`)

  const transactions = []
  let totalDeductions = 0
  const transactionAmount = (arkPerTransaction || 2) * Math.pow(10, 8)
  wallets.forEach((wallet, i) => {
    const transaction = ark.transaction.createTransaction(
      wallet.address,
      transactionAmount,
      `TID: ${i}`,
      config.passphrase,
      config.secondPassPhrase,
      config.publicKeyHash,
      parseInt(options.transferFee)
    )
    transactions.push(transaction)
    totalDeductions += transactionAmount + transaction.fee

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  const expectedSenderBalance = walletBalance - totalDeductions
  logger.info(`Sender expected ending balance: ${expectedSenderBalance}`)

  try {
    let successfulTest = await sendTransactionsWithResults(transactions, wallets, transactionAmount, expectedSenderBalance)

    if (!successfulTest) {
      logger.error('Test failed on first run')
    }

    if (successfulTest && !skipTestingAgain) {
      successfulTest = await sendTransactionsWithResults(transactions, wallets, transactionAmount, expectedSenderBalance)

      if (!successfulTest) {
        logger.error('Test failed on second run')
      }
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response ? error.response.data.message : error}`)
  }
}
