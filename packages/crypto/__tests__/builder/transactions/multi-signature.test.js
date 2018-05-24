const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const feeManager = require('../../../lib/managers/fee')
const { TRANSACTION_TYPES } = require('../../../lib/constants')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().multiSignature()

  global.builder = builder
})

describe('Multi Signature Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.amount')
    expect(builder).toHaveProperty('data.recipientId')
    expect(builder).toHaveProperty('data.senderPublicKey')
    expect(builder).toHaveProperty('data.asset')
  })

  describe('create', () => {
    const keysgroup = []
    const lifetime = 'TODO'
    const min = 'TODO'

    it('establishes the multi-signature asset', () => {
      builder.create(keysgroup, lifetime, min)
      expect(builder.data.asset.multisignature).toEqual({ keysgroup, lifetime, min })
    })

    it('calculates and establishes the fee based on the number of key groups', () => {
      const multiSignatureFee = feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)

      builder.create(keysgroup, lifetime, min)
      expect(builder.data.fee).toEqual(multiSignatureFee)

      keysgroup.push('key 1')
      keysgroup.push('key 2')
      builder.create(keysgroup, lifetime, min)
      expect(builder.data.fee).toEqual(3 * multiSignatureFee)
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
