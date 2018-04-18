'use strict';

const Manager = require('../src/manager')
const transactionManager = new Manager(require('../src/defaults.json'))

describe('Transaction Manager', () => {
  it('should be an object', async () => {
    await expect(transactionManager).toBeInstanceOf(Manager)
  })

  describe('getInstance', async () => {
    it('should be a function', async () => {
      await expect(repository.getInstance).toBeFunction()
    })
  })

  describe('getPoolSize', async () => {
    it('should be a function', async () => {
      await expect(repository.getPoolSize).toBeFunction()
    })
  })

  describe('addTransaction', async () => {
    it('should be a function', async () => {
      await expect(repository.addTransaction).toBeFunction()
    })
  })

  describe('removeTransaction', async () => {
    it('should be a function', async () => {
      await expect(repository.removeTransaction).toBeFunction()
    })
  })

  describe('removeTransactions', async () => {
    it('should be a function', async () => {
      await expect(repository.removeTransactions).toBeFunction()
    })
  })

  describe('getTransactions', async () => {
    it('should be a function', async () => {
      await expect(repository.getTransactions).toBeFunction()
    })
  })

  describe('getTransactionsForForging', async () => {
    it('should be a function', async () => {
      await expect(repository.getTransactionsForForging).toBeFunction()
    })
  })

  describe('getTransaction', async () => {
    it('should be a function', async () => {
      await expect(repository.getTransaction).toBeFunction()
    })
  })

  describe('__checkIfForged', async () => {
    it('should be a function', async () => {
      await expect(repository.__checkIfForged).toBeFunction()
    })
  })

  describe('__getRedisTransactionKey', async () => {
    it('should be a function', async () => {
      await expect(repository.__getRedisTransactionKey).toBeFunction()
    })
  })

  describe('__getRedisOrderKey', async () => {
    it('should be a function', async () => {
      await expect(repository.__getRedisOrderKey).toBeFunction()
    })
  })
})
