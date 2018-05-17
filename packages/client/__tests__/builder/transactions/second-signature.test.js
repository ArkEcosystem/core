const ark = require('../../../lib/client')
const cryptoBuilder = require('../../../lib/builder/crypto')
const transactionTests = require('./__shared__/transaction')

let transaction

beforeEach(() => {
  transaction = ark.getBuilder().secondSignature()

  global.transaction = transaction
})

describe('Second Signature Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(transaction).toHaveProperty('amount')
    expect(transaction).toHaveProperty('recipientId')
    expect(transaction).toHaveProperty('senderPublicKey')
    expect(transaction).toHaveProperty('asset')
  })

  describe('sign', () => {
    xit('establishes the signature on the asset', () => {
      cryptoBuilder.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      cryptoBuilder.sign = jest.fn()
      transaction.sign('bad pass')
      expect(transaction.asset.signature).toBe('bad pass public key')
    })
  })
})
