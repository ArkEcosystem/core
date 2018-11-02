'use strict'

const { client } = require('@arkecosystem/crypto')
const { logger } = require('../utils')
const superheroes = require('superheroes')
const Command = require('./command')
const Transfer = require('./transfer')

module.exports = class DelegateRegistrationCommand extends Command {
  /**
   * Run delegate-registration command.
   * @return {void}
   */
  async run () {
    const wallets = this.generateWallets()

    const transfer = await Transfer.init(this.options)
    await transfer.run({
      wallets,
      amount: this.options.amount || 25,
      skipTesting: true
    })

    const delegates = await this.getDelegates()

    logger.info(`Sending ${this.options.number} delegate registration transactions`)
    if (!this.options.skipValidation) {
      logger.info(`Starting delegate count: ${delegates.length}`)
    }

    const transactions = []
    const usedDelegateNames = delegates.map(delegate => delegate.username)

    wallets.forEach((wallet, i) => {
      while (!wallet.username || usedDelegateNames.includes(wallet.username)) {
        wallet.username = superheroes.random()
      }

      wallet.username = wallet.username.toLowerCase().replace(/ /g, '_')
      usedDelegateNames.push(wallet.username)

      const transaction = client.getBuilder().delegateRegistration()
        .fee(Command.parseFee(this.options.delegateFee))
        .usernameAsset(wallet.username)
        .network(this.config.network.version)
        .sign(wallet.passphrase)
        .secondSign(this.config.secondPassphrase)
        .build()

      transactions.push(transaction)

      logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (fee: ${Command.__arktoshiToArk(transaction.fee)}, username: ${wallet.username})`)
    })

    if (this.options.copy) {
      this.copyToClipboard(transactions)
      return
    }

    const expectedDelegates = delegates.length + wallets.length
    if (!this.options.skipValidation) {
      logger.info(`Expected end delegate count: ${expectedDelegates}`)
    }

    try {
      await this.sendTransactions(transactions, 'delegate', !this.options.skipValidation)

      if (this.options.skipValidation) {
        return
      }

      const delegates = await this.getDelegates()
      logger.info(`All transactions have been sent! Total delegates: ${delegates.length}`)

      if (delegates.length !== expectedDelegates) {
        logger.error(`Delegate count incorrect. '${delegates.length}' but should be '${expectedDelegates}'`)
      }
    } catch (error) {
      logger.error(`There was a problem sending transactions: ${error.response ? error.response.data.message : error}`)
    }
  }
}
