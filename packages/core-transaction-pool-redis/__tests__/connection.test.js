'use strict'

const app = require('./__support__/setup')
const delay = require('delay')
const { dummy1, dummy2, dummyExp1, dummyExp2 } = require('./__fixtures__/transactions')
const { Transaction } = require('@arkecosystem/crypto').models

let connection

beforeAll(async (done) => {
  await app.setUp()

  const RedisConnection = require('../lib/connection.js')
  connection = new RedisConnection(require('../lib/defaults'))
  connection = connection.make()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(async (done) => {
  await connection.flush()

  done()
})

describe('Connection', () => {
  it('should be an object', () => {
    expect(connection).toBeObject()
  })

  describe('getPoolSize', () => {
    it('should be a function', () => {
      expect(connection.getPoolSize).toBeFunction()
    })

    it('should return 0 if no transactions were added', async () => {
      await expect(connection.getPoolSize()).resolves.toBe(0)
    })

    it('should return 2 if transactions were added', async () => {
      await expect(connection.getPoolSize()).resolves.toBe(0)

      await connection.addTransaction(dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(1)
    })
  })

  describe('addTransaction', () => {
    it('should be a function', () => {
      expect(connection.addTransaction).toBeFunction()
    })

    it('should add the transaction to the pool', async () => {
      await expect(connection.getPoolSize()).resolves.toBe(0)

      await connection.addTransaction(dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(1)
    })
  })

  describe('addTransactions', () => {
    it('should be a function', () => {
      expect(connection.addTransactions).toBeFunction()
    })

    it('should add the transactions to the pool', async () => {
      await expect(connection.getPoolSize()).resolves.toBe(0)

      connection.addTransactions = jest.fn(async (transactions) => {
        for (let i = 0; i < transactions.length; i++) {
          await connection.addTransaction(transactions[i])
        }
      })

      await connection.addTransactions([dummy1, dummy2])

      await expect(connection.getPoolSize()).resolves.toBe(2)
    })
  })

  describe('addTransactions with expiration', () => {
    it('should add the transactions to the pool and they should expire', async () => {
      await expect(connection.getPoolSize()).resolves.toBe(0)

      connection.addTransactions = jest.fn(async (transactions) => {
        for (let i = 0; i < transactions.length; i++) {
          await connection.addTransaction(transactions[i])
        }
      })

      const trx1 = new Transaction(dummyExp1)
      const trx2 = new Transaction(dummyExp2)

      await connection.addTransactions([trx1, trx2])

      await expect(connection.getPoolSize()).resolves.toBe(2)
      await delay(7000)
      await expect(connection.getPoolSize()).resolves.toBe(0)
    })
  })

  describe('removeTransaction', () => {
    it('should be a function', () => {
      expect(connection.removeTransaction).toBeFunction()
    })

    it('should remove the specified transaction from the pool', async () => {
      await connection.addTransaction(dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(1)

      await connection.removeTransaction(dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(0)
    })
  })

  describe('removeTransactions', () => {
    it('should be a function', () => {
      expect(connection.removeTransactions).toBeFunction()
    })

    it('should remove the specified transactions from the pool', async () => {
      await connection.addTransaction(dummy1)
      await connection.addTransaction(dummy2)

      await expect(connection.getPoolSize()).resolves.toBe(2)

      await connection.removeTransactions([dummy1, dummy2])

      await expect(connection.getPoolSize()).resolves.toBe(0)
    })
  })

  describe('transactionExists', () => {
    it('should be a function', () => {
      expect(connection.transactionExists).toBeFunction()
    })

    it('should return true if transaction is IN pool', async () => {
      const trx1 = new Transaction(dummy1)
      const trx2 = new Transaction(dummy1)
      await connection.addTransactions([trx1, trx2])

      await delay(500)

      const res1 = await connection.transactionExists(trx1.id)
      expect(res1).toBe(true)

      const res2 = await connection.transactionExists(trx2.id)
      expect(res2).toBe(true)
    })

   it('should return false if transaction is NOT pool', async () => {
      const trx1 = new Transaction(dummy1)
      const trx2 = new Transaction(dummy1)

      const res1 = await connection.transactionExists(trx1.id)
      expect(res1).toBe(false)

      const res2 = await connection.transactionExists(trx2.id)
      expect(res2).toBe(false)
    })
  })

  describe('hasExceededMaxTransactions', () => {
    it('should be a function', () => {
      expect(connection.hasExceededMaxTransactions).toBeFunction()
    })

    it('should be truthy if exceeded', async () => {
      for (let i = 0; i < 101; i++) {
        await connection.addTransaction(dummy1)
      }

      await connection.addTransaction(dummy1)

      await expect(connection.hasExceededMaxTransactions(dummy1)).resolves.toBeTruthy()
    })

    it('should be falsy if not exceeded', async () => {
      await connection.addTransaction(dummy1)

      await expect(connection.hasExceededMaxTransactions(dummy1)).resolves.toBeFalsy()
    })

    it('should be allowed to exceed if whitelisted', async () => {
      await connection.flush()
      connection.options.whitelist = ['03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357', 'ghjk']
      for (let i = 0; i < 104; i++) {
        await connection.addTransaction(dummy1)
      }
      await expect(connection.getPoolSize()).resolves.toBe(104)
      await expect(connection.hasExceededMaxTransactions(dummy1)).resolves.toBeFalsy()
    })
  })

  describe('getTransaction', () => {
    it('should be a function', () => {
      expect(connection.getTransaction).toBeFunction()
    })

    it('should return the specified transaction', async () => {
      await connection.addTransaction(dummy1)

      const poolTransaction = await connection.getTransaction(dummy1.id)
      await expect(poolTransaction).toBeObject()
      await expect(poolTransaction.id).toBe(dummy1.id)
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(connection.getTransactions).toBeFunction()
    })

    it('should return transactions within the specified range', async () => {
      await connection.addTransaction(dummy1)
      await connection.addTransaction(dummy2)

      let transactions = await connection.getTransactions(0, 1)
      transactions = transactions.map(serializedTx => Transaction.fromBytes(serializedTx))

      await expect(transactions[0]).toBeObject()
      await expect(transactions[0].id).toBe(dummy1.id)
    })
  })

  describe('getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(connection.getTransactionsForForging).toBeFunction()
    })

    it('should return an array of transactions', async () => {
      await connection.addTransaction(dummy1)
      await connection.addTransaction(dummy2)
      await connection.addTransaction(dummy1)
      await connection.addTransaction(dummy2)
      await connection.addTransaction(dummy2)
      await connection.addTransaction(dummy1)

      let transactions = await connection.getTransactionsForForging(0, 6)
      transactions = transactions.map(serializedTx => Transaction.fromBytes(serializedTx))

      await expect(transactions[0]).toBeObject()
      await expect(transactions[0].id).toBe(dummy1.id)
      await expect(transactions[1].id).toBe(dummy2.id)
      await expect(transactions[2].id).toBe(dummy1.id)
      await expect(transactions[3].id).toBe(dummy2.id)
      await expect(transactions[4].id).toBe(dummy2.id)
      await expect(transactions[5].id).toBe(dummy1.id)
    })
  })

  describe('flush', () => {
    it('should be a function', () => {
      expect(connection.flush).toBeFunction()
    })

    it('should flush the pool', async () => {
      await connection.addTransaction(dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(1)

      await connection.flush()

      await expect(connection.getPoolSize()).resolves.toBe(0)
    })
  })

  describe('__isReady', () => {
    it('should be a function', () => {
      expect(connection.__isReady).toBeFunction()
    })

    it('should be truthy if connected', async () => {
      expect(connection.__isReady()).toBeTruthy()
    })
  })
})
