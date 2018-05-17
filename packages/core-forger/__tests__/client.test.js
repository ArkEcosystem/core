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
      await expect(client.broadcast(block)).resolves.toBeTruthy()
    })
  })

  describe('getRound', () => {
    it('should be a function', () => {
      expect(client.getRound).toBeFunction()
    })

    it('should be ok', async () => {
      const round = await client.getRound(block)

      expect(round).toHaveProperty('current')
      expect(round).toHaveProperty('reward')
      expect(round).toHaveProperty('timestamp')
      expect(round).toHaveProperty('delegates')
      expect(round).toHaveProperty('lastBlock')
      expect(round).toHaveProperty('canForge')
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(client.getTransactions).toBeFunction()
    })

    it('should be ok', async () => {
      const response = await client.getTransactions()
      expect(response).toHaveProperty('count')
      expect(response.count).toBeNumber()
      expect(response).toHaveProperty('poolSize')
      expect(response.poolSize).toBeNumber()
      expect(response).toHaveProperty('transactions')
      expect(response.transactions).toBeArray()
    })
  })
})
