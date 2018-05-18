const handler = require('../../../lib/handlers/transactions')

let wallet
let transaction

beforeEach(() => {
  wallet = require('./__fixtures__/wallet')
  transaction = require('./__fixtures__/transaction')
})

describe('TransactionHandler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('TransactionHandler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })
  })

  describe('apply', () => {
    it('should be a function', () => {
      expect(handler.apply).toBeFunction()
    })
  })

  describe('applyTransactionToSender', () => {
    it('should be a function', () => {
      expect(handler.applyTransactionToSender).toBeFunction()
    })
  })

  describe('applyTransactionToRecipient', () => {
    it('should be a function', () => {
      expect(handler.applyTransactionToRecipient).toBeFunction()
    })
  })

  describe('revert', () => {
    it('should be a function', () => {
      expect(handler.revert).toBeFunction()
    })
  })

  describe('revertTransactionForSender', () => {
    it('should be a function', () => {
      expect(handler.revertTransactionForSender).toBeFunction()
    })
  })

  describe('revertTransactionForRecipient', () => {
    it('should be a function', () => {
      expect(handler.revertTransactionForRecipient).toBeFunction()
    })
  })
})
