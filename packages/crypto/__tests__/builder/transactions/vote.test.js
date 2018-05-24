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
    expect(transaction.asset).toHaveProperty('votes')
  })

  describe('create', () => {
    it('establishes the votes asset', () => {
      const votes = ['+dummy-1']
      transaction.create(votes)
      expect(transaction.asset.votes).toBe(votes)
    })
  })

  describe('sign', () => {
    it('establishes the recipient id', () => {
      const pass = 'dummy pass'

      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()

      transaction.sign(pass)
      expect(transaction.recipientId).toBe('DKNJwdxrPQg6xXbrpaQLfgi6kC2ndaz8N5')
    })
  })
})
