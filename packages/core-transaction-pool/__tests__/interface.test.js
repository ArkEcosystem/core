'use strict'

const app = require('./__support__/setup')
const { dummy1, dummy2 } = require('./__fixtures__/transactions')

let poolInterface

beforeAll(async (done) => {
  const container = await app.setUp()
  await container.resolvePlugin('blockchain').start()

  poolInterface = new (require('../lib/interface'))({ enabled: false })

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Transaction Pool Interface', () => {
  it('should be an object', () => {
    expect(poolInterface).toBeObject()
  })

  describe('driver', () => {
    it('should be a function', () => {
      expect(poolInterface.driver).toBeFunction()
    })
  })

  describe('getPoolSize', () => {
    it('should be a function', () => {
      expect(poolInterface.getPoolSize).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.getPoolSize()).rejects.toThrowError('Method [getPoolSize] not implemented!')
    })
  })

  describe('addTransaction', () => {
    it('should be a function', () => {
      expect(poolInterface.addTransaction).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.addTransaction()).rejects.toThrowError('Method [addTransaction] not implemented!')
    })
  })

  describe('removeTransaction', () => {
    it('should be a function', () => {
      expect(poolInterface.removeTransaction).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.removeTransaction()).rejects.toThrowError('Method [removeTransaction] not implemented!')
    })
  })

  describe('removeTransactions', () => {
    it('should be a function', () => {
      expect(poolInterface.removeTransactions).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.removeTransactions()).rejects.toThrowError('Method [removeTransactions] not implemented!')
    })
  })

  describe('getTransaction', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransaction).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.getTransaction()).rejects.toThrowError('Method [getTransaction] not implemented!')
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactions).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.getTransactions()).rejects.toThrowError('Method [getTransactions] not implemented!')
    })
  })

  describe('getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactionsForForging).toBeFunction()
    })
  })

  describe('hasExceededMaxTransactions', () => {
    it('should be a function', () => {
      expect(poolInterface.hasExceededMaxTransactions).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.hasExceededMaxTransactions()).rejects.toThrowError('Method [hasExceededMaxTransactions] not implemented!')
    })
  })

  describe('transactionExists', () => {
    it('should be a function', () => {
      expect(poolInterface.transactionExists).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.transactionExists()).rejects.toThrowError('Method [transactionExists] not implemented!')
    })
  })

  describe('removeTransactionsForSender', () => {
    it('should be a function', () => {
      expect(poolInterface.removeTransactionsForSender).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.removeTransactionsForSender()).rejects.toThrowError('Method [removeTransactionsForSender] not implemented!')
    })
  })

  describe('getTransactionsIds', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactionsIds).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.getTransactionsIds()).rejects.toThrowError('Method [getTransactionsIds] not implemented!')
    })
  })

  // TODO: rewrite and adjust to changes
  describe('determineExcessTransactions', () => {
    it('should have 2 accept / 0 excess transactions', async () => {
      poolInterface.hasExceededMaxTransactions = jest.fn(pass => false)

      const ids = await poolInterface.determineExcessTransactions([dummy1, dummy2])

      expect(ids).toBeObject()
      expect(ids).toHaveProperty('accept')
      expect(ids.accept).toHaveLength(2)
      expect(ids).toHaveProperty('excess')
      expect(ids.excess).toHaveLength(0)
    })

    it('should have 0 accept / 2 excess transactions', async () => {
      poolInterface.hasExceededMaxTransactions = jest.fn(pass => true)

      const ids = await poolInterface.determineExcessTransactions([dummy1, dummy2])

      expect(ids).toBeObject()
      expect(ids).toHaveProperty('accept')
      expect(ids.accept).toHaveLength(0)
      expect(ids).toHaveProperty('excess')
      expect(ids.excess).toHaveLength(2)
    })
  })
})
