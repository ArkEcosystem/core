const { client, crypto } = require('@arkecosystem/crypto')
const { TRANSFER, SECOND_SIGNATURE, DELEGATE_REGISTRATION, VOTE } = require('@arkecosystem/crypto').constants.TRANSACTION_TYPES
const defaultPassphrase = require('../../../fixtures/testnet/passphrases')[0]
const superheroes = require('superheroes')

module.exports = (network, type, passphrase, address, amount = 2, quantity = 10, getStruct = false) => {
  network = network || 'testnet'
  type = type || TRANSFER
  passphrase = passphrase || defaultPassphrase

  if (!['mainnet', 'devnet', 'testnet'].includes(network)) {
    throw new Error('Invalid network')
  }

  if (![TRANSFER, SECOND_SIGNATURE, DELEGATE_REGISTRATION, VOTE].includes(type)) {
    throw new Error('Invalid transaction type')
  }

  client.getConfigManager().setFromPreset('ark', network)
  address = address || crypto.getAddress(crypto.getKeys(passphrase).publicKey)

  const transactions = []
  for (let i = 0; i < quantity; i++) {
    let builder = client.getBuilder()
    switch (type) {
    case TRANSFER:
      builder = builder.transfer().recipientId(address).amount(amount).vendorField(`Test Transaction ${i + 1}`)
      break
    case SECOND_SIGNATURE:
      builder = builder.secondSignature().signatureAsset(passphrase)
      break
    case DELEGATE_REGISTRATION:
      const username = superheroes.random().toLowerCase().replace(/[^a-z0-9]/g, '_')
      builder = builder.delegateRegistration().usernameAsset(username)
      break
    case VOTE:
      const publicKey = crypto.getKeys(passphrase).publicKey
      builder = builder.vote().votesAsset([`+${publicKey}`])
      break
    }

    builder = builder.sign(passphrase)
    const transaction = getStruct ? builder.getStruct() : builder.build()

    transactions.push(transaction)
  }

  return transactions
}
