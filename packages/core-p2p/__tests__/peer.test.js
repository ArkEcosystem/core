'use strict'

const app = require('./__support__/setup')

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
  peer = new (require('../lib/peer'))('127.0.0.1', 4002, {
    server: {
      version: 1,
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
  })

  describe('get', async () => {
    it('should be a function', async () => {
      await expect(peer.get).toBeFunction()
    })
  })

  describe('postBlock', async () => {
    it('should be a function', async () => {
      await expect(peer.postBlock).toBeFunction()
    })
  })

  describe('postTransactions', async () => {
    it('should be a function', async () => {
      await expect(peer.postTransactions).toBeFunction()
    })
  })

  describe('parseHeaders', async () => {
    it('should be a function', async () => {
      await expect(peer.parseHeaders).toBeFunction()
    })
  })

  describe('downloadBlocks', async () => {
    it('should be a function', async () => {
      await expect(peer.downloadBlocks).toBeFunction()
    })
  })

  describe('ping', async () => {
    it('should be a function', async () => {
      await expect(peer.ping).toBeFunction()
    })
  })

  describe('getPeers', async () => {
    it('should be a function', async () => {
      await expect(peer.getPeers).toBeFunction()
    })
  })
})
