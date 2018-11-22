const { NetworkManager } = require('@arkecosystem/crypto')
const { Transaction } = require('@arkecosystem/crypto').models
const genTransfer = require('../../../lib/generators/transactions/transfer')
const genWallets = require('../../../lib/generators/wallets')

require('../../../lib/matchers/transactions/valid-second-signature')

const wallets = genWallets('testnet', 2)
const transaction = genTransfer('testnet', wallets.map(w => w.passphrase))[0]

describe('.toHaveValidSecondSignature', () => {
  test('passes when given a valid transaction', () => {
    expect(transaction).toHaveValidSecondSignature({
      publicKey: wallets[1].publicKey,
    })
  })

  test('fails when given an invalid transaction', () => {
    transaction.secondSignature = 'invalid'
    transaction.signSignature = 'invalid'

    expect(transaction).not.toHaveValidSecondSignature({
      publicKey: wallets[1].publicKey,
    })
  })
})
