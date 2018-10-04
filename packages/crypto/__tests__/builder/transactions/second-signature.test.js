const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const { TRANSACTION_TYPES } = require('../../../lib/constants')
const feeManager = require('../../../lib/managers/fee')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().secondSignature()

  global.builder = builder
})

describe('Second Signature Transaction', () => {
  describe('verify', () => {
    it('should be valid with a signature', () => {
      const actual = builder
        .signatureAsset('signature')
        .sign('dummy passphrase')

      expect(actual.build().verify()).toBeTrue()
    })
  })

  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.type', TRANSACTION_TYPES.SECOND_SIGNATURE)
    expect(builder).toHaveProperty('data.fee', feeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE))
    expect(builder).toHaveProperty('data.amount', 0)
    expect(builder).toHaveProperty('data.recipientId', null)
    expect(builder).toHaveProperty('data.senderPublicKey', null)
    expect(builder).toHaveProperty('data.asset')
    expect(builder).toHaveProperty('data.asset.signature', {})
  })

  describe('signatureAsset', () => {
    it('establishes the signature on the asset', () => {
      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()

      builder.signatureAsset('bad pass')

      expect(builder.data.asset.signature.publicKey).toBe('bad pass public key')
    })
  })
})
