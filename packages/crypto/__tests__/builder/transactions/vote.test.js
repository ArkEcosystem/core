const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const { TRANSACTION_TYPES } = require('../../../lib/constants')
const feeManager = require('../../../lib/managers/fee')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().vote()

  global.builder = builder
})

describe('Vote Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.type', TRANSACTION_TYPES.VOTE)
    expect(builder).toHaveProperty('data.fee', feeManager.get(TRANSACTION_TYPES.VOTE))
    expect(builder).toHaveProperty('data.amount', 0)
    expect(builder).toHaveProperty('data.recipientId', null)
    expect(builder).toHaveProperty('data.senderPublicKey', null)
    expect(builder).toHaveProperty('data.asset')
    expect(builder).toHaveProperty('data.asset.votes', [])
  })

  describe('votesAsset', () => {
    it('establishes the votes asset', () => {
      const votes = ['+dummy-1']
      builder.votesAsset(votes)
      expect(builder.data.asset.votes).toBe(votes)
    })
  })

  describe('sign', () => {
    it('establishes the recipient id', () => {
      const pass = 'dummy pass'

      crypto.getKeys = jest.fn(() => ({ publicKey: '02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af' }))
      crypto.sign = jest.fn()

      builder.sign(pass)
      expect(builder.data.recipientId).toBe('D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F')
    })
  })
})
