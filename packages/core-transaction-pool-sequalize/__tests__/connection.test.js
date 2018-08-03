'use strict'

const delay = require('delay')

const app = require('./__support__/setup')
const mockData = require('./__fixtures__/transactions')
const { Transaction } = require('@arkecosystem/crypto').models
const defaultConfig = require('../lib/defaults')

let connection

beforeAll(async () => {
  await app.setUp()

  const SequalizeConnection = require('../lib/connection.js')
  connection = new SequalizeConnection(defaultConfig)
  connection = await connection.make()
})

afterAll(async () => {
  await app.tearDown()
})

afterEach(async () => {
  await connection.pool.model.destroy({ truncate: true })
})

describe('Connection', () => {
  it('should be an object', () => {
    expect(connection).toBeObject()
  })

  describe('getPoolSize', () => {
    it('should be a function', () => {
      expect(connection.getPoolSize).toBeFunction()
    })

    it('should count 0 transactions in the pool', async () => {
      await expect(connection.getPoolSize()).resolves.toEqual(0)
    })

    it('should count 1 transaction in the pool', async () => {
      await connection.addTransaction(mockData.dummy1)
      await expect(connection.getPoolSize()).resolves.toEqual(1)
    })

    it('should count 2 transactions in the pool', async () => {
      await connection.addTransaction(mockData.dummy1)
      await connection.addTransaction(mockData.dummy2)
      await expect(connection.getPoolSize()).resolves.toEqual(2)
    })
  })

  describe('addTransaction', () => {
    it('should not add transaction that is already in the pool', async () => {
      await connection.addTransaction(mockData.dummy1)
      await connection.addTransaction(mockData.dummy1)
      await expect(connection.getPoolSize()).resolves.toEqual(1)
    })

    it('should not add an invalid object to the pool', async () => {
      await connection.addTransaction({'derp': 'invalid object'})
      await expect(connection.getPoolSize()).resolves.toEqual(0)
    })
  })

  describe('getTransaction', () => {
    it('should get a transaction from the pool', async () => {
      await connection.addTransaction(mockData.dummy1)
      let result = await connection.getTransaction(mockData.dummy1.id)
      expect(result).toBeInstanceOf(Transaction)
      expect(result.id).toEqual(mockData.dummy1.id)
    })

    it('should return nothing when fetching a transaction that does not exist', async () => {
      let result = await connection.getTransaction(mockData.dummy1.id)
      expect(result).toEqual(undefined)
    })
  })

  describe('getTransactions', () => {
    it('should get multiple transaction from the pool', async () => {
      await connection.addTransaction(mockData.dummy1)
      await connection.addTransaction(mockData.dummy2)
      await connection.addTransaction(mockData.dummy3)
      const transactionIds = [mockData.dummy1.id, mockData.dummy2.id, mockData.dummy3]
      const results = await connection.getTransactions(0, 2)
      expect(results.length).toEqual(2)
      expect(
        results.map(transaction => transaction.id)
      ).not.toEqual(expect.arrayContaining(transactionIds))
    })
  })

  describe('getTransactionsIds', () => {
    it('should get transaction ids', async () => {
      const transactions = [mockData.dummy1, mockData.dummy2, mockData.dummy3, mockData.dummy4]
      await connection.addTransactions(transactions)
      const result = await connection.getTransactionsIds(0, 2)
      expect(result.length).toEqual(2)
      expect(result).toEqual(expect.arrayContaining([mockData.dummy1.id, mockData.dummy2.id]))
    })
  })

  describe('addTransactions', () => {
    it('should add multiple transactions and handle dups', async () => {
      let result = await connection.getPoolSize()
      expect(result).toEqual(0)
      const transactions = [mockData.dummy1, mockData.dummy2, mockData.dummy3, mockData.dummy3]
      await connection.addTransactions(transactions)
      await expect(connection.getPoolSize()).resolves.toEqual(3)
    })

    it('should add multiple transactions', async () => {
      await expect(connection.getPoolSize()).resolves.toEqual(0)
      const transactions = [mockData.dummy1, mockData.dummy2, mockData.dummy3]
      await connection.addTransactions(transactions)
      await expect(connection.getPoolSize()).resolves.toEqual(3)
    })
  })

  describe('removeTransaction', () => {
    it('should remove transaction from the pool', async () => {
      await connection.addTransaction(mockData.dummy1)
      await expect(connection.getPoolSize()).resolves.toEqual(1)
      await connection.removeTransaction(mockData.dummy1)
      await expect(connection.getPoolSize()).resolves.toEqual(0)
    })

    it('should return 0 when deleting a transaction that does not exist in the pool', async () => {
      const result = await connection.removeTransaction(mockData.dummy1)
      expect(result).toEqual(0)
    })
  })

  describe('removeTransactions', () => {
    it('should remove all transactions passed to the function', async () => {
      await connection.addTransactions([mockData.dummy1, mockData.dummy2, mockData.dummy3])
      await expect(connection.getPoolSize()).resolves.toEqual(3)
      await connection.removeTransactions([mockData.dummy1, mockData.dummy2])
      await expect(connection.getPoolSize()).resolves.toEqual(1)
    })
  })

  describe('removeTransactionById', () => {
    it('should remove transactions containing a given id', async () => {
      await connection.addTransactions([mockData.dummy1, mockData.dummy2, mockData.dummy3])
      await expect(connection.getPoolSize()).resolves.toEqual(3)
      await connection.removeTransactionById(mockData.dummy1.id)
      await expect(connection.getPoolSize()).resolves.toEqual(2)
    })
  })

  describe('removeTransactionsForSender', () => {
    it('should remove transactions from a given sender', async () => {
      await connection.addTransactions([mockData.dummy1, mockData.dummy2, mockData.dummy10])
      await expect(connection.getPoolSize()).resolves.toEqual(3)
      await connection.removeTransactionsForSender(mockData.dummy1.senderPublicKey)
      await expect(connection.getPoolSize()).resolves.toEqual(1)
    })
  })

  describe('hasExceededMaxTransactions', () => {
    it('should be falsy if not exceeded', async () => {
      await connection.addTransactions([mockData.dummy1, mockData.dummy2])
      const hasExceeded = await connection.hasExceededMaxTransactions(mockData.dummy1)
      expect(hasExceeded).toBeFalsy()
    })

    it('should be truthy if exceeded', async () => {
      connection.options.maxTransactionsPerSender = 5
      connection.options.allowedSenders = []
      await connection.addTransactions([
        mockData.dummy3, mockData.dummy4, mockData.dummy5, mockData.dummy6, mockData.dummy7,
        mockData.dummy8, mockData.dummy9
      ])
      await expect(connection.getPoolSize()).resolves.toEqual(7)
      const hasExceeded = await connection.hasExceededMaxTransactions(mockData.dummy3)
      await expect(hasExceeded).toBeTruthy()
    })

    it('should be allowed to exceed if whitelisted', async () => {
      connection.options.maxTransactionsPerSender = 5
      connection.options.allowedSenders = [mockData.dummy3.senderPublicKey]
      await connection.addTransactions([
        mockData.dummy3, mockData.dummy4, mockData.dummy5, mockData.dummy6, mockData.dummy7,
        mockData.dummy8, mockData.dummy9
      ])
      await expect(connection.getPoolSize()).resolves.toEqual(7)
      const hasExceeded = await connection.hasExceededMaxTransactions(mockData.dummy3)
      await expect(hasExceeded).toBeFalsy()
    })
  })

  describe('getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(connection.getTransactionsForForging).toBeFunction()
    })

    it('should return an array of transactions', async () => {
      await connection.addTransactions([
        mockData.dummy1, mockData.dummy2, mockData.dummy3, mockData.dummy4, mockData.dummy5,
        mockData.dummy6
      ])

      await expect(connection.getPoolSize()).resolves.toEqual(6)

      let transactions = await connection.getTransactionsForForging(0, 6)
      transactions = transactions.map(serializedTx => Transaction.fromBytes(serializedTx))

      await expect(transactions[0]).toBeObject()
      await expect(transactions[0].id).toEqual(mockData.dummy1.id)
      await expect(transactions[1].id).toEqual(mockData.dummy2.id)
      await expect(transactions[2].id).toEqual(mockData.dummy3.id)
      await expect(transactions[3].id).toEqual(mockData.dummy4.id)
      await expect(transactions[4].id).toEqual(mockData.dummy5.id)
      await expect(transactions[5].id).toEqual(mockData.dummy6.id)
    })
  })

  describe('addTransactions with expiration', () => {
    it('should add the transactions to the pool and they should expire', async () => {
      await connection.addTransactions([mockData.dummyExp1, mockData.dummyExp2])
      await expect(connection.getPoolSize()).resolves.toBe(2)
      await delay(7000)
      await expect(connection.getPoolSize()).resolves.toBe(0)
    })
  })
})
