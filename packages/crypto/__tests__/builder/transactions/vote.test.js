const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().vote()

  global.builder = builder
})

describe('Vote Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.amount')
    expect(builder).toHaveProperty('data.recipientId')
    expect(builder).toHaveProperty('data.senderPublicKey')
    expect(builder).toHaveProperty('data.asset')
    expect(builder).toHaveProperty('data.asset.votes')
  })

  describe('create', () => {
    it('establishes the votes asset', () => {
      const votes = ['+dummy-1']
      builder.create(votes)
      expect(builder.data.asset.votes).toBe(votes)
    })
  })

  describe('sign', () => {
    it('establishes the recipient id', () => {
      const pass = 'dummy pass'

      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()

      builder.sign(pass)
      expect(builder.data.recipientId).toBe('DKNJwdxrPQg6xXbrpaQLfgi6kC2ndaz8N5')
    })
  })
})
