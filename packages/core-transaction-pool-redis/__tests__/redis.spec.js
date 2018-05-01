'use strict'

const RedisConnection = require('../lib/connection')

let redis
beforeAll(() => {
  redis = new RedisConnection(require('../lib/defaults.js'))
})

describe('Redis', () => {
  it('should be an object', async () => {
    await expect(redis).toBeInstanceOf(RedisConnection)
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
