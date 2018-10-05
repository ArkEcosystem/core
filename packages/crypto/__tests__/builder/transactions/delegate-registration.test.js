const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const { TRANSACTION_TYPES } = require('../../../lib/constants')
const feeManager = require('../../../lib/managers/fee')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().delegateRegistration()

  global.builder = builder
})

describe('Delegate Registration Transaction', () => {
  describe('verify', () => {
    it('should be valid with a signature', () => {
      const actual = builder
        .usernameAsset('homer')
        .sign('dummy passphrase')

      expect(actual.build().verify()).toBeTrue()
    })

    it('should be valid with a second signature', () => {
      const actual = builder
        .usernameAsset('homer')
        .sign('dummy passphrase')
        .secondSign('dummy passphrase')

      expect(actual.build().verify()).toBeTrue()
    })
  })

  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.type', TRANSACTION_TYPES.DELEGATE_REGISTRATION)
    expect(builder).toHaveProperty('data.amount', 0)
    expect(builder).toHaveProperty('data.fee', feeManager.get(TRANSACTION_TYPES.DELEGATE_REGISTRATION))
    expect(builder).toHaveProperty('data.recipientId', null)
    expect(builder).toHaveProperty('data.senderPublicKey', null)
    expect(builder).toHaveProperty('data.asset', { delegate: {} })
  })

  it('should not have the username yet', () => {
    expect(builder).not.toHaveProperty('data.username')
  })

  describe('usernameAsset', () => {
    it('establishes the username of the asset', () => {
      builder.usernameAsset('homer')
      expect(builder.data.asset.delegate.username).toBe('homer')
    })
  })

  describe('sign', () => {
    it('establishes the public key of the delegate (on the asset property)', () => {
      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn(() => 'signature')
      builder.sign('bad pass')
      expect(builder.data.asset.delegate.publicKey).toBe('bad pass public key')
    })
  })

  // FIXME problems with ark-js V1
  xdescribe('getStruct', () => {
    it('should fail if the transaction is not signed', () => {
      try {
        expect(() => builder.getStruct()).toThrow(/transaction.*sign/)
        expect('fail').toBe('this should fail when no error is thrown')
      } catch (_error) {
        builder = ark.getBuilder().delegateRegistration()
        expect(() => builder.sign('example pass').getStruct()).not.toThrow()
      }
    })

    describe('when is signed', () => {
      beforeEach(() => {
        builder.sign('any pass')
      })

      // NOTE: V2
      xit('generates and returns the bytes as hex', () => {
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
})
