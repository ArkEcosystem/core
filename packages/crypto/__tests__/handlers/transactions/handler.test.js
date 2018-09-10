const BaseHandler = require('../../../lib/handlers/transactions/handler')
const { ARKTOSHI } = require('../../../lib/constants')

let handler
let wallet
let transaction

beforeEach(() => {
  handler = new BaseHandler()

  wallet = {
    address: 'DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh',
    balance: 4527654310,
    publicKey: '034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126'
  }

  transaction = {
    version: 1,
    id: '943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4',
    blockid: '11233167632577333611',
    type: 0,
    timestamp: 36482198,
    amount: 100000000,
    fee: 10000000,
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
      expect(handler.canApply(wallet, transaction)).toBeTruthy()
    })

    it('should be falsy', () => {
      transaction.senderPublicKey = 'a'.repeat(66)

      expect(handler.canApply(wallet, transaction)).toBeFalsy()
    })
  })

  describe('applyTransactionToSender', () => {
    it('should be a function', () => {
      expect(handler.applyTransactionToSender).toBeFunction()
    })

    it('should be ok', () => {
      handler.apply = jest.fn()

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = initialBalance

      handler.applyTransactionToSender(wallet, transaction)

      expect(wallet.balance).toBe(initialBalance - (transaction.amount + transaction.fee))
    })

    it('should not be ok', () => {
      handler.apply = jest.fn()

      transaction.senderPublicKey = 'a'.repeat(66)

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = initialBalance

      handler.applyTransactionToSender(wallet, transaction)

      expect(wallet.balance).toBe(initialBalance)
    })
  })

  describe('revertTransactionForSender', () => {
    it('should be a function', () => {
      expect(handler.revertTransactionForSender).toBeFunction()
    })

    it('should be ok', () => {
      handler.revert = jest.fn()

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = initialBalance

      handler.revertTransactionForSender(wallet, transaction)

      expect(wallet.balance).toBe(initialBalance + (transaction.amount + transaction.fee))
    })

    it('should not be ok', () => {
      handler.revert = jest.fn()

      transaction.senderPublicKey = 'a'.repeat(66)

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = initialBalance

      handler.revertTransactionForSender(wallet, transaction)

      expect(wallet.balance).toBe(initialBalance)
    })
  })

  describe('applyTransactionToRecipient', () => {
    it('should be a function', () => {
      expect(handler.applyTransactionToRecipient).toBeFunction()
    })

    it('should be ok', () => {
      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = initialBalance

      handler.applyTransactionToRecipient(wallet, transaction)

      expect(wallet.balance).toBe(initialBalance + transaction.amount)
    })

    it('should not be ok', () => {
      transaction.recipientId = 'invalid-recipientId'

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = initialBalance

      handler.applyTransactionToRecipient(wallet, transaction)

      expect(wallet.balance).toBe(initialBalance)
    })
  })

  describe('revertTransactionForRecipient', () => {
    it('should be a function', () => {
      expect(handler.revertTransactionForRecipient).toBeFunction()
    })

    it('should be ok', () => {
      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = initialBalance

      handler.revertTransactionForRecipient(wallet, transaction)

      expect(wallet.balance).toBe(initialBalance - transaction.amount)
    })

    it('should not be ok', () => {
      transaction.recipientId = 'invalid-recipientId'

      const initialBalance = 1000 * ARKTOSHI
      wallet.balance = initialBalance

      handler.revertTransactionForRecipient(wallet, transaction)

      expect(wallet.balance).toBe(initialBalance)
    })
  })
})
