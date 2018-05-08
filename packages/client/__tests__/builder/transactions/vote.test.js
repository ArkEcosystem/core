const ark = require('../../../lib/client')
const cryptoBuilder = require('../../../lib/builder/crypto')
const transactionTests = require('./__shared__/transaction')

let tx

beforeEach(() => {
  tx = ark.getBuilder().vote()

  global.tx = tx
})

describe('Vote Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(tx).toHaveProperty('amount')
    expect(tx).toHaveProperty('recipientId')
    expect(tx).toHaveProperty('senderPublicKey')
    expect(tx).toHaveProperty('asset')
  })

  describe('create', () => {
    it('establishes the votes asset', () => {
      const invalidVotes = ['invalid-1', 'invalid-2', 'invalid-3']
      tx.create(invalidVotes)
      expect(tx.asset.votes).toBe(invalidVotes)
    })
  })

  describe('sign', () => {
    xit('establishes the recipient id', () => {
      cryptoBuilder.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      cryptoBuilder.sign = jest.fn()
      tx.sign('bad pass')
      expect(tx.recipientId).toBe('bad pass public key')
    })
  })
})
