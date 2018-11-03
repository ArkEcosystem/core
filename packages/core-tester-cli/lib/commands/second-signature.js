'use strict'

const { client } = require('@arkecosystem/crypto')
const { logger } = require('../utils')
const Command = require('./command')
const Transfer = require('./transfer')

module.exports = class DelegateRegistrationCommand extends Command {
  /**
   * Run second-signature command.
   * @return {void}
   */
  async run () {
    const wallets = this.generateWallets()

    const transfer = await Transfer.init(this.options)
    await transfer.run({
      wallets,
      amount: this.options.amount || 5,
      skipTesting: true
    })

    logger.info(`Sending ${this.options.number} second signature transactions`)

    const transactions = []
    wallets.forEach((wallet, i) => {
      wallet.secondPassphrase = this.config.secondPassphrase || wallet.passphrase
      const transaction = client.getBuilder().secondSignature()
        .fee(Command.parseFee(this.options.signatureFee))
        .signatureAsset(wallet.secondPassphrase)
        .network(this.config.network.version)
        .sign(wallet.passphrase)
        .build()

      wallet.publicKey = transaction.senderPublicKey
      wallet.secondPublicKey = transaction.asset.signature.publicKey
      transactions.push(transaction)

      logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (fee: ${Command.__arktoshiToArk(transaction.fee)})`)
    })

    if (this.options.copy) {
      this.copyToClipboard(transactions)
      return
    }

    try {
      await this.sendTransactions(transactions, 'second-signature', !this.options.skipValidation)

      if (this.options.skipValidation) {
        return
      }

      for (const walletObject of wallets) {
        const wallet = await this.getWallet(walletObject.address)

        if (wallet.secondPublicKey !== walletObject.secondPublicKey || wallet.publicKey !== walletObject.publicKey) {
          logger.error(`Invalid second signature for ${walletObject.address}.`)
        }
      }
    } catch (error) {
      logger.error(`There was a problem sending transactions: ${error.response ? error.response.data.message : error}`)
    }
  }
}
