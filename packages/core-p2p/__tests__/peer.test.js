'use strict'

const app = require('./__support__/setup')
const genesisBlock = require('./__fixtures__/genesisBlock')
const genesisTransaction = require('./__fixtures__/genesisTransaction')

let peer

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  peer = new (require('../lib/peer'))('45.76.142.128', 4002, {
    server: {
      version: '1.1.1',
      port: 4002
    },
    network: {
      nethash: '578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23'
    }
  })
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
    it('should be a function', () => {
      expect(peer.downloadBlocks).toBeFunction()
    })

    it('should be ok', async () => {
      const blocks = await peer.downloadBlocks(1)

      expect(blocks).toBeArray()
      expect(blocks.length).toBeGreaterThan(10)
    })
  })

  describe('ping', () => {
    it('should be a function', () => {
      expect(peer.ping).toBeFunction()
    })

    it('should be ok', async () => {
      const response = await peer.ping(5000)

      expect(response).toBeObject()
      expect(response).toHaveProperty('success')
      expect(response.success).toBeTruthy()
    })

    it('should not be ok', async () => {
      expect(peer.ping(1)).rejects.toThrowError('is unreachable')
    })
  })

  describe('getPeers', () => {
    it('should be a function', () => {
      expect(peer.getPeers).toBeFunction()
    })

    it('should be ok', async () => {
      const peers = await peer.getPeers()

      expect(peers).toBeArray()
      expect(peers.length).toBeGreaterThan(10)
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
