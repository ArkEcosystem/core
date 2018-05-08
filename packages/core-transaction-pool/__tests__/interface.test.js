'use strict'

const app = require('./__support__/setup')

let transactionPoolInterface

const options = {
  enabled: true,
  key: 'ark/pool',
  maxTransactionsPerSender: 5,
  whiteList: [],
  redis: {
    host: 'localhost',
    port: 6379
  }
}

beforeAll(async (done) => {
  await app.setUp()

  transactionPoolInterface = new (require('../lib/interface'))(options)

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

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
