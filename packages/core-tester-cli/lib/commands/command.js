'use strict'

const { Bignum, crypto } = require('@arkecosystem/crypto')
const bip39 = require('bip39')
const clipboardy = require('clipboardy')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const { logger, paginate, request } = require('../utils')

module.exports = class Command {
  static async init (options) {
    const command = new this()
    command.options = options
    command.__applyConfig()
    await command.__loadConstants()
    await command.__loadNetworkConfig()

    return command
  }

  run (options) {
    throw new Error('Method [run] not implemented!')
  }

  copyToClipboard (transactions) {
    for (const transaction of transactions) {
      transaction.serialized = transaction.serialized.toString('hex')
    }

    clipboardy.writeSync(JSON.stringify(transactions))
    logger.info(`Copied ${transactions.length} transactions`)
  }

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

  async getDelegates (publicKey) {
    try {
      const delegates = await paginate('/api/v2/delegates')

      return delegates
    } catch (error) {
      const message = error.response ? error.response.data.message : error.message
      throw new Error(`Could not get delegates for '${publicKey}': ${message}`)
    }
  }

  async getTransactionDelaySeconds (transactions) {
    const waitPerBlock = (Math.round(this.config.constants.blocktime / 10) * 10)

    return waitPerBlock * Math.ceil(transactions.length / this.config.constants.block.maxTransactions)
  }

  async getTransaction (id) {
    try {
      const response = (await request(this.config).get(`/api/v2/transactions/${id}`)).data

      if (response.data) {
        return response.data
      }
    } catch (error) {
      //
    }

    return null
  }

  async getVoters (publicKey) {
    try {
      return paginate(`/api/v2/delegates/${publicKey}/voters`)
    } catch (error) {
      const message = error.response ? error.response.data.message : error.message
      throw new Error(`Could not get voters for '${publicKey}': ${message}`)
    }
  }

  async getWalletBalance (address) {
    try {
      return new Bignum((await this.getWallet(address)).balance)
    } catch (error) {
      return Bignum.ZERO
    }
  }

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

  parseFee (fee) {
    if (typeof fee === 'string' && fee.indexOf('-') !== -1) {
      const feeRange = fee.split('-').map(f => new Bignum(f))
      if (feeRange[1] < feeRange[0]) {
        return feeRange[0]
      }
      return new Bignum(Math.floor(Math.random() * (feeRange[1] - feeRange[0] + 1) + feeRange[0]))
    }

    return new Bignum(fee)
  }

  async postTransactions (transactions) {
    try {
      return (await request(this.config).post('/api/v2/transactions', {transactions})).data
    } catch (error) {
      throw error
    }
  }

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

  async __loadConstants () {
    try {
      this.config.constants = (await request(this.config).get('/api/v2/node/configuration')).data.constants
    } catch (error) {
      logger.error('Failed to get constants: ', error.message)
      process.exit(1)
    }
  }

  async __loadNetworkConfig () {
    try {
      this.config.network = (await request(this.config).get('/config', true)).data.network
    } catch (error) {
      logger.error('Failed to get network config: ', error.message)
      process.exit(1)
    }
  }
}
