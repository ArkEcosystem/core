'use strict'

const app = require('./__support__/setup')
const block = require('./__fixtures__/block')

let client

beforeAll(async (done) => {
  await app.setUp()

  client = new (require('../lib/client'))('http://127.0.0.1')

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Client', () => {
  it('should be an object', () => {
    expect(client).toBeObject()
  })

  describe('broadcast', () => {
    it('should be a function', () => {
      expect(client.broadcast).toBeFunction()
    })

    it('should be truthy if broadcasts', async () => {
      await expect(await client.broadcast(block)).toBeTruthy()
    })
  })

  describe('getRound', () => {
    it('should be a function', () => {
      expect(client.getRound).toBeFunction()
    })

    it('should be ok', async () => {
      const round = await client.getRound(block)

      await expect(round).toHaveProperty('current')
      await expect(round).toHaveProperty('reward')
      await expect(round).toHaveProperty('timestamp')
      await expect(round).toHaveProperty('delegates')
      await expect(round).toHaveProperty('lastBlock')
      await expect(round).toHaveProperty('canForge')
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(client.getTransactions).toBeFunction()
    })

    it('should be ok', async () => {
      const response = await client.getTransactions()
      await expect(response).toHaveProperty('count')
      await expect(response.count).toBeNumber()
      await expect(response).toHaveProperty('poolSize')
      await expect(response.poolSize).toBeNumber()
      await expect(response).toHaveProperty('transactions')
      await expect(response.transactions).toBeArray()
    })
  })
})
