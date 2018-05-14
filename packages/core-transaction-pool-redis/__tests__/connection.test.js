'use strict'

const app = require('./__support__/setup')
const delay = require('delay')
const { dummy1, dummy2, dummyExp1, dummyExp2 } = require('./__fixtures__/transactions')
const { Transaction } = require('@arkecosystem/client').models

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
  it('should be an object', async () => {
    await expect(connection).toBeObject()
  })

  describe('getPoolSize', async () => {
    it('should be a function', async () => {
      await expect(connection.getPoolSize).toBeFunction()
    })

    it('should return 0 if no transactions were added', async () => {
      await expect(await connection.getPoolSize()).toBe(0)
    })

    it('should return 2 if transactions were added', async () => {
      await expect(await connection.getPoolSize()).toBe(0)

      await connection.addTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(1)
    })
  })

  describe('addTransaction', async () => {
    it('should be a function', async () => {
      await expect(connection.addTransaction).toBeFunction()
    })

    it('should add the transaction to the pool', async () => {
      await expect(await connection.getPoolSize()).toBe(0)

      await connection.addTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(1)
    })
  })

  describe('addTransactions with expiration', async () => {
    it('should add the transactions to the pool and they should expire', async () => {
      await expect(await connection.getPoolSize()).toBe(0)

      const trx1 = new Transaction(dummyExp1)
      const trx2 = new Transaction(dummyExp2)

      connection.addTransactions = jest.fn(async (transactions) => {
        for (let i = 0; i < transactions.length; i++) {
          await connection.addTransaction(transactions[i])
        }
      })

      await connection.addTransactions([trx1, trx2])

      await expect(await connection.getPoolSize()).toBe(2)
      await delay(7000)
      await expect(await connection.getPoolSize()).toBe(0)
    })
  })

  describe('addTransactions', async () => {
    it('should be a function', async () => {
      await expect(connection.addTransactions).toBeFunction()
    })

    it('should add the transactions to the pool', async () => {
      await expect(await connection.getPoolSize()).toBe(0)

      connection.addTransactions = jest.fn(async (transactions) => {
        for (let i = 0; i < transactions.length; i++) {
          await connection.addTransaction(transactions[i])
        }
      })

      await connection.addTransactions([dummy1, dummy2])

      await expect(await connection.getPoolSize()).toBe(2)
    })
  })

  describe('removeTransaction', async () => {
    it('should be a function', async () => {
      await expect(connection.removeTransaction).toBeFunction()
    })

    it('should remove the specified transaction from the pool', async () => {
      await connection.addTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(1)

      await connection.removeTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(0)
    })
  })

  describe('removeTransactions', async () => {
    it('should be a function', async () => {
      await expect(connection.removeTransactions).toBeFunction()
    })

    it('should remove the specified transactions from the pool', async () => {
      await connection.addTransaction(dummy1)
      await connection.addTransaction(dummy2)

      await expect(await connection.getPoolSize()).toBe(2)

      await connection.removeTransactions([dummy1, dummy2])

      await expect(await connection.getPoolSize()).toBe(0)
    })
  })

  describe('hasExceededMaxTransactions', async () => {
    it('should be a function', async () => {
      await expect(connection.hasExceededMaxTransactions).toBeFunction()
    })

    it('should be truthy if exceeded', async () => {
      for (let i = 0; i < 101; i++) {
        await connection.addTransaction(dummy1)
      }

      await connection.addTransaction(dummy1)

      await expect(await connection.hasExceededMaxTransactions(dummy1)).toBeTruthy()
    })

    it('should be falsy if not exceeded', async () => {
      await connection.addTransaction(dummy1)

      await expect(await connection.hasExceededMaxTransactions(dummy1)).toBeFalsy()
    })
  })

  describe('getPublicKeyById', async () => {
    it('should be a function', async () => {
      await expect(connection.getPublicKeyById).toBeFunction()
    })

    it('should return the sender public key', async () => {
      await connection.addTransaction(dummy1)

      await expect(await connection.getPublicKeyById(dummy1.id)).toBe(dummy1.senderPublicKey)
    })
  })

  describe('getTransaction', async () => {
    it('should be a function', async () => {
      await expect(connection.getTransaction).toBeFunction()
    })

    it('should return the specified transaction', async () => {
      await connection.addTransaction(dummy1)

      const poolTransaction = await connection.getTransaction(dummy1.id)
      await expect(poolTransaction).toBeObject()
      await expect(poolTransaction.id).toBe(dummy1.id)
    })
  })

  describe('getTransactions', async () => {
    it('should be a function', async () => {
      await expect(connection.getTransactions).toBeFunction()
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

  describe('getTransactionsForForging', async () => {
    it('should be a function', async () => {
      await expect(connection.getTransactionsForForging).toBeFunction()
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

  describe('flush', async () => {
    it('should be a function', async () => {
      await expect(connection.flush).toBeFunction()
    })

    it('should flush the pool', async () => {
      await connection.addTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(1)

      await connection.flush()

      await expect(await connection.getPoolSize()).toBe(0)
    })
  })

  describe('__isReady', async () => {
    it('should be a function', async () => {
      await expect(connection.__isReady).toBeFunction()
    })

    it('should be truthy if connected', async () => {
      await expect(await connection.__isReady()).toBeTruthy()
    })
  })
})
