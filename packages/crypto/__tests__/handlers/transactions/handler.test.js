const BaseHandler = require('../../../lib/handlers/transactions/handler')
const { ARKTOSHI } = require('../../../lib/constants')
const Bignum = require('../../../lib/utils/bignum')

let handler
let wallet
let transaction

beforeEach(() => {
  handler = new BaseHandler()

  wallet = {
    address: 'DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh',
    balance: new Bignum(4527654310),
    publicKey: '034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126'
  }

  transaction = {
    version: 1,
    id: '943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4',
    blockid: '11233167632577333611',
    type: 0,
    timestamp: 36482198,
    amount: new Bignum(100000000),
    fee: new Bignum(10000000),
    senderId: 'DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh',
    recipientId: 'DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh',
    senderPublicKey: '034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126',
    signature: '304402205881204c6e515965098099b0e20a7bf104cd1bad6cfe8efd1641729fcbfdbf1502203cfa3bd9efb2ad250e2709aaf719ac0db04cb85d27a96bc8149aeaab224de82b', // eslint-disable-line max-len
    asset: {}
  }
})

describe('Handler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('Handler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })

    it('should be truthy', () => {
      expect(handler.canApply(wallet, transaction)).toBeTrue()
    })

    it('should be falsy', () => {
      transaction.senderPublicKey = 'a'.repeat(66)

      expect(handler.canApply(wallet, transaction)).toBeFalse()
    })

    it('should be truthy even with case mismatch', () => {
      transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase()
      wallet.publicKey = wallet.publicKey.toLowerCase()

      expect(handler.canApply(wallet, transaction)).toBeTrue()
    })
  })

  describe('applyTransactionToSender', () => {
    it('should be a function', () => {
      expect(handler.applyTransactionToSender).toBeFunction()
    })

    it('should be ok', () => {
      handler.apply = jest.fn()

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)

      handler.applyTransactionToSender(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance).minus(transaction.amount).minus(transaction.fee))
    })

    it('should not be ok', () => {
      handler.apply = jest.fn()

      transaction.senderPublicKey = 'a'.repeat(66)

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)

      handler.applyTransactionToSender(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance))
    })

    it('should not fail due to case mismatch', () => {
      handler.apply = jest.fn()

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)
      transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase()
      wallet.publicKey = wallet.publicKey.toLowerCase()

      handler.applyTransactionToSender(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance).minus(transaction.amount).minus(transaction.fee))
    })
  })

  describe('revertTransactionForSender', () => {
    it('should be a function', () => {
      expect(handler.revertTransactionForSender).toBeFunction()
    })

    it('should be ok', () => {
      handler.revert = jest.fn()

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)

      handler.revertTransactionForSender(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance).plus(transaction.amount).plus(transaction.fee))
    })

    it('should not be ok', () => {
      handler.revert = jest.fn()

      transaction.senderPublicKey = 'a'.repeat(66)

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)

      handler.revertTransactionForSender(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance))
    })

    it('should not fail due to case mismatch', () => {
      handler.revert = jest.fn()

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)
      transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase()
      wallet.publicKey = wallet.publicKey.toLowerCase()

      handler.revertTransactionForSender(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance).plus(transaction.amount).plus(transaction.fee))
    })
  })

  describe('applyTransactionToRecipient', () => {
    it('should be a function', () => {
      expect(handler.applyTransactionToRecipient).toBeFunction()
    })

    it('should be ok', () => {
      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)

      handler.applyTransactionToRecipient(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance).plus(transaction.amount))
    })

    it('should not be ok', () => {
      transaction.recipientId = 'invalid-recipientId'

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)

      handler.applyTransactionToRecipient(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance))
    })
  })

  describe('revertTransactionForRecipient', () => {
    it('should be a function', () => {
      expect(handler.revertTransactionForRecipient).toBeFunction()
    })

    it('should be ok', () => {
      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)

      handler.revertTransactionForRecipient(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance - transaction.amount))
    })

    it('should not be ok', () => {
      transaction.recipientId = 'invalid-recipientId'

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = new Bignum(initialBalance)

      handler.revertTransactionForRecipient(wallet, transaction)

      expect(wallet.balance).toEqual(new Bignum(initialBalance))
    })
  })
})
