const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().secondSignature()

  global.builder = builder
})

describe('Second Signature Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.amount')
    expect(builder).toHaveProperty('data.recipientId')
    expect(builder).toHaveProperty('data.senderPublicKey')
    expect(builder).toHaveProperty('data.asset')
  })

  describe('sign', () => {
    xit('establishes the signature on the asset', () => {
      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()
      builder.sign('bad pass')
      expect(builder.data.asset.signature).toBe('bad pass public key')
    })
  })
})
