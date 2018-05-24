const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().delegateRegistration()

  global.builder = builder
})

describe('Delegate Registration Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.amount')
    expect(builder).toHaveProperty('data.recipientId')
    expect(builder).toHaveProperty('data.senderPublicKey')
    expect(builder).toHaveProperty('data.asset')
  })

  it('should not have the username yet', () => {
    expect(builder).not.toHaveProperty('data.username')
  })

  describe('username', () => {
    it('establishes the username', () => {
      builder.username('homer')
      expect(builder.data.asset.delegate.username).toBe('homer')
    })
  })

  describe('sign', () => {
    it('establishes the public key of the delegate (on the asset property)', () => {
      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()
      builder.sign('bad pass')
      expect(builder.data.asset.delegate.publicKey).toBe('bad pass public key')
    })
  })

  // FIXME asset.delegate.username
  xdescribe('getStruct', () => {
    beforeEach(() => {
      builder.senderPublicKey = '01'
      builder.asset = { delegate: {} }
    })

    it('generates and returns the bytes as hex', () => {
      expect(builder.getStruct().hex).toBe(crypto.getBytes(builder).toString('hex'))
    })
    it('returns the id', () => {
      expect(builder.getStruct().id).toBe(crypto.getId(builder))
    })
    it('returns the signature', () => {
      expect(builder.getStruct().signature).toBe(builder.signature)
    })
    it('returns the second signature', () => {
      expect(builder.getStruct().secondSignature).toBe(builder.secondSignature)
    })
    it('returns the timestamp', () => {
      expect(builder.getStruct().timestamp).toBe(builder.timestamp)
    })
    it('returns the transaction type', () => {
      expect(builder.getStruct().type).toBe(builder.type)
    })
    it('returns the fee', () => {
      expect(builder.getStruct().fee).toBe(builder.fee)
    })
    it('returns the sender public key', () => {
      expect(builder.getStruct().senderPublicKey).toBe(builder.senderPublicKey)
    })

    it('returns the amount', () => {
      expect(builder.getStruct().amount).toBe(builder.amount)
    })
    it('returns the recipient id', () => {
      expect(builder.getStruct().recipientId).toBe(builder.recipientId)
    })
    it('returns the asset', () => {
      expect(builder.getStruct().asset).toBe(builder.asset)
    })
  })
})
