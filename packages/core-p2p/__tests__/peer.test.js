'use strict'

const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const axiosMock = new MockAdapter(axios)
const app = require('./__support__/setup')
const container = require('@arkecosystem/core-container')

let genesisBlock
let genesisTransaction

let Peer
let peer

let headers

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('./__fixtures__/genesisBlock')
  genesisTransaction = require('./__fixtures__/genesisTransaction')

  Peer = require('../lib/peer')

  // The headers initialized here are then used for mocking peer responses with axiosMock
  const config = container.resolvePlugin('config')
  headers = {
    nethash: config.network.nethash,
    version: container.resolveOptions('blockchain').version,
    port: container.resolveOptions('p2p').port,
    os: require('os').platform()
  }
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  peer = new Peer('45.76.142.128', 4002)

  axiosMock.reset() // important: resets any existing mocking behavior
})

describe('Peer', () => {
  it('should be an object', () => {
    expect(peer).toBeObject()
  })

  describe('toBroadcastInfo', () => {
    it('should be a function', () => {
      expect(peer.toBroadcastInfo).toBeFunction()
    })

    it('should be ok', async () => {
      const struct = peer.toBroadcastInfo()

      expect(struct).toBeObject()
      expect(struct).toHaveProperty('ip')
      expect(struct).toHaveProperty('port')
      expect(struct).toHaveProperty('version')
      expect(struct).toHaveProperty('os')
      expect(struct).toHaveProperty('status')
      expect(struct).toHaveProperty('height')
      expect(struct).toHaveProperty('delay')
    })
  })

  describe.skip('postBlock', () => {
    it('should be a function', () => {
      expect(peer.postBlock).toBeFunction()
    })

    it('should be ok', async () => {
      const response = await peer.postBlock(genesisBlock.toBroadcastV1())

      expect(response).toBeObject()
      expect(response).toHaveProperty('success')
      expect(response.success).toBeTruthy()
    })
  })

  describe.skip('postTransactions', () => {
    it('should be a function', () => {
      expect(peer.postTransactions).toBeFunction()
    })

    it('should be ok', async () => {
      const response = await peer.postTransactions([genesisTransaction.toBroadcastV1()])

      expect(response).toBeObject()
      expect(response).toHaveProperty('success')
      expect(response.success).toBeTruthy()
    })
  })

  describe('downloadBlocks', () => {
    // https://github.com/facebook/jest/issues/3601
    const errorCapturer = fn => fn.then(res => () => res).catch(err => () => { throw err })

    it('should be a function', () => {
      expect(peer.downloadBlocks).toBeFunction()
    })

    describe('when the request reply with the blocks', () => {
      it('should return the blocks', async () => {
        const blocks = [{}]
        axiosMock.onGet(`${peer.url}/peer/blocks`).reply(200, { blocks })

        const result = await peer.downloadBlocks(1)

        expect(result).toEqual(blocks)
      })
    })

    describe('when the request reply with the blocks', () => {
      it('should return the blocks', async () => {
        axiosMock.onGet(`${peer.url}/peer/blocks`).reply(500, { data: {} })

        expect(await errorCapturer(peer.downloadBlocks(1))).toThrowError(/request.*500/i)
      })
    })
  })

  describe('ping', () => {
    it('should be a function', () => {
      expect(peer.ping).toBeFunction()
    })

    it('should be ok', async () => {
      axiosMock.onGet(`${peer.url}/peer/status`).reply(() => [200, { success: true }, headers])

      const response = await peer.ping(5000)

      expect(response).toBeObject()
      expect(response).toHaveProperty('success')
      expect(response.success).toBeTruthy()
    })

    it('should not be ok', async () => {
      axiosMock.onGet(`${peer.url}/peer/status`).reply(500)
      expect(peer.ping(1)).rejects.toThrowError('is unresponsive')
    })
  })

  describe('getPeers', () => {
    it('should be a function', () => {
      expect(peer.getPeers).toBeFunction()
    })

    it('should be ok', async () => {
      const peersMock = [ { ip: '1.1.1.1' } ]
      axiosMock.onGet(`${peer.url}/peer/status`).reply(() => [200, { success: true }, headers])
      axiosMock.onGet(`${peer.url}/peer/list`).reply(() => [200, { peers: peersMock }, headers])

      const peers = await peer.getPeers()

      expect(peers).toEqual(peersMock)
    })
  })

  describe('__get', () => {
    it('should be a function', () => {
      expect(peer.__get).toBeFunction()
    })
  })

  describe('__parseHeaders', () => {
    it('should be a function', () => {
      expect(peer.__parseHeaders).toBeFunction()
    })

    it('should be ok', async () => {
      const headers = {
        nethash: 'nethash',
        os: 'os',
        version: 'version'
      }

      await peer.__parseHeaders({ headers })

      expect(peer.nethash).toBe(headers.nethash)
      expect(peer.os).toBe(headers.os)
      expect(peer.version).toBe(headers.version)
    })
  })
})
