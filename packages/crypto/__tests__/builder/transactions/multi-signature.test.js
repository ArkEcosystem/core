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

  describe('multiSignatureAsset', () => {
    const multiSignatureFee = feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)
    const multisignature = {
      keysgroup: ['key a', 'key b', 'key c'],
      lifetime: 1,
      min: 1
    }

    it('establishes the multi-signature on the asset', () => {
      builder.multiSignatureAsset(multisignature)
      expect(builder.data.asset.multisignature).toBe(multisignature)
    })

    it('calculates and establish the fee', () => {
      builder.multiSignatureAsset(multisignature)
      expect(builder.data.fee).toEqual(4 * multiSignatureFee)
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
