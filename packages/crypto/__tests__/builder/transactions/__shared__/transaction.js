const TransactionBuilder = require('../../../../lib/builder/transactions/transaction')
const crypto = require('../../../../lib/crypto/crypto')
const { slots } = require('../../../../lib/crypto')
const configManager = require('../../../../lib/managers/config')

module.exports = () => {
  let builder

  beforeEach(() => {
    builder = global.builder
  })

  describe('inherits = require(TransactionBuilder', () => {
    it('as an instance', () => {
      expect(builder).toBeInstanceOf(TransactionBuilder)
    })

    it('should have the essential properties', () => {
      expect(builder).toHaveProperty('data.id', null)
      expect(builder).toHaveProperty('data.timestamp', slots.getTime())
      expect(builder).toHaveProperty('data.version', 0x01)
      expect(builder).toHaveProperty('data.network', configManager.get('pubKeyHash'))

      expect(builder).toHaveProperty('data.type')
      expect(builder).toHaveProperty('data.fee')
    })

    describe('fee', () => {
      it('should set the fee', () => {
        builder.fee('fake')
        expect(builder.data.fee).toBe('fake')
      })
    })

    describe('amount', () => {
      it('should set the amount', () => {
        builder.amount('fake')
        expect(builder.data.amount).toBe('fake')
      })
    })

    describe('recipientId', () => {
      it('should set the recipient id', () => {
        builder.recipientId('fake')
        expect(builder.data.recipientId).toBe('fake')
      })
    })

    describe('senderPublicKey', () => {
      it('should set the sender public key', () => {
        builder.senderPublicKey('fake')
        expect(builder.data.senderPublicKey).toBe('fake')
      })
    })
  })

  describe('sign', () => {
    it('signs this transaction with the keys of the passphrase', () => {
      let keys
      crypto.getKeys = jest.fn(pass => {
        keys = { publicKey: `${pass} public key` }
        return keys
      })
      crypto.sign = jest.fn()
      const signingObject = builder.__getSigningObject()

      builder.sign('dummy pass')

      expect(crypto.getKeys).toHaveBeenCalledWith('dummy pass')
      expect(crypto.sign).toHaveBeenCalledWith(signingObject, keys)
    })

    it('establishes the public key of the sender', () => {
      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()
      builder.sign('my real pass')
      expect(builder.data.senderPublicKey).toBe('my real pass public key')
    })
  })

  describe('secondSign', () => {
    it('signs this transaction with the keys of the second passphrase', () => {
      let keys
      crypto.getKeys = jest.fn(pass => {
        keys = { publicKey: `${pass} public key` }
        return keys
      })
      crypto.secondSign = jest.fn()
      const signingObject = builder.__getSigningObject()

      builder.secondSign('my very real second pass')

      expect(crypto.getKeys).toHaveBeenCalledWith('my very real second pass')
      expect(crypto.secondSign).toHaveBeenCalledWith(signingObject, keys)
    })
  })
}
