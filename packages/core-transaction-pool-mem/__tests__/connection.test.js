'use strict'

const app = require('./__support__/setup')
const delay = require('delay')
const mockData = require('./__fixtures__/transactions')
const { Transaction } = require('@arkecosystem/crypto').models
const defaultConfig = require('../lib/defaults')

let connection

beforeAll(async () => {
  await app.setUp()

  const Connection = require('../lib/connection.js')
  connection = new Connection(defaultConfig)
  connection = await connection.make()
  // 100+ years in the future to avoid our hardcoded transactions used in these
  // tests to expire
  connection.options.maxTransactionAge = 4036608000
})

afterAll(async () => {
  await app.tearDown()
})

afterEach(async () => {
  await connection.flush()
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

      await connection.addTransaction(mockData.dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(1)

      await connection.addTransaction(mockData.dummy2)

      await expect(connection.getPoolSize()).resolves.toBe(2)
    })
  })

  describe('getSenderSize', () => {
    it('should be a function', () => {
      expect(connection.getSenderSize).toBeFunction()
    })

    it('should return 0 if no transactions were added', async () => {
      await expect(connection.getSenderSize('undefined')).resolves.toBe(0)
    })

    it('should return 2 if transactions were added', async () => {
      const senderPublicKey = mockData.dummy1.senderPublicKey

      await expect(connection.getSenderSize(senderPublicKey)).resolves.toBe(0)

      await connection.addTransaction(mockData.dummy1)

      await expect(connection.getSenderSize(senderPublicKey)).resolves.toBe(1)

      await connection.addTransaction(mockData.dummy2)

      await expect(connection.getSenderSize(senderPublicKey)).resolves.toBe(2)
    })
  })

  describe('addTransaction', () => {
    it('should be a function', () => {
      expect(connection.addTransaction).toBeFunction()
    })

    it('should add the transaction to the pool', async () => {
      await expect(connection.getPoolSize()).resolves.toBe(0)

      await connection.addTransaction(mockData.dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(1)
    })
  })

  describe('addTransactions', () => {
    it('should be a function', () => {
      expect(connection.addTransactions).toBeFunction()
    })

    it('should add the transactions to the pool', async () => {
      await expect(connection.getPoolSize()).resolves.toBe(0)

      await connection.addTransactions([mockData.dummy1, mockData.dummy2])

      await expect(connection.getPoolSize()).resolves.toBe(2)
    })
  })

  describe('addTransactions with expiration', () => {
    it('should add the transactions to the pool and they should expire', async () => {
      await expect(connection.getPoolSize()).resolves.toBe(0)

      await connection.addTransactions([mockData.dummyExp1, mockData.dummyExp2])

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
      await connection.addTransaction(mockData.dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(1)

      await connection.removeTransaction(mockData.dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(0)
    })
  })

  describe('removeTransactionById', () => {
    it('should be a function', () => {
      expect(connection.removeTransactionById).toBeFunction()
    })

    it('should remove the specified transaction from the pool (by id)', async () => {
      await connection.addTransaction(mockData.dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(1)

      await connection.removeTransactionById(mockData.dummy1.id)

      await expect(connection.getPoolSize()).resolves.toBe(0)
    })
  })

  describe('removeTransactions', () => {
    it('should be a function', () => {
      expect(connection.removeTransactions).toBeFunction()
    })

    it('should remove the specified transactions from the pool', async () => {
      await connection.addTransaction(mockData.dummy1)
      await connection.addTransaction(mockData.dummy2)

      await expect(connection.getPoolSize()).resolves.toBe(2)

      await connection.removeTransactions([mockData.dummy1, mockData.dummy2])

      await expect(connection.getPoolSize()).resolves.toBe(0)
    })
  })

  describe('removeTransactionsForSender', () => {
    it('should be a function', () => {
      expect(connection.removeTransactionsForSender).toBeFunction()
    })

    it('should remove the senders transactions from the pool', async () => {
      await connection.addTransaction(mockData.dummy1)
      await connection.addTransaction(mockData.dummy2)
      await connection.addTransaction(mockData.dummy3)
      await connection.addTransaction(mockData.dummy4)
      await connection.addTransaction(mockData.dummy5)
      await connection.addTransaction(mockData.dummy6)
      await connection.addTransaction(mockData.dummy10)

      await expect(connection.getPoolSize()).resolves.toBe(7)

      await connection.removeTransactionsForSender(mockData.dummy1.senderPublicKey)

      await expect(connection.getPoolSize()).resolves.toBe(1)
    })
  })

  describe('transactionExists', () => {
    it('should be a function', () => {
      expect(connection.transactionExists).toBeFunction()
    })

    it('should return true if transaction is IN pool', async () => {
      await connection.addTransactions([mockData.dummy1, mockData.dummy2])

      const res1 = await connection.transactionExists(mockData.dummy1.id)
      expect(res1).toBe(true)

      const res2 = await connection.transactionExists(mockData.dummy2.id)
      expect(res2).toBe(true)
    })

   it('should return false if transaction is NOT pool', async () => {
      const res1 = await connection.transactionExists(mockData.dummy1.id)
      expect(res1).toBe(false)

      const res2 = await connection.transactionExists(mockData.dummy2.id)
      expect(res2).toBe(false)
    })
  })

  describe('hasExceededMaxTransactions', () => {
    it('should be a function', () => {
      expect(connection.hasExceededMaxTransactions).toBeFunction()
    })

    it('should be truthy if exceeded', async () => {
      connection.options.maxTransactionsPerSender = 5
      connection.options.allowedSenders = []
      await connection.addTransaction(mockData.dummy3)
      await connection.addTransaction(mockData.dummy4)
      await connection.addTransaction(mockData.dummy5)
      await connection.addTransaction(mockData.dummy6)
      await connection.addTransaction(mockData.dummy7)
      await connection.addTransaction(mockData.dummy8)
      await connection.addTransaction(mockData.dummy9)

      await expect(connection.getPoolSize()).resolves.toBe(7)
      const exceeded = await connection.hasExceededMaxTransactions(mockData.dummy3)
      await expect(exceeded).toBeTruthy()
    })

    it('should be falsy if not exceeded', async () => {
      connection.options.maxTransactionsPerSender = 7
      connection.options.allowedSenders = []

      await connection.addTransaction(mockData.dummy4)
      await connection.addTransaction(mockData.dummy5)
      await connection.addTransaction(mockData.dummy6)

      await expect(connection.getPoolSize()).resolves.toBe(3)
      const exceeded = await connection.hasExceededMaxTransactions(mockData.dummy3)
      await expect(exceeded).toBeFalsy()
    })

    it('should be allowed to exceed if whitelisted', async () => {
      await connection.flush()
      connection.options.maxTransactionsPerSender = 5
      connection.options.allowedSenders = ['03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357', 'ghjk']
      await connection.addTransaction(mockData.dummy3)
      await connection.addTransaction(mockData.dummy4)
      await connection.addTransaction(mockData.dummy5)
      await connection.addTransaction(mockData.dummy6)
      await connection.addTransaction(mockData.dummy7)
      await connection.addTransaction(mockData.dummy8)
      await connection.addTransaction(mockData.dummy9)

      await expect(connection.getPoolSize()).resolves.toBe(7)
      const exceeded = await connection.hasExceededMaxTransactions(mockData.dummy3)
      await expect(exceeded).toBeFalsy()
    })
  })

  describe('getTransaction', () => {
    it('should be a function', () => {
      expect(connection.getTransaction).toBeFunction()
    })

    it('should return the specified transaction', async () => {
      await connection.addTransaction(mockData.dummy1)

      const poolTransaction = await connection.getTransaction(mockData.dummy1.id)
      await expect(poolTransaction).toBeObject()
      await expect(poolTransaction.id).toBe(mockData.dummy1.id)
    })

    it('should return undefined for nonexisting transaction', async () => {
      const poolTransaction = await connection.getTransaction('non existing id')
      await expect(poolTransaction).toBeFalsy()
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(connection.getTransactions).toBeFunction()
    })

    it('should return transactions within the specified range', async () => {
      await connection.addTransaction(mockData.dummy1)
      await connection.addTransaction(mockData.dummy2)

      let transactions = await connection.getTransactions(0, 1)
      transactions = transactions.map(serializedTx => Transaction.fromBytes(serializedTx))

      await expect(transactions[0]).toBeObject()
      await expect(transactions[0].id).toBe(mockData.dummy1.id)
    })
  })

  describe('getTransactionIdsForForging', () => {
    it('should be a function', () => {
      expect(connection.getTransactionIdsForForging).toBeFunction()
    })

    it('should return an array of transactions ids', async () => {
      await connection.addTransaction(mockData.dummy1)
      await connection.addTransaction(mockData.dummy2)
      await connection.addTransaction(mockData.dummy3)
      await connection.addTransaction(mockData.dummy4)
      await connection.addTransaction(mockData.dummy5)
      await connection.addTransaction(mockData.dummy6)

      let transactionIds = await connection.getTransactionIdsForForging(0, 6)

      await expect(transactionIds).toBeArray()
      await expect(transactionIds[0]).toBe(mockData.dummy1.id)
      await expect(transactionIds[1]).toBe(mockData.dummy2.id)
      await expect(transactionIds[2]).toBe(mockData.dummy3.id)
      await expect(transactionIds[3]).toBe(mockData.dummy4.id)
      await expect(transactionIds[4]).toBe(mockData.dummy5.id)
      await expect(transactionIds[5]).toBe(mockData.dummy6.id)
    })
  })

  describe('getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(connection.getTransactionsForForging).toBeFunction()
    })

    it('should return an array of transactions', async () => {
      await connection.addTransaction(mockData.dummy1)
      await connection.addTransaction(mockData.dummy2)
      await connection.addTransaction(mockData.dummy3)
      await connection.addTransaction(mockData.dummy4)
      await connection.addTransaction(mockData.dummy5)
      await connection.addTransaction(mockData.dummy6)

      let transactions = await connection.getTransactionsForForging(0, 6)
      expect(transactions).toBeArray()
      expect(transactions.length).toBe(6)
      transactions = transactions.map(serializedTx => Transaction.fromBytes(serializedTx))

      expect(transactions[0]).toBeObject()
      expect(transactions[0].id).toBe(mockData.dummy1.id)
      expect(transactions[1].id).toBe(mockData.dummy2.id)
      expect(transactions[2].id).toBe(mockData.dummy3.id)
      expect(transactions[3].id).toBe(mockData.dummy4.id)
      expect(transactions[4].id).toBe(mockData.dummy5.id)
      expect(transactions[5].id).toBe(mockData.dummy6.id)
    })
  })

  describe('removeForgedAndGetPending', () => {
    it('should be a function', () => {
      expect(connection.removeForgedAndGetPending).toBeFunction()
    })
  })

  describe('flush', () => {
    it('should be a function', () => {
      expect(connection.flush).toBeFunction()
    })

    it('should flush the pool', async () => {
      await connection.addTransaction(mockData.dummy1)

      await expect(connection.getPoolSize()).resolves.toBe(1)

      await connection.flush()

      await expect(connection.getPoolSize()).resolves.toBe(0)
    })
  })

  describe('stress', () => {
    it('multiple additions and retrievals', async () => {
      // Abstract number which decides how many iterations are run by the test.
      // Increase it to run more iterations.
      const testSize = 128

      const fakeTransactionId = function (i) {
        return 'id' + String(i) + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      }

      for (let i = 0; i < testSize; i++) {
        let transaction = new Transaction(mockData.dummy1)
        transaction.id = fakeTransactionId(i)
        await connection.addTransaction(transaction)

        if (i % 27 === 0) {
          await connection.removeTransaction(transaction)
        }
      }

      for (let i = 0; i < testSize * 2; i++) {
        await connection.getPoolSize()
        for (const sender of ['nonexistent', mockData.dummy1.senderPublicKey]) {
          await connection.getSenderSize(sender)
          await connection.hasExceededMaxTransactions(sender)
        }
        await connection.getTransaction(fakeTransactionId(i))
        await connection.getTransactions(0, i)
      }

      for (let i = 0; i < testSize; i++) {
        let transaction = new Transaction(mockData.dummy1)
        transaction.id = fakeTransactionId(i)
        await connection.removeTransaction(transaction)
      }
    })
  })
})
