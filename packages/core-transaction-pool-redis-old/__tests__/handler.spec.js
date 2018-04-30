'use strict';

const Handler = require('../lib/handler')
const transactionHandler = new Handler(require('../lib/defaults.js'))

describe('Transaction Handler', () => {
  it('should be an object', async () => {
    await expect(transactionHandler).toBeInstanceOf(Handler)
  })

  describe('getInstance', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.getInstance).toBeFunction()
    })
  })

  describe('addTransaction', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.addTransaction).toBeFunction()
    })
  })

  describe('addTransactions', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.addTransactions).toBeFunction()
    })
  })

  describe('verify', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.verify).toBeFunction()
    })
  })

  describe('undoBlock', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.undoBlock).toBeFunction()
    })
  })

  describe('addTransactionToRedis', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.addTransactionToRedis).toBeFunction()
    })
  })

  describe('removeForgedTransactions', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.removeForgedTransactions).toBeFunction()
    })
  })

  describe('getUnconfirmedTransactions', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.getUnconfirmedTransactions).toBeFunction()
    })
  })

  describe('getTransactionsForForging', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.getTransactionsForForging).toBeFunction()
    })
  })

  describe('getUnconfirmedTransaction', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.getUnconfirmedTransaction).toBeFunction()
    })
  })

  describe('getPoolSize', async () => {
    it('should be a function', async () => {
      await expect(transactionHandler.getPoolSize).toBeFunction()
    })
  })
})
