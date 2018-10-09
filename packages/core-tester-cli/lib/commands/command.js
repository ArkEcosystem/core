'use strict'

const { Bignum, crypto } = require('@arkecosystem/crypto')
const bip39 = require('bip39')
const clipboardy = require('clipboardy')
const delay = require('delay')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const { logger, paginate, request } = require('../utils')

module.exports = class Command {
  /**
   * Init new instance of command.
   * @param  {Object} options
   * @return {*}
   */
  static async init (options) {
    const command = new this()
    command.options = options
    command.__applyConfig()
    await command.__loadConstants()
    await command.__loadNetworkConfig()

    return command
  }

  /**
   * Run command.
   * @param  {Object} options Used to pass options to TransferCommand
   * @throws Method [run] not implemented!
   */
  run (options) {
    throw new Error('Method [run] not implemented!')
  }

  /**
   * Copy transactions to clipboard.
   * @param  {Object[]} transactions
   * @return {void}
   */
  copyToClipboard (transactions) {
    for (const transaction of transactions) {
      transaction.serialized = transaction.serialized.toString('hex')
    }

    clipboardy.writeSync(JSON.stringify(transactions))
    logger.info(`Copied ${transactions.length} transactions`)
  }

  /**
   * Generate wallets based on quantity.
   * @param  {Number} [quantity]
   * @return {Object[]}
   */
  generateWallets (quantity) {
    if (!quantity) {
      quantity = this.options.number
    }

    let wallets = []
    for (let i = 0; i < quantity; i++) {
      const passphrase = bip39.generateMnemonic()
      const keys = crypto.getKeys(passphrase)
      const address = crypto.getAddress(keys.publicKey, this.config.network.version)

      wallets.push({ address, keys, passphrase })
    }

    const testWalletsPath = path.resolve(__dirname, '../../test-wallets')
    fs.appendFileSync(testWalletsPath, `${new Date().toLocaleDateString()} ${'-'.repeat(70)}\n`)
    for (const wallet of wallets) {
      fs.appendFileSync(testWalletsPath, `${wallet.address}: ${wallet.passphrase}\n`)
    }

    return wallets
  }

  /**
   * Get delegate API response.
   * @return {Object[]}
   * @throws 'Could not get delegates'
   */
  async getDelegates () {
    try {
      const delegates = await paginate(this.config, '/api/v2/delegates')

      return delegates
    } catch (error) {
      const message = error.response ? error.response.data.message : error.message
      throw new Error(`Could not get delegates: ${message}`)
    }
  }

  /**
   * Determine how long to wait for transactions to process.
   * @param  {Object[]} transactions
   * @return {Number}
   */
  async getTransactionDelaySeconds (transactions) {
    const waitPerBlock = (Math.round(this.config.constants.blocktime / 10) * 20)

    return waitPerBlock * Math.ceil(transactions.length / this.config.constants.block.maxTransactions)
  }

  /**
   * Get transaction from API by ID.
   * @param  {String} id
   * @return {(Object|null)}
   */
  async getTransaction (id) {
    try {
      const response = (await request(this.config).get(`/api/v2/transactions/${id}`))

      if (response.data) {
        return response.data
      }
    } catch (error) {
      //
    }

    return null
  }

  /**
   * Get delegate voters by public key.
   * @param  {String} publicKey
   * @return {Object[]}
   */
  async getVoters (publicKey) {
    try {
      return paginate(this.config, `/api/v2/delegates/${publicKey}/voters`)
    } catch (error) {
      const message = error.response ? error.response.data.message : error.message
      throw new Error(`Could not get voters for '${publicKey}': ${message}`)
    }
  }

  /**
   * Get wallet balance by address.
   * @param  {String} address
   * @return {Bignum}
   */
  async getWalletBalance (address) {
    try {
      return new Bignum((await this.getWallet(address)).balance)
    } catch (error) {
      //
    }

    return Bignum.ZERO
  }

  /**
   * Get wallet by address.
   * @param  {String} address
   * @return {Object}
   */
  async getWallet (address) {
    try {
      const response = (await request(this.config).get(`/api/v2/wallets/${address}`))

      if (response.data) {
        return response.data
      }

      return null
    } catch (error) {
      const message = error.response ? error.response.data.message : error.message
      throw new Error(`Could not get wallet for '${address}': ${message}`)
    }
  }

  /**
   * Parse fee based on input.
   * @param  {(String|Number)} fee
   * @return {Bignum}
   */
  static parseFee (fee) {
    if (typeof fee === 'string' && fee.indexOf('-') !== -1) {
      const feeRange = fee.split('-').map(f => new Bignum(f).toNumber())
      if (feeRange[1] < feeRange[0]) {
        return feeRange[0]
      }

      return new Bignum(Math.floor((Math.random() * (feeRange[1] - feeRange[0] + 1)) + feeRange[0]))
    }

    return new Bignum(fee)
  }

  /**
   * Send transactions to API and wait for response.
   * @param  {Object[]}  transactions
   * @param  {String}  [transactionType]
   * @param  {Boolean} [wait=true]
   * @return {Object}
   */
  async sendTransactions (transactions, transactionType, wait = true) {
    const response = await this.postTransactions(transactions)

    if (wait) {
      const delaySeconds = await this.getTransactionDelaySeconds(transactions)
      transactionType = (transactionType ? `${transactionType} ` : '') + 'transactions'
      logger.info(`Waiting ${delaySeconds} seconds to apply ${transactionType}`)
      await delay(delaySeconds * 1000)
    }

    return response
  }

  /**
   * Send transactions to API.
   * @param  {Object[]} transactions
   * @return {Object}
   */
  async postTransactions (transactions) {
    try {
      const response = (await request(this.config).post('/api/v2/transactions', {transactions}))
      return response.data
    } catch (error) {
      const message = error.response ? error.response.data.message : error.message
      throw new Error(`Could not post transactions: ${message}`)
    }
  }

  /**
   * Apply options to config.
   * @return {void}
   */
  __applyConfig () {
    this.config = {...config}
    if (this.options.baseUrl) {
      this.config.baseUrl = this.options.baseUrl.replace(/\/+$/, '')
    }

    if (this.options.apiPort) {
      this.config.apiPort = this.options.apiPort
    }

    if (this.options.p2pPort) {
      this.config.p2pPort = this.options.p2pPort
    }

    if (this.options.passphrase) {
      this.config.passphrase = this.options.passphrase
    }

    if (this.options.secondPassphrase) {
      this.config.secondPassphrase = this.options.secondPassphrase
    }
  }

  /**
   * Load constants from API and apply to config.
   * @return {void}
   */
  async __loadConstants () {
    try {
      this.config.constants = (await request(this.config).get('/api/v2/node/configuration')).data.constants
    } catch (error) {
      logger.error('Failed to get constants: ', error.message)
      process.exit(1)
    }
  }

  /**
   * Load network from API and apply to config.
   * @return {void}
   */
  async __loadNetworkConfig () {
    try {
      this.config.network = (await request(this.config).get('/config', true)).data.network
    } catch (error) {
      logger.error('Failed to get network config: ', error.message)
      process.exit(1)
    }
  }

  /**
   * Convert ARK to Arktoshi.
   * @param  {Number} ark
   * @return {Bignum}
   */
  static __arkToArktoshi (ark) {
    return new Bignum(ark * Math.pow(10, 8))
  }

  /**
   * Quit command and output error when problem sending transactions.
   * @param  {Error} error
   * @return {void}
   */
  __problemSendingTransactions (error) {
    const message = error.response ? error.response.data.message : error.message
    logger.error(`There was a problem sending transactions: ${message}`)
    process.exit(1)
  }
}
