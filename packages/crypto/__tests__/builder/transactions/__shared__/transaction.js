const Transaction = require('../../../../lib/builder/transactions/transaction')
const crypto = require('../../../../lib/crypto/crypto')

module.exports = () => {
  let transaction

  beforeEach(() => {
    transaction = global.transaction
  })

  describe('inherits = require(Transaction', () => {
    it('as an instance', () => {
      expect(transaction).toBeInstanceOf(Transaction)
    })

    it('should have the essential properties', () => {
      expect(transaction).toHaveProperty('model')

      expect(transaction).toHaveProperty('id')
      expect(transaction).toHaveProperty('timestamp')
      expect(transaction).toHaveProperty('version')
      expect(transaction).toHaveProperty('network')

      expect(transaction).toHaveProperty('type')
      expect(transaction).toHaveProperty('fee')
    })

    describe('setFee', () => {
      it('should set the fee', () => {
        transaction.setFee('fake')
        expect(transaction.fee).toBe('fake')
      })
    })

    describe('setAmount', () => {
      it('should set the amount', () => {
        transaction.setAmount('fake')
        expect(transaction.amount).toBe('fake')
      })
    })

    describe('setRecipientId', () => {
      it('should set the recipient id', () => {
        transaction.setRecipientId('fake')
        expect(transaction.recipientId).toBe('fake')
      })
    })

    describe('setSenderPublicKey', () => {
      it('should set the sender public key', () => {
        transaction.setSenderPublicKey('fake')
        expect(transaction.senderPublicKey).toBe('fake')
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
      transaction.sign('bad pass')

      expect(crypto.getKeys).toHaveBeenCalledWith('bad pass')
      expect(crypto.sign).toHaveBeenCalledWith(transaction, keys)
    })

    it('establishes the public key of the sender', () => {
      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()
      transaction.sign('my real pass')
      expect(transaction.senderPublicKey).toBe('my real pass public key')
    })
  })

  describe('signSecond', () => {
    it('signs this transaction with the keys of the second passphrase', () => {
      let keys
      crypto.getKeys = jest.fn(pass => {
        keys = { publicKey: `${pass} public key` }
        return keys
      })
      crypto.secondSign = jest.fn()
      transaction.secondSign('my very real second pass')

      expect(crypto.getKeys).toHaveBeenCalledWith('my very real second pass')
      expect(crypto.secondSign).toHaveBeenCalledWith(transaction, keys)
    })
  })
}
