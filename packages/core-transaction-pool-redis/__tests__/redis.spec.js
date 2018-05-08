'use strict'

const app = require('./__support__/setup')

const options = {
  enabled: true,
  key: 'ark/pool',
  maxTransactionsPerSender: 100,
  whiteList: [],
  redis: {
    host: 'localhost',
    port: 6379
  }
}

let redis

beforeAll(async (done) => {
  await app.setUp()

  redis = new (require('../lib/connection.js'))(options)

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Redis', () => {
  it('should be an object', async () => {
    await expect(redis).toBeObject()
  })

  describe('getPoolSize', async () => {
    it('should be a function', async () => {
      await expect(redis.getPoolSize).toBeFunction()
    })
  })

  describe('addTransaction', async () => {
    it('should be a function', async () => {
      await expect(redis.addTransaction).toBeFunction()
    })
  })

  describe('removeTransaction', async () => {
    it('should be a function', async () => {
      await expect(redis.removeTransaction).toBeFunction()
    })
  })

  describe('removeTransactions', async () => {
    it('should be a function', async () => {
      await expect(redis.removeTransactions).toBeFunction()
    })
  })

  describe('getTransaction', async () => {
    it('should be a function', async () => {
      await expect(redis.getTransaction).toBeFunction()
    })
  })

  describe('getTransactions', async () => {
    it('should be a function', async () => {
      await expect(redis.getTransactions).toBeFunction()
    })
  })

  describe('getTransactionsForForging', async () => {
    it('should be a function', async () => {
      await expect(redis.getTransactionsForForging).toBeFunction()
    })
  })
})
