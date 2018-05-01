'use strict';

const TransactionPoolInterface = require('../lib/connection')

const transactionPoolInterface = new TransactionPoolInterface()

describe('TransactionPoolInterface Interface', () => {
  it('should be an object', async () => {
    await expect(transactionPoolInterface).toBeObject()
  })

  describe('driver', async () => {
    it('should be a function', async () => {
      await expect(transactionPoolInterface.driver).toBeFunction()
    })
  })

  describe('getPoolSize', async () => {
    it('should be a function', async () => {
      await expect(transactionPoolInterface.getPoolSize).toBeFunction()
    })
  })

  describe('addTransaction', async () => {
    it('should be a function', async () => {
      await expect(transactionPoolInterface.addTransaction).toBeFunction()
    })
  })

  describe('removeTransaction', async () => {
    it('should be a function', async () => {
      await expect(transactionPoolInterface.removeTransaction).toBeFunction()
    })
  })

  describe('removeTransactions', async () => {
    it('should be a function', async () => {
      await expect(transactionPoolInterface.removeTransactions).toBeFunction()
    })
  })

  describe('getTransaction', async () => {
    it('should be a function', async () => {
      await expect(transactionPoolInterface.getTransaction).toBeFunction()
    })
  })

  describe('getTransactions', async () => {
    it('should be a function', async () => {
      await expect(transactionPoolInterface.getTransactions).toBeFunction()
    })
  })

  describe('getTransactionsForForging', async () => {
    it('should be a function', async () => {
      await expect(transactionPoolInterface.getTransactionsForForging).toBeFunction()
    })
  })
})
