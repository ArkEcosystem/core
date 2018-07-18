'use strict'

const app = require('./__support__/setup')
const block = require('./__fixtures__/block')

jest.setTimeout(30000)

const host = 'http://127.0.0.1:4000'

let Client
let client

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  Client = require('../lib/client')
  client = new Client(host)
})

describe('Client', () => {
  it('should be an object', () => {
    expect(client).toBeObject()
  })

  describe('constructor', () => {
    it('accepts 1 or more hosts as parameter', () => {
      client = new Client(host)
      expect(client.hosts).toEqual([host])

      const hosts = [host, 'localhost:4000']
      client = new Client(hosts)
      expect(client.hosts).toEqual(hosts)
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
