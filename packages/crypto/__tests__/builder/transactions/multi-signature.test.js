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
    expect(builder).toHaveProperty('data.type', TRANSACTION_TYPES.MULTI_SIGNATURE)
    expect(builder).toHaveProperty('data.fee', 0)
    expect(builder).toHaveProperty('data.amount', 0)
    expect(builder).toHaveProperty('data.recipientId', null)
    expect(builder).toHaveProperty('data.senderPublicKey', null)
    expect(builder).toHaveProperty('data.asset')
    expect(builder).toHaveProperty('data.asset.multisignature', {})
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
      expect(builder.data.fee).toBe(4 * multiSignatureFee)
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

  describe('multiSignatureSign', () => {
    it('adds the signature to the transaction', () => {
      const pass = 'dummy pass'
      const signature = `${pass} signature`

      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn(() => (signature))

      builder.multiSignatureSign(pass)
      expect(builder.data.signatures).toIncludeAllMembers([signature])
    })
  })
})
