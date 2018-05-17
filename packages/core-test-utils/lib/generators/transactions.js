const ark = require('arkjs')
const assert = require('assert')
const { client, constants, crypto } = require('@arkecosystem/client')
const TRANSACTION_TYPES = constants.TRANSACTION_TYPES
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
  ark.crypto.setNetworkVersion(client.getConfigManager().config.pubKeyHash)

  const transactions = []
  for (let i = 0; i < quantity; i++) {
    const passphrase = testWallet ? testWallet.passphrase : config.passphrase
    const address = testAddress || crypto.getAddress(crypto.getKeys(passphrase).publicKey)

    let transaction
    if (type === TRANSACTION_TYPES.TRANSFER) {
      transaction = ark.transaction.createTransaction(
        address,
        amount,
        `Test Transaction ${i + 1}`,
        passphrase
      )
    } else if (type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
      transaction = ark.signature.createSignature(passphrase, passphrase)
    } else if (type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      const username = superheroes.random().toLowerCase().replace(/[^a-z0-9]/g, '_')
      transaction = ark.delegate.createDelegate(passphrase, username)
    } else if (type === TRANSACTION_TYPES.VOTE) {
      const publicKey = crypto.getKeys(config.passphrase).publicKey
      transaction = ark.vote.createVote(passphrase, [publicKey])
    } else {
      break
    }

    transactions.push(transaction)
  }

  return transactions
}
