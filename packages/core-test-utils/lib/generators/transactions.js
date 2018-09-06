const assert = require('assert')
const { client, crypto } = require('@arkecosystem/crypto')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const config = require('../../config')
const superheroes = require('superheroes')

module.exports = (network, type, testWallet, testAddress, amount = 2, quantity = 10) => {
  network = network || 'testnet'
  type = type || TRANSACTION_TYPES.TRANSFER
  amount = amount * Math.pow(10, 8)

  assert.ok(['mainnet', 'devnet', 'testnet'].includes(network), 'Invalid network')
  assert.ok([
    TRANSACTION_TYPES.TRANSFER,
    TRANSACTION_TYPES.SECOND_SIGNATURE,
    TRANSACTION_TYPES.DELEGATE_REGISTRATION,
    TRANSACTION_TYPES.VOTE
  ].includes(type), 'Invalid transaction type')

  client.getConfigManager().setFromPreset('ark', network)

  const transactions = []
  for (let i = 0; i < quantity; i++) {
    const passphrase = testWallet ? testWallet.passphrase : config.passphrase
    const address = testAddress || crypto.getAddress(crypto.getKeys(passphrase).publicKey)

    let builder
    if (type === TRANSACTION_TYPES.TRANSFER) {
      builder = client.getBuilder().transfer()
        .recipientId(address)
        .amount(amount)
        .vendorField(`Test Transaction ${i + 1}`)
    } else if (type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
      builder = client.getBuilder().secondSignature()
        .signatureAsset(passphrase)
    } else if (type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      const username = superheroes.random().toLowerCase().replace(/[^a-z0-9]/g, '_')
      builder = client.getBuilder().delegateRegistration()
        .usernameAsset(username)
    } else if (type === TRANSACTION_TYPES.VOTE) {
      const publicKey = crypto.getKeys(config.passphrase).publicKey
      builder = client.getBuilder().vote()
        .votesAsset([`+${publicKey}`])
    } else {
      continue
    }

    const transaction = builder
      .sign(passphrase)
      .build()

    transactions.push(transaction)
  }

  return transactions
}
