'use strict'

const { Bignum, client, crypto } = require('@arkecosystem/crypto')
const delay = require('delay')
const unique = require('lodash/uniq')
const { logger } = require('../utils')
const Command = require('./command')

module.exports = class TransferCommand extends Command {
  /**
   * Run transfer command.
   * @param  {Object} options
   * @return {void}
   */
  async run (options) {
    this.options = {...this.options, ...options}

    const primaryAddress = crypto.getAddress(crypto.getKeys(this.config.passphrase).publicKey, this.config.network.version)

    let wallets = this.options.wallets
    if (wallets === undefined) {
      wallets = this.generateWallets()
    }

    logger.info(`Sending ${wallets.length} transfer transactions`)

    const walletBalance = await this.getWalletBalance(primaryAddress)

    if (!this.options.skipValidation) {
      logger.info(`Sender starting balance: ${walletBalance}`)
    }

    let totalDeductions = Bignum.ZERO
    let transactionAmount = new Bignum(this.options.amount || Command.__arkToArktoshi(2))

    const transactions = this.generateTransactions(transactionAmount, wallets, null, true)
    for (const transaction of transactions) {
      totalDeductions = totalDeductions.plus(transactionAmount).plus(transaction.fee)
    }

    if (this.options.copy) {
      this.copyToClipboard(transactions)
      return
    }

    const expectedSenderBalance = (new Bignum(walletBalance)).minus(totalDeductions)
    if (!this.options.skipValidation) {
      logger.info(`Sender expected ending balance: ${expectedSenderBalance}`)
    }

    const runOptions = {
      primaryAddress,
      transactions,
      wallets,
      transactionAmount,
      expectedSenderBalance,
      skipValidation: this.options.skipValidation
    }

    try {
      if (!this.options.floodAttempts) {
        const successfulTest = await this.__performRun(runOptions, 1)
        if (successfulTest && !this.options.skipSecondRun && !this.options.skipValidation && !this.options.skipTesting) {
          await this.__performRun(runOptions, 2, false, true)
        }
      } else {
        const attempts = this.options.floodAttempts
        for (let i = attempts; i > 0; i--) {
          await this.__performRun(runOptions, attempts - i + 1, i !== 1, i !== attempts)
        }
      }
    } catch (error) {
      const message = error.response ? error.response.data.message : error
      logger.error(`There was a problem sending transactions: ${message}`)
    }

    if (this.options.skipTesting) {
      return
    }

    await this.__testVendorField(wallets)
    await this.__testEmptyVendorField(wallets)
  }

  /**
   * Generate batch of transactions based on wallets.
   * @param  {Number}  transactionAmount
   * @param  {Object[]}  wallets
   * @param  {Object[]}  [approvalWallets=[]]
   * @param  {Boolean}  [overridePassphrase=false]
   * @param  {String}  [vendorField]
   * @param  {Boolean} [log=true]
   * @return {Object[]}
   */
  generateTransactions (
    transactionAmount,
    wallets,
    approvalWallets = [],
    overridePassphrase = false,
    vendorField,
    log = true) {
    vendorField = vendorField || this.options.smartBridge
    const transactions = []
    wallets.forEach((wallet, i) => {
      const builder = client.getBuilder().transfer()
      // noinspection JSCheckFunctionSignatures
      builder
        .fee(Command.parseFee(this.options.transferFee))
        .recipientId(this.options.recipient || wallet.address)
        .network(this.config.network.version)
        .amount(transactionAmount)
        .vendorField(vendorField === undefined ? `Transaction ${i + 1}` : vendorField)
        .sign(overridePassphrase ? this.config.passphrase : wallet.passphrase)

      if (wallet.secondPassphrase || this.config.secondPassphrase) {
        builder.secondSign(wallet.secondPassphrase || this.config.secondPassphrase)
      }

      if (approvalWallets) {
        for (let j = approvalWallets.length - 1; j >= 0; j--) {
          builder.multiSignatureSign(approvalWallets[j].passphrase)
        }
      }

      const transaction = builder.build()
      transactions.push(transaction)

      if (log) {
        logger.info(`${i} ==> ${transaction.id}, ${transaction.recipientId} (fee: ${transaction.fee})`)
      }
    })

    return transactions
  }

  /**
   * Perform a run of transactions.
   * @param  {Object}  runOptions
   * @param  {Number}  [runNumber=1]
   * @param  {Boolean}  [skipWait=false]
   * @param  {Boolean} [isSubsequentRun=false]
   * @return {Boolean}
   */
  async __performRun (runOptions, runNumber = 1, skipWait = false, isSubsequentRun = false) {
    if (skipWait) {
      runOptions.skipValidation = true
      this.__sendTransactionsWithResults(runOptions, isSubsequentRun)

      return
    }

    if (await this.__sendTransactionsWithResults(runOptions, isSubsequentRun)) {
      logger.info(`All transactions have been received and forged for run ${runNumber}!`)

      return true
    }

    logger.error(`Test failed on run ${runNumber}`)

    return false
  }

  /**
   * Send transactions and validate results.
   * @param  {Object} runOptions
   * @param  {Boolean} isSubsequentRun
   * @return {Boolean}
   */
  async __sendTransactionsWithResults (runOptions, isSubsequentRun) {
    let successfulTest = true

    let postResponse
    try {
      postResponse = await this.postTransactions(runOptions.transactions)
    } catch (error) {
      if (runOptions.skipValidation) {
        return true
      }

      const message = error.response ? error.response.data.error : error.message
      logger.error(`Transaction request failed: ${message}`)

      return false
    }

    if (runOptions.skipValidation) {
      return true
    }

    if (!isSubsequentRun && !postResponse.accept.length) {
      return false
    }

    if (!isSubsequentRun) {
      for (const transaction of runOptions.transactions) {
        if (!postResponse.accept.includes(transaction.id)) {
          logger.error(`Transaction '${transaction.id}' didn't get approved on the network`)

          successfulTest = false
        }
      }
    }

    for (const key of Object.keys(postResponse)) {
      if (key === 'success') {
        continue
      }

      const dataLength = postResponse[key].length
      const uniqueLength = unique(postResponse[key]).length
      if (dataLength !== uniqueLength) {
        logger.error(`Response data for '${key}' has ${dataLength - uniqueLength} duplicate transaction ids`)
        successfulTest = false
      }
    }

    const delaySeconds = await this.getTransactionDelaySeconds(runOptions.transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply transfer transactions`)
    await delay(delaySeconds * 1000)

    for (const transaction of runOptions.transactions) {
      const transactionResponse = await this.getTransaction(transaction.id)
      if (transactionResponse && transactionResponse.id !== transaction.id) {
        logger.error(`Transaction '${transaction.id}' didn't get applied on the network`)

        successfulTest = false
      }
    }

    if (runOptions.primaryAddress && runOptions.expectedSenderBalance) {
      const walletBalance = await this.getWalletBalance(runOptions.primaryAddress)
      if (!walletBalance.isEqualTo(runOptions.expectedSenderBalance)) {
        successfulTest = false
        logger.error(`Sender balance incorrect: '${walletBalance}' but should be '${runOptions.expectedSenderBalance}'`)
      }
    }

    for (const wallet of runOptions.wallets) {
      const balance = await this.getWalletBalance(wallet.address)
      if (!balance.isEqualTo(runOptions.transactionAmount)) {
        successfulTest = false
        logger.error(`Incorrect destination balance for ${wallet.address}. Should be '${runOptions.transactionAmount}' but is '${balance}'`)
      }
    }

    return successfulTest
  }

  /**
   * Test vendor field is set correctly on blockchain.
   * @param  {Object[]} wallets
   * @return {void}
   */
  async __testVendorField (wallets) {
    logger.info('Testing VendorField value is set correctly')

    const transactions = this.generateTransactions(2, wallets, null, null, 'Testing VendorField')

    try {
      await this.sendTransactions(transactions)

      for (const transaction of transactions) {
        const tx = await this.getTransaction(transaction.id)
        if (!tx) {
          logger.error(`Transaction '${transaction.id}' should be on the blockchain`)
        }
        if (tx.vendorField !== 'Testing VendorField') {
          logger.error(`Transaction '${transaction.id}' does not have correct vendorField value`)
        }
      }
    } catch (error) {
      this.__problemSendingTransactions(error)
    }
  }

  /**
   * Test empty vendor field is set correctly on blockchain.
   * @param  {Object[]} wallets
   * @return {void}
   */
  async __testEmptyVendorField (wallets) {
    logger.info('Testing empty VendorField value')

    const transactions = this.generateTransactions(2, wallets, null, null, null)

    try {
      await this.sendTransactions(transactions)

      for (const transaction of transactions) {
        const tx = await this.getTransaction(transaction.id)
        if (!tx) {
          logger.error(`Transaction '${transaction.id}' should be on the blockchain`)
        }
        if (tx.vendorField) {
          logger.error(`Transaction '${transaction.id}' should not have vendorField value '${tx.vendorField}'`)
        }
      }
    } catch (error) {
      this.__problemSendingTransactions(error)
    }
  }
}
