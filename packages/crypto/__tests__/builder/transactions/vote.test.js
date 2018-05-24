const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const transactionTests = require('./__shared__/transaction')

let transaction

beforeEach(() => {
  transaction = ark.getBuilder().vote()

  global.transaction = transaction
})

describe('Vote Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(transaction).toHaveProperty('amount')
    expect(transaction).toHaveProperty('recipientId')
    expect(transaction).toHaveProperty('senderPublicKey')
    expect(transaction).toHaveProperty('asset')
  })

  describe('create', () => {
    it('establishes the votes asset', () => {
      const invalidVotes = ['invalid-1', 'invalid-2', 'invalid-3']
      transaction.create(invalidVotes)
      expect(transaction.asset.votes).toBe(invalidVotes)
    })
  })

  describe('sign', () => {
    xit('establishes the recipient id', () => {
      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()
      transaction.sign('bad pass')
      expect(transaction.recipientId).toBe('bad pass public key')
    })
  })
})
