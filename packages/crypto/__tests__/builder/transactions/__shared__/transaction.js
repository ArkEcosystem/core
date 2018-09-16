const TransactionBuilder = require('../../../../lib/builder/transactions/transaction')
const Bignum = require('../../../../lib/utils/bignum')
const { crypto, slots } = require('../../../../lib/crypto')
const configManager = require('../../../../lib/managers/config')
const Transaction = require('../../../../lib/models/transaction')

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
      expect(builder).toHaveProperty('data.timestamp')
      expect(builder).toHaveProperty('data.version', 0x01)
      expect(builder).toHaveProperty('data.network', configManager.get('pubKeyHash'))

      expect(builder).toHaveProperty('data.type')
      expect(builder).toHaveProperty('data.fee')
    })

    describe('builder', () => {
      let timestamp
      let data

      beforeEach(() => {
        timestamp = slots.getTime()

        data = {
          id: 'fake-id',
          amount: 0,
          fee: 0,
          recipientId: 'DK2v39r3hD9Lw8R5fFFHjUyCtXm1VETi42',
          senderPublicKey: '035440a82cb44faef75c3d7d881696530aac4d50da314b91795740cdbeaba9113c',
          timestamp,
          type: 0,
          version: 0x03
        }
      })

      it('should return a Transaction model with the builder data', () => {
        builder.data = data

        const transaction = builder.build()

        expect(transaction).toBeInstanceOf(Transaction)
        expect(transaction.amount).toEqual(Bignum.ZERO)
        expect(transaction.fee).toEqual(Bignum.ZERO)
        expect(transaction.recipientId).toBe('DK2v39r3hD9Lw8R5fFFHjUyCtXm1VETi42')
        expect(transaction.senderPublicKey).toBe('035440a82cb44faef75c3d7d881696530aac4d50da314b91795740cdbeaba9113c')
        expect(transaction.timestamp).toBe(timestamp)
        expect(transaction.type).toBe(0)
        expect(transaction.version).toBe(0x03)
      })

      it('could merge and override the builder data', () => {
        builder.data = data

        const transaction = builder.build({
          amount: 33,
          fee: 1000
        })

        expect(transaction).toBeInstanceOf(Transaction)
        expect(transaction.amount).toEqual(new Bignum(33))
        expect(transaction.fee).toEqual(new Bignum(1000))
        expect(transaction.recipientId).toBe('DK2v39r3hD9Lw8R5fFFHjUyCtXm1VETi42')
        expect(transaction.senderPublicKey).toBe('035440a82cb44faef75c3d7d881696530aac4d50da314b91795740cdbeaba9113c')
        expect(transaction.timestamp).toBe(timestamp)
        expect(transaction.version).toBe(0x03)
      })
    })

    describe('fee', () => {
      it('should set the fee', () => {
        builder.fee(255)
        expect(builder.data.fee).toBe(255)
      })
    })

    describe('amount', () => {
      it('should set the amount', () => {
        builder.amount(255)
        expect(builder.data.amount).toBe(255)
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
      let keys = { publicKey: '02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af' }
      crypto.getKeys = jest.fn(() => keys)
      crypto.sign = jest.fn()
      const signingObject = builder.__getSigningObject()

      builder.sign('dummy pass')

      expect(crypto.getKeys).toHaveBeenCalledWith('dummy pass')
      expect(crypto.sign).toHaveBeenCalledWith(signingObject, keys)
    })

    it('establishes the public key of the sender', () => {
      let keys = { publicKey: '02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af' }
      crypto.getKeys = jest.fn(() => keys)
      crypto.sign = jest.fn()
      builder.sign('my real pass')
      expect(builder.data.senderPublicKey).toBe(keys.publicKey)
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
