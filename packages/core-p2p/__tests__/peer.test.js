'use strict'

const app = require('./__support__/setup')
const genesisBlock = require('./__fixtures__/genesisBlock')
const genesisTransaction = require('./__fixtures__/genesisTransaction')

let peer

beforeAll(async (done) => {
  await app.setUp()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
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
  it('should be an object', async () => {
    await expect(peer).toBeObject()
  })

  describe('toBroadcastInfo', async () => {
    it('should be a function', async () => {
      await expect(peer.toBroadcastInfo).toBeFunction()
    })

    it('should be ok', async () => {
      const struct = peer.toBroadcastInfo()

      await expect(struct).toBeObject()
      await expect(struct).toHaveProperty('ip')
      await expect(struct).toHaveProperty('port')
      await expect(struct).toHaveProperty('version')
      await expect(struct).toHaveProperty('os')
      await expect(struct).toHaveProperty('status')
      await expect(struct).toHaveProperty('height')
      await expect(struct).toHaveProperty('delay')
    })
  })

  describe.skip('postBlock', async () => {
    it('should be a function', async () => {
      await expect(peer.postBlock).toBeFunction()
    })

    it('should be ok', async () => {
      const response = await peer.postBlock(genesisBlock.toBroadcastV1())

      await expect(response).toBeObject()
      await expect(response).toHaveProperty('success')
      await expect(response.success).toBeTruthy()
    })
  })

  describe.skip('postTransactions', async () => {
    it('should be a function', async () => {
      await expect(peer.postTransactions).toBeFunction()
    })

    it('should be ok', async () => {
      const response = await peer.postTransactions([genesisTransaction.toBroadcastV1()])

      await expect(response).toBeObject()
      await expect(response).toHaveProperty('success')
      await expect(response.success).toBeTruthy()
    })
  })

  describe('downloadBlocks', async () => {
    it('should be a function', async () => {
      await expect(peer.downloadBlocks).toBeFunction()
    })

    it('should be ok', async () => {
      const blocks = await peer.downloadBlocks(1)

      await expect(blocks).toBeArray()
      await expect(blocks.length).toBeGreaterThan(10)
    })
  })

  describe('ping', async () => {
    it('should be a function', async () => {
      await expect(peer.ping).toBeFunction()
    })

    it('should be ok', async () => {
      const response = await peer.ping(5000)

      await expect(response).toBeObject()
      await expect(response).toHaveProperty('success')
      await expect(response.success).toBeTruthy()
    })

    it('should not be ok', async () => {
      await expect(peer.ping(1)).rejects.toThrowError('is unreachable')
    })
  })

  describe('getPeers', async () => {
    it('should be a function', async () => {
      await expect(peer.getPeers).toBeFunction()
    })

    it('should be ok', async () => {
      const peers = await peer.getPeers()

      await expect(peers).toBeArray()
      await expect(peers.length).toBeGreaterThan(10)
    })
  })

  describe('__get', async () => {
    it('should be a function', async () => {
      await expect(peer.__get).toBeFunction()
    })
  })

  describe('__parseHeaders', async () => {
    it('should be a function', async () => {
      await expect(peer.__parseHeaders).toBeFunction()
    })

    it('should be ok', async () => {
      const headers = {
        nethash: 'nethash',
        os: 'os',
        version: 'version'
      }

      await peer.__parseHeaders({ headers })

      await expect(peer.nethash).toBe(headers.nethash)
      await expect(peer.os).toBe(headers.os)
      await expect(peer.version).toBe(headers.version)
    })
  })
})
