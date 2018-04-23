'use strict';

const Manager = require('../lib/manager')
const transactionManager = new Manager(require('../lib/defaults.json'))

describe('Transaction Manager', () => {
  it('should be an object', async () => {
    await expect(transactionManager).toBeInstanceOf(Manager)
  })

  describe('getInstance', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.getInstance).toBeFunction()
    })
  })

  describe('getPoolSize', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.getPoolSize).toBeFunction()
    })
  })

  describe('addTransaction', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.addTransaction).toBeFunction()
    })
  })

  describe('removeTransaction', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.removeTransaction).toBeFunction()
    })
  })

  describe('removeTransactions', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.removeTransactions).toBeFunction()
    })
  })

  describe('getTransactions', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.getTransactions).toBeFunction()
    })
  })

  describe('getTransactionsForForging', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.getTransactionsForForging).toBeFunction()
    })
  })

  describe('getTransaction', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.getTransaction).toBeFunction()
    })
  })

  describe('__checkIfForged', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.__checkIfForged).toBeFunction()
    })
  })

  describe('__getRedisTransactionKey', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.__getRedisTransactionKey).toBeFunction()
    })
  })

  describe('__getRedisOrderKey', async () => {
    it('should be a function', async () => {
      await expect(transactionManager.__getRedisOrderKey).toBeFunction()
    })
  })
})
