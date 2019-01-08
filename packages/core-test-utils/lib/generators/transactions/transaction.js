const superheroes = require('superheroes')
const { client, crypto } = require('@arkecosystem/crypto')
const {
  TRANSFER,
  SECOND_SIGNATURE,
  DELEGATE_REGISTRATION,
  VOTE,
} = require('@arkecosystem/crypto').constants.TRANSACTION_TYPES
const defaultPassphrase = require('../../../fixtures/testnet/passphrases')[0]

module.exports = (
  network,
  type,
  passphrase,
  addressOrPublicKey,
  amount = 2,
  quantity = 10,
  getStruct = false,
  fee,
) => {
  network = network || 'testnet'
  type = type || TRANSFER
  passphrase = passphrase || defaultPassphrase

  if (!['mainnet', 'devnet', 'testnet'].includes(network)) {
    throw new Error('Invalid network')
  }

  if (
    ![TRANSFER, SECOND_SIGNATURE, DELEGATE_REGISTRATION, VOTE].includes(type)
  ) {
    throw new Error('Invalid transaction type')
  }

  let secondPassphrase
  if (Array.isArray(passphrase)) {
    secondPassphrase = passphrase[1]
    passphrase = passphrase[0]
  }

  client.getConfigManager().setFromPreset('ark', network)

  const transactions = []
  for (let i = 0; i < quantity; i++) {
    let builder = client.getBuilder()
    switch (type) {
      case TRANSFER: {
        if (!addressOrPublicKey) {
          addressOrPublicKey = crypto.getAddress(
            crypto.getKeys(passphrase).publicKey,
          )
        }
        builder = builder
          .transfer()
          .recipientId(addressOrPublicKey)
          .amount(amount)
          .vendorField(`Test Transaction ${i + 1}`)
        break
      }
      case SECOND_SIGNATURE: {
        builder = builder.secondSignature().signatureAsset(passphrase)
        break
      }
      case DELEGATE_REGISTRATION: {
        const username = superheroes
          .random()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .substring(0, 20)
        builder = builder.delegateRegistration().usernameAsset(username)
        break
      }
      case VOTE: {
        if (!addressOrPublicKey) {
          addressOrPublicKey = crypto.getKeys(passphrase).publicKey
        }
        builder = builder.vote().votesAsset([`+${addressOrPublicKey}`])
        break
      }
      default: {
        throw new Error('Invalid transaction type')
      }
    }

    if (fee) {
      builder = builder.fee(fee)
    }

    builder = builder.sign(passphrase)

    if (secondPassphrase) {
      builder = builder.secondSign(secondPassphrase)
    }
    const transaction = getStruct ? builder.getStruct() : builder.build()

    transactions.push(transaction)
  }

  return transactions
}
