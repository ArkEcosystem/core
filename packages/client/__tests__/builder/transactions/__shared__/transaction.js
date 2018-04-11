import Transaction from '../../../../src/builder/transaction'
import cryptoBuilder from '../../../../src/builder/crypto'

export default () => {
  let tx

  beforeEach(() => {
    tx = global.tx
  })

  describe('inherits from Transaction', () => {
    it('as an instance', () => {
      expect(tx).toBeInstanceOf(Transaction)
    })

    it('should have the essential properties', () => {
      expect(tx).toHaveProperty('model')

      expect(tx).toHaveProperty('id')
      expect(tx).toHaveProperty('timestamp')
      expect(tx).toHaveProperty('version')
      expect(tx).toHaveProperty('network')

      expect(tx).toHaveProperty('type')
      expect(tx).toHaveProperty('fee')
    })

    describe('setFee', () => {
      it('should set the fee', () => {
        tx.setFee('fake')
        expect(tx.fee).toBe('fake')
      })
    })

    describe('setAmount', () => {
      it('should set the amount', () => {
        tx.setAmount('fake')
        expect(tx.amount).toBe('fake')
      })
    })

    describe('setRecipientId', () => {
      it('should set the recipient id', () => {
        tx.setRecipientId('fake')
        expect(tx.recipientId).toBe('fake')
      })
    })

    describe('setSenderPublicKey', () => {
      it('should set the sender public key', () => {
        tx.setSenderPublicKey('fake')
        expect(tx.senderPublicKey).toBe('fake')
      })
    })
  })

  describe('sign', () => {
    it('signs this transaction with the keys of the passphrase', () => {
      let keys
      cryptoBuilder.getKeys = jest.fn(pass => {
        keys = { publicKey: `${pass} public key` }
        return keys
      })
      cryptoBuilder.sign = jest.fn()
      tx.sign('bad pass')

      expect(cryptoBuilder.getKeys).toHaveBeenCalledWith('bad pass')
      expect(cryptoBuilder.sign).toHaveBeenCalledWith(tx, keys)
    })

    it('establishes the public key of the sender', () => {
      cryptoBuilder.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      cryptoBuilder.sign = jest.fn()
      tx.sign('my real pass')
      expect(tx.senderPublicKey).toBe('my real pass public key')
    })
  })

  describe('signSecond', () => {
    it('signs this transaction with the keys of the second passphrase', () => {
      let keys
      cryptoBuilder.getKeys = jest.fn(pass => {
        keys = { publicKey: `${pass} public key` }
        return keys
      })
      cryptoBuilder.secondSign = jest.fn()
      tx.secondSign('my very real second pass')

      expect(cryptoBuilder.getKeys).toHaveBeenCalledWith('my very real second pass')
      expect(cryptoBuilder.secondSign).toHaveBeenCalledWith(tx, keys)
    })
  })
}
