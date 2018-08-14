'use strict'

const ark = require('arkjs')
const config = require('../config')
const delay = require('delay')
const unique = require('lodash/uniq')
const utils = require('../utils')
const logger = utils.logger

const primaryAddress = ark.crypto.getAddress(ark.crypto.getKeys(config.passphrase).publicKey)
const sendTransactionsWithResults = async (transactions, wallets, transactionAmount, expectedSenderBalance, options, isSubsequentRun) => {
  let successfulTest = true

  let postResponse
  try {
    postResponse = await utils.postTransactions(transactions)
  } catch (error) {
    if (options.skipValidation) {
      return true
    }

    const message = error.response ? error.response.data.error : error.message
    logger.error(`Transaction request failed. Error: ${message}`)
    return false
  }

  if (options.skipValidation) {
    return true
  }

  if (!isSubsequentRun && !postResponse.data.accept.length) {
    return false
  }

  if (!isSubsequentRun) {
    for (const transaction of transactions) {
      if (!postResponse.data.accept.includes(transaction.id)) {
        logger.error(`Transaction '${transaction.id}' didn't get approved on the network`)

        successfulTest = false
      }
    }
  }

  for (const key of Object.keys(postResponse.data)) {
    if (key === 'success') {
      continue
    }

    const dataLength = postResponse.data[key].length
    const uniqueLength = unique(postResponse.data[key]).length
    if (dataLength !== uniqueLength) {
      logger.error(`Response data for '${key}' has ${dataLength - uniqueLength} duplicate transaction ids`)
      successfulTest = false
    }
  }

  const delaySeconds = await utils.getTransactionDelay(transactions)
  logger.info(`Waiting ${delaySeconds} seconds for node to process and forge transfer transactions`)
  await delay(delaySeconds * 1000)

  for (const transaction of transactions) {
    const transactionResponse = await utils.getTransaction(transaction.id)
    if (transactionResponse && transactionResponse.id !== transaction.id) {
      logger.error(`Transaction '${transaction.id}' didn't get applied on the network`)

      successfulTest = false
    }
  }

  const walletBalance = await utils.getWalletBalance(primaryAddress)
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

  if (!arkPerTransaction && options.amount) {
    transactionAmount = options.amount
  }

  for (const id in wallets) {
    const wallet = wallets[id]
    const transaction = ark.transaction.createTransaction(
      options.recipient || wallet.address,
      transactionAmount,
      `TID: ${id}`,
      config.passphrase,
      wallet.secondPassphrase || config.secondPassphrase,
      config.publicKeyHash,
      utils.parseFee(options.transferFee)
    )
    transactions.push(transaction)
    totalDeductions += transactionAmount + transaction.fee

    logger.info(`${id} ==> ${transaction.id}, ${options.recipient || wallet.address} (fee: ${transaction.fee})`)
  }

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  const expectedSenderBalance = walletBalance - totalDeductions
  if (!options.skipValidation) {
    logger.info(`Sender expected ending balance: ${expectedSenderBalance}`)
  }

  const performRun = async (run, skipWait, isSubsequentRun) => {
    if (skipWait) {
      sendTransactionsWithResults(
        transactions,
        wallets,
        transactionAmount,
        expectedSenderBalance,
        Object.assign({skipValidation: true}, options),
        isSubsequentRun
      )

      return
    }

    let successfulTest = await sendTransactionsWithResults(
      transactions,
      wallets,
      transactionAmount,
      expectedSenderBalance,
      options,
      isSubsequentRun
    )

    if (!successfulTest) {
      logger.error(`Test failed on run ${run}`)
    } else {
      logger.info(`All transactions have been received and forged for run ${run}!`)
    }
  }

  try {
    if (!options.floodAttempts) {
      const successfulTest = await performRun(1)

      if (successfulTest && !options.skipSecondRun && !options.skipValidation && !skipTestingAgain) {
        await performRun(2, true, true)
      }
    } else {
      let i = 0
      for (; i < options.floodAttempts; i++) {
        performRun(i + 1, true, (i > 0))
      }

      await performRun(i + 1, false, (i > 0))
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response ? error.response.data.message : error}`)
  }
}
