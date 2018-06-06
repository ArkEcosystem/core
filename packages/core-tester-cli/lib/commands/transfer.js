'use strict'

const ark = require('arkjs')
const config = require('../config')
const delay = require('delay')
const utils = require('../utils')
const logger = utils.logger

const primaryAddress = ark.crypto.getAddress(ark.crypto.getKeys(config.passphrase).publicKey)
const sendTransactionsWithResults = async (transactions, wallets, transactionAmount, expectedSenderBalance, options) => {
  let successfulTest = true

  const postResponse = await utils.request.post('/peer/transactions', {transactions}, true)

  if (options.skipValidation) {
    return true
  }

  if (!postResponse.data.success) {
    logger.error(`Transaction request failed. Error: ${postResponse.data.error}`)

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
  utils.applyConfigOptions(options)

  if (wallets === undefined) {
    wallets = utils.generateWallets(options.number)
  }
  const walletBalance = await utils.getWalletBalance(primaryAddress)

  logger.info(`Sending ${options.number} transfer transactions`)
  if (!options.skipValidation) {
    logger.info(`Sender starting balance: ${walletBalance}`)
  }

  const transactions = []
  let totalDeductions = 0
  let transactionAmount = (arkPerTransaction || 2) * Math.pow(10, 8)
  if (options.amount) transactionAmount = options.amount

  wallets.forEach((wallet, i) => {
    const transaction = ark.transaction.createTransaction(
      options.recipient || wallet.address,
      transactionAmount,
      `TID: ${i}`,
      config.passphrase,
      wallet.secondPassphrase || config.secondPassphrase,
      config.publicKeyHash,
      utils.parseFee(options.transferFee)
    )
    transactions.push(transaction)
    totalDeductions += transactionAmount + transaction.fee

    logger.info(`${i} ==> ${transaction.id}, ${options.recipient || wallet.address} (fee: ${transaction.fee})`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  const expectedSenderBalance = walletBalance - totalDeductions
  if (!options.skipValidation) {
    logger.info(`Sender expected ending balance: ${expectedSenderBalance}`)
  }

  try {
    let successfulTest = await sendTransactionsWithResults(
      transactions,
      wallets,
      transactionAmount,
      expectedSenderBalance,
      options
    )

    if (!successfulTest) {
      logger.error('Test failed on first run')
    }

    if (successfulTest && !options.skipValidation && !skipTestingAgain) {
      successfulTest = await sendTransactionsWithResults(
        transactions,
        wallets,
        transactionAmount,
        expectedSenderBalance,
        options
      )

      if (!successfulTest) {
        logger.error('Test failed on second run')
      }
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response ? error.response.data.message : error}`)
  }
}
