'use strict'

const app = require('./__support__/setup')
const {
  dummy1,
  dummy2
} = require('./__fixtures__/transaction')

const {
  Transaction
} = require('@arkecosystem/client').models

let connection

beforeAll(async(done) => {
  await app.setUp()

  const RedisConnection = require('../lib/connection.js')
  connection = new RedisConnection(require('../lib/defaults'))
  connection = connection.make()

  done()
})

afterAll(async(done) => {
  await app.tearDown()

  done()
})

beforeEach(async(done) => {
  await connection.flush()

  done()
})

describe('Connection', () => {
  it('should be an object', async() => {
    await expect(connection).toBeObject()
  })

  describe('getPoolSize', async() => {
    it('should be a function', async() => {
      await expect(connection.getPoolSize).toBeFunction()
    })

    it('should return 0 if no transactions were added', async() => {
      await expect(await connection.getPoolSize()).toBe(0)
    })

    it('should return 2 if transactions were added', async() => {
      await expect(await connection.getPoolSize()).toBe(0)

      await connection.addTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(1)
    })
  })

  describe('addTransaction', async() => {
    it('should be a function', async() => {
      await expect(connection.addTransaction).toBeFunction()
    })

    it('should add the transaction to the pool', async() => {
      await expect(await connection.getPoolSize()).toBe(0)

      await connection.addTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(1)
    })
  })

  describe.skip('addTransactions', async() => {
    it('should be a function', async() => {
      await expect(connection.addTransactions).toBeFunction()
    })

    it('should add the transaction to the pool', async() => {
      await expect(await connection.getPoolSize()).toBe(0)

      await connection.addTransactions([dummy1, dummy2])

      await expect(await connection.getPoolSize()).toBe(2)
    })
  })

  describe('removeTransaction', async() => {
    it('should be a function', async() => {
      await expect(connection.removeTransaction).toBeFunction()
    })

    it('should remove the specified transaction from the pool', async() => {
      await connection.addTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(1)

      await connection.removeTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(0)
    })
  })

  describe('removeTransactions', async() => {
    it('should be a function', async() => {
      await expect(connection.removeTransactions).toBeFunction()
    })

    it('should remove the specified transactions from the pool', async() => {
      await connection.addTransaction(dummy1)
      await connection.addTransaction(dummy2)

      await expect(await connection.getPoolSize()).toBe(2)

      await connection.removeTransactions([dummy1, dummy2])

      await expect(await connection.getPoolSize()).toBe(0)
    })
  })

  describe('hasExceededMaxTransactions', async() => {
    it('should be a function', async() => {
      await expect(connection.hasExceededMaxTransactions).toBeFunction()
    })

    it('should be truthy if exceeded', async() => {
      for (let i = 0; i < 101; i++) {
        await connection.addTransaction(dummy1)
      }

      await connection.addTransaction(dummy1)

      await expect(await connection.hasExceededMaxTransactions(dummy1)).toBeTruthy()
    })

    it('should be falsy if not exceeded', async() => {
      await connection.addTransaction(dummy1)

      await expect(await connection.hasExceededMaxTransactions(dummy1)).toBeFalsy()
    })
  })

  describe('getPublicKeyById', async() => {
    it('should be a function', async() => {
      await expect(connection.getPublicKeyById).toBeFunction()
    })

    it('should return the sender public key', async() => {
      await connection.addTransaction(dummy1)

      await expect(await connection.getPublicKeyById(dummy1.id)).toBe(dummy1.senderPublicKey)
    })
  })

  describe('getTransaction', async() => {
    it('should be a function', async() => {
      await expect(connection.getTransaction).toBeFunction()
    })

    it('should return the specified transaction', async() => {
      await connection.addTransaction(dummy1)

      const poolTransaction = await connection.getTransaction(dummy1.id)
      await expect(poolTransaction).toBeObject()
      await expect(poolTransaction.id).toBe(dummy1.id)
    })
  })

  describe('getTransactions', async() => {
    it('should be a function', async() => {
      await expect(connection.getTransactions).toBeFunction()
    })

    it('should return transactions within the specified range', async() => {
      await connection.addTransaction(dummy1)
      await connection.addTransaction(dummy1)

      let poolTransaction = await connection.getTransactions(0, 1)
      poolTransaction = poolTransaction.map(serializedTx => Transaction.fromBytes(serializedTx))

      await expect(poolTransaction[0]).toBeObject()
      await expect(poolTransaction[0].id).toBe(dummy1.id)
    })
  })

  describe('getTransactionsForForging', async() => {
    it('should be a function', async() => {
      await expect(connection.getTransactionsForForging).toBeFunction()
    })
  })

  describe('flush', async() => {
    it('should be a function', async() => {
      await expect(connection.flush).toBeFunction()
    })

    it('should flush the pool', async() => {
      await connection.addTransaction(dummy1)

      await expect(await connection.getPoolSize()).toBe(1)

      await connection.flush()

      await expect(await connection.getPoolSize()).toBe(0)
    })
  })

  describe('__isReady', async() => {
    it('should be a function', async() => {
      await expect(connection.__isReady).toBeFunction()
    })

    it('should be truthy if connected', async() => {
      await expect(await connection.__isReady()).toBeTruthy()
    })
  })
})
