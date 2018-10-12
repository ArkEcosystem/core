'use strict'

const app = require('./__support__/setup')
const defaultConfig = require('../lib/defaults')
const delay = require('delay')
const delegatesSecrets = require('@arkecosystem/core-test-utils/fixtures/testnet/passphrases')
const generateTransfer = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const mockData = require('./__fixtures__/transactions')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const { Transaction } = require('@arkecosystem/crypto').models

let connection

beforeAll(async () => {
  await app.setUp()

  const Connection = require('../lib/connection.js')
  connection = new Connection(defaultConfig)
  connection = connection.make()
  // 100+ years in the future to avoid our hardcoded transactions used in these
  // tests to expire
  connection.options.maxTransactionAge = 4036608000
})

afterAll(async () => {
  await connection.disconnect()
  await app.tearDown()
})

afterEach(() => {
  connection.flush()
})

describe('Connection', () => {
  it('should be an object', () => {
    expect(connection).toBeObject()
  })

  describe('getPoolSize', () => {
    it('should be a function', () => {
      expect(connection.getPoolSize).toBeFunction()
    })

    it('should return 0 if no transactions were added', () => {
      expect(connection.getPoolSize()).toBe(0)
    })

    it('should return 2 if transactions were added', () => {
      expect(connection.getPoolSize()).toBe(0)

      connection.addTransaction(mockData.dummy1)

      expect(connection.getPoolSize()).toBe(1)

      connection.addTransaction(mockData.dummy2)

      expect(connection.getPoolSize()).toBe(2)
    })
  })

  describe('getSenderSize', () => {
    it('should be a function', () => {
      expect(connection.getSenderSize).toBeFunction()
    })

    it('should return 0 if no transactions were added', () => {
      expect(connection.getSenderSize('undefined')).toBe(0)
    })

    it('should return 2 if transactions were added', () => {
      const senderPublicKey = mockData.dummy1.senderPublicKey

      expect(connection.getSenderSize(senderPublicKey)).toBe(0)

      connection.addTransaction(mockData.dummy1)

      expect(connection.getSenderSize(senderPublicKey)).toBe(1)

      connection.addTransaction(mockData.dummy2)

      expect(connection.getSenderSize(senderPublicKey)).toBe(2)
    })
  })

  describe('addTransaction', () => {
    it('should be a function', () => {
      expect(connection.addTransaction).toBeFunction()
    })

    it('should add the transaction to the pool', () => {
      expect(connection.getPoolSize()).toBe(0)

      connection.addTransaction(mockData.dummy1)

      expect(connection.getPoolSize()).toBe(1)
    })
  })

  describe('addTransactions', () => {
    it('should be a function', () => {
      expect(connection.addTransactions).toBeFunction()
    })

    it('should add the transactions to the pool', () => {
      expect(connection.getPoolSize()).toBe(0)

      connection.addTransactions([mockData.dummy1, mockData.dummy2])

      expect(connection.getPoolSize()).toBe(2)
    })
  })

  describe('addTransactions with expiration', () => {
    it('should add the transactions to the pool and they should expire', async () => {
      expect(connection.getPoolSize()).toBe(0)

      connection.addTransactions([mockData.dummyExp1, mockData.dummyExp2])

      expect(connection.getPoolSize()).toBe(2)
      await delay(7000)
      expect(connection.getPoolSize()).toBe(0)
    })
  })

  describe('removeTransaction', () => {
    it('should be a function', () => {
      expect(connection.removeTransaction).toBeFunction()
    })

    it('should remove the specified transaction from the pool', () => {
      connection.addTransaction(mockData.dummy1)

      expect(connection.getPoolSize()).toBe(1)

      connection.removeTransaction(mockData.dummy1)

      expect(connection.getPoolSize()).toBe(0)
    })
  })

  describe('removeTransactionById', () => {
    it('should be a function', () => {
      expect(connection.removeTransactionById).toBeFunction()
    })

    it('should remove the specified transaction from the pool (by id)', () => {
      connection.addTransaction(mockData.dummy1)

      expect(connection.getPoolSize()).toBe(1)

      connection.removeTransactionById(mockData.dummy1.id)

      expect(connection.getPoolSize()).toBe(0)
    })

    it('should do nothing when asked to delete a non-existent transaction', () => {
      connection.addTransaction(mockData.dummy1)

      connection.removeTransactionById('nonexistenttransactionid')

      expect(connection.getPoolSize()).toBe(1)
    })
  })

  describe('removeTransactions', () => {
    it('should be a function', () => {
      expect(connection.removeTransactions).toBeFunction()
    })

    it('should remove the specified transactions from the pool', () => {
      connection.addTransaction(mockData.dummy1)
      connection.addTransaction(mockData.dummy2)

      expect(connection.getPoolSize()).toBe(2)

      connection.removeTransactions([mockData.dummy1, mockData.dummy2])

      expect(connection.getPoolSize()).toBe(0)
    })
  })

  describe('removeTransactionsForSender', () => {
    it('should be a function', () => {
      expect(connection.removeTransactionsForSender).toBeFunction()
    })

    it('should remove the senders transactions from the pool', () => {
      connection.addTransaction(mockData.dummy1)
      connection.addTransaction(mockData.dummy2)
      connection.addTransaction(mockData.dummy3)
      connection.addTransaction(mockData.dummy4)
      connection.addTransaction(mockData.dummy5)
      connection.addTransaction(mockData.dummy6)
      connection.addTransaction(mockData.dummy10)

      expect(connection.getPoolSize()).toBe(7)

      connection.removeTransactionsForSender(mockData.dummy1.senderPublicKey)

      expect(connection.getPoolSize()).toBe(1)
    })
  })

  describe('transactionExists', () => {
    it('should be a function', () => {
      expect(connection.transactionExists).toBeFunction()
    })

    it('should return true if transaction is IN pool', () => {
      connection.addTransactions([mockData.dummy1, mockData.dummy2])

      const res1 = connection.transactionExists(mockData.dummy1.id)
      expect(res1).toBe(true)

      const res2 = connection.transactionExists(mockData.dummy2.id)
      expect(res2).toBe(true)
    })

   it('should return false if transaction is NOT pool', () => {
      const res1 = connection.transactionExists(mockData.dummy1.id)
      expect(res1).toBe(false)

      const res2 = connection.transactionExists(mockData.dummy2.id)
      expect(res2).toBe(false)
    })
  })

  describe('hasExceededMaxTransactions', () => {
    it('should be a function', () => {
      expect(connection.hasExceededMaxTransactions).toBeFunction()
    })

    it('should be truthy if exceeded', () => {
      connection.options.maxTransactionsPerSender = 5
      connection.options.allowedSenders = []
      connection.addTransaction(mockData.dummy3)
      connection.addTransaction(mockData.dummy4)
      connection.addTransaction(mockData.dummy5)
      connection.addTransaction(mockData.dummy6)
      connection.addTransaction(mockData.dummy7)
      connection.addTransaction(mockData.dummy8)
      connection.addTransaction(mockData.dummy9)

      expect(connection.getPoolSize()).toBe(7)
      const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3)
      expect(exceeded).toBeTruthy()
    })

    it('should be falsy if not exceeded', () => {
      connection.options.maxTransactionsPerSender = 7
      connection.options.allowedSenders = []

      connection.addTransaction(mockData.dummy4)
      connection.addTransaction(mockData.dummy5)
      connection.addTransaction(mockData.dummy6)

      expect(connection.getPoolSize()).toBe(3)
      const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3)
      expect(exceeded).toBeFalsy()
    })

    it('should be allowed to exceed if whitelisted', () => {
      connection.flush()
      connection.options.maxTransactionsPerSender = 5
      connection.options.allowedSenders = ['03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357', 'ghjk']
      connection.addTransaction(mockData.dummy3)
      connection.addTransaction(mockData.dummy4)
      connection.addTransaction(mockData.dummy5)
      connection.addTransaction(mockData.dummy6)
      connection.addTransaction(mockData.dummy7)
      connection.addTransaction(mockData.dummy8)
      connection.addTransaction(mockData.dummy9)

      expect(connection.getPoolSize()).toBe(7)
      const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3)
      expect(exceeded).toBeFalsy()
    })
  })

  describe('getTransaction', () => {
    it('should be a function', () => {
      expect(connection.getTransaction).toBeFunction()
    })

    it('should return the specified transaction', () => {
      connection.addTransaction(mockData.dummy1)

      const poolTransaction = connection.getTransaction(mockData.dummy1.id)
      expect(poolTransaction).toBeObject()
      expect(poolTransaction.id).toBe(mockData.dummy1.id)
    })

    it('should return undefined for nonexisting transaction', () => {
      const poolTransaction = connection.getTransaction('non existing id')
      expect(poolTransaction).toBeFalsy()
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(connection.getTransactions).toBeFunction()
    })

    it('should return transactions within the specified range', () => {
      connection.addTransaction(mockData.dummy1)
      connection.addTransaction(mockData.dummy2)

      let transactions = connection.getTransactions(0, 1)
      transactions = transactions.map(serializedTx => Transaction.fromBytes(serializedTx))

      expect(transactions[0]).toBeObject()
      expect(transactions[0].id).toBe(mockData.dummy1.id)
    })
  })

  describe('getTransactionIdsForForging', () => {
    it('should be a function', () => {
      expect(connection.getTransactionIdsForForging).toBeFunction()
    })

    it('should return an array of transactions ids', async () => {
      connection.addTransaction(mockData.dummy1)
      connection.addTransaction(mockData.dummy2)
      connection.addTransaction(mockData.dummy3)
      connection.addTransaction(mockData.dummy4)
      connection.addTransaction(mockData.dummy5)
      connection.addTransaction(mockData.dummy6)

      let transactionIds = await connection.getTransactionIdsForForging(0, 6)

      expect(transactionIds).toBeArray()
      expect(transactionIds[0]).toBe(mockData.dummy1.id)
      expect(transactionIds[1]).toBe(mockData.dummy2.id)
      expect(transactionIds[2]).toBe(mockData.dummy3.id)
      expect(transactionIds[3]).toBe(mockData.dummy4.id)
      expect(transactionIds[4]).toBe(mockData.dummy5.id)
      expect(transactionIds[5]).toBe(mockData.dummy6.id)
    })
  })

  describe('getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(connection.getTransactionsForForging).toBeFunction()
    })

    it('should return an array of transactions', async () => {
      connection.addTransaction(mockData.dummy1)
      connection.addTransaction(mockData.dummy2)
      connection.addTransaction(mockData.dummy3)
      connection.addTransaction(mockData.dummy4)
      connection.addTransaction(mockData.dummy5)
      connection.addTransaction(mockData.dummy6)

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

    it('should not accept transaction with amount > wallet balance', async () => {
      const amount = 333300000000000 // more than any genesis wallet
      const generatedTransfers = generateTransfer('testnet', delegatesSecrets[0], mockData.dummy1.recipientId, amount, 2)

      await connection.addTransaction(generatedTransfers[0])

      let transactions = await connection.getTransactionsForForging(0)
      expect(transactions).toEqual([])
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

    it('should flush the pool', () => {
      connection.addTransaction(mockData.dummy1)

      expect(connection.getPoolSize()).toBe(1)

      connection.flush()

      expect(connection.getPoolSize()).toBe(0)
    })
  })

  describe('checkIfSenderHasVoteTransactions', () => {
    it('should be a function', () => {
      expect(connection.checkIfSenderHasVoteTransactions).toBeFunction()
    })

    it('should be false for non-existent sender', () => {
      connection.addTransaction(mockData.dummy1)

      expect(connection.checkIfSenderHasVoteTransactions('nonexistent')).toBeFalsy()
    })

    it('should be false for existent sender with no votes', () => {
      const tx = mockData.dummy1

      connection.addTransaction(tx)

      expect(connection.checkIfSenderHasVoteTransactions(tx.senderPublicKey)).toBeFalsy()
    })

    it('should be true for existent sender with votes', () => {
      const tx = mockData.dummy1

      connection.addTransaction(tx)

      const voteTx = new Transaction(tx)
      voteTx.id = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      voteTx.type = TRANSACTION_TYPES.VOTE
      connection.addTransaction(voteTx)

      connection.addTransaction(mockData.dummy2)

      expect(connection.checkIfSenderHasVoteTransactions(tx.senderPublicKey)).toBeTruthy()
    })
  })

  describe('stress', () => {
    const fakeTransactionId = function (i) {
      return 'id' + String(i) + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    }

    it('multiple additions and retrievals', () => {
      // Abstract number which decides how many iterations are run by the test.
      // Increase it to run more iterations.
      const testSize = connection.options.syncInterval * 2

      for (let i = 0; i < testSize; i++) {
        let transaction = new Transaction(mockData.dummy1)
        transaction.id = fakeTransactionId(i)
        connection.addTransaction(transaction)

        if (i % 27 === 0) {
          connection.removeTransaction(transaction)
        }
      }

      for (let i = 0; i < testSize * 2; i++) {
        connection.getPoolSize()
        for (const sender of ['nonexistent', mockData.dummy1.senderPublicKey]) {
          connection.getSenderSize(sender)
          connection.hasExceededMaxTransactions(sender)
        }
        connection.getTransaction(fakeTransactionId(i))
        connection.getTransactions(0, i)
      }

      for (let i = 0; i < testSize; i++) {
        let transaction = new Transaction(mockData.dummy1)
        transaction.id = fakeTransactionId(i)
        connection.removeTransaction(transaction)
      }
    })

    it('delete + add after sync', () => {
      for (let i = 0; i < connection.options.syncInterval; i++) {
        let transaction = new Transaction(mockData.dummy1)
        transaction.id = fakeTransactionId(i)
        connection.addTransaction(transaction)
      }

      let transaction = new Transaction(mockData.dummy1)
      transaction.id = fakeTransactionId(0)
      connection.removeTransaction(transaction)
      connection.addTransaction(transaction)
    })

    /*
    it('add 30k then get first 150', () => {
      const nAdd = 30000

      console.time(`time to add ${nAdd}`)
      const allTransactions = []
      for (let i = 0; i < nAdd; i++) {
        const transaction = new Transaction(mockData.dummy1)
        transaction.id = fakeTransactionId(i)
        allTransactions.push(transaction)

        connection.addTransaction(allTransactions[allTransactions.length - 1])
      }
      console.timeEnd(`time to add ${nAdd}`)

      const n = 150

      console.time(`time to get first ${n}`)
      const firstTransactions = connection.getTransactions(0, n)
      console.timeEnd(`time to get first ${n}`)

      expect(firstTransactions[0]).toBe(allTransactions[0].serialized)
      expect(firstTransactions[n - 1]).toBe(allTransactions[n - 1].serialized)
    })
    */
  })
})
