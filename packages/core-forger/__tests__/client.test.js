'use strict'

const app = require('./__support__/setup')
const block = require('./__fixtures__/block')

jest.setTimeout(30000)

let client

beforeAll(async () => {
  await app.setUp()

  client = new (require('../lib/client'))('http://127.0.0.1:4000')
})

afterAll(async () => {
  await app.tearDown()
})

describe('Client', () => {
  it('should be an object', () => {
    expect(client).toBeObject()
  })

  describe('constructor', () => {
    xit('accepts 1 or more hosts as parameter', () => {
    })
  })

  describe('broadcast', () => {
    it('should be a function', () => {
      expect(client.broadcast).toBeFunction()
    })

    describe('when the host is available', () => {
      it('should be truthy if broadcasts', async () => {
        const wasBroadcasted = await client.broadcast(block.toRawJson())
        expect(wasBroadcasted).toBeTruthy()
      })
    })
  })

  describe('getRound', () => {
    it('should be a function', () => {
      expect(client.getRound).toBeFunction()
    })

    describe('when the host is available', () => {
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
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(client.getTransactions).toBeFunction()
    })

    describe('when the host is available', () => {
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

  describe('getNetworkState', () => {
    it('should be a function', () => {
      expect(client.getNetworkState).toBeFunction()
    })

    describe('when the host is available', () => {
      it('should be ok', async () => {
        const networkState = await client.getNetworkState()

        expect(networkState).toHaveProperty('quorum')
        expect(networkState).toHaveProperty('nodeHeight')
        expect(networkState).toHaveProperty('lastBlockId')
        expect(networkState).toHaveProperty('overHeightBlockHeader')
        expect(networkState).toHaveProperty('minimumNetworkReach')
        expect(networkState).toHaveProperty('coldStart')
      })
    })
  })
})
