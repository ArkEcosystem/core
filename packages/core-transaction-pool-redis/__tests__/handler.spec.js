'use strict';

const Handler = require('../src/handler')
const transactionHandler = new Hander(require('../src/defaults.json'))

describe('Transaction Handler', () => {
  it('should be an object', async () => {
    await expect(transactionHandler).toBeInstanceOf(Handler)
  })

  describe('getInstance', async () => {
    it('should be a function', async () => {
      await expect(repository.getInstance).toBeFunction()
    })
  })

  describe('addTransaction', async () => {
    it('should be a function', async () => {
      await expect(repository.addTransaction).toBeFunction()
    })
  })

  describe('addTransactions', async () => {
    it('should be a function', async () => {
      await expect(repository.addTransactions).toBeFunction()
    })
  })

  describe('verify', async () => {
    it('should be a function', async () => {
      await expect(repository.verify).toBeFunction()
    })
  })

  describe('undoBlock', async () => {
    it('should be a function', async () => {
      await expect(repository.undoBlock).toBeFunction()
    })
  })

  describe('addTransactionToRedis', async () => {
    it('should be a function', async () => {
      await expect(repository.addTransactionToRedis).toBeFunction()
    })
  })

  describe('removeForgedTransactions', async () => {
    it('should be a function', async () => {
      await expect(repository.removeForgedTransactions).toBeFunction()
    })
  })

  describe('getUnconfirmedTransactions', async () => {
    it('should be a function', async () => {
      await expect(repository.getUnconfirmedTransactions).toBeFunction()
    })
  })

  describe('getTransactionsForForging', async () => {
    it('should be a function', async () => {
      await expect(repository.getTransactionsForForging).toBeFunction()
    })
  })

  describe('getUnconfirmedTransaction', async () => {
    it('should be a function', async () => {
      await expect(repository.getUnconfirmedTransaction).toBeFunction()
    })
  })

  describe('getPoolSize', async () => {
    it('should be a function', async () => {
      await expect(repository.getPoolSize).toBeFunction()
    })
  })
})
