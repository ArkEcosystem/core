'use strict'

const app = require('./__support__/setup')

let monitor

beforeAll(async(done) => {
  await app.setUp()

  done()
})

afterAll(async(done) => {
  await app.tearDown()

  done()
})

beforeEach(() => {
  const manager = new(require('../lib/manager'))(require('../lib/defaults'))
  monitor = new(require('../lib/monitor'))(manager)
})

describe('Monitor', () => {
  it('should be an object', async() => {
    await expect(monitor).toBeObject()
  })

  describe.skip('updateNetworkStatus', async() => {
    it('should be a function', async() => {
      await expect(monitor.updateNetworkStatus).toBeFunction()
    })
  })

  describe('cleanPeers', async() => {
    it('should be a function', async() => {
      await expect(monitor.cleanPeers).toBeFunction()
    })

    it('should be a function', async() => {
      await monitor.discoverPeers()

      const previousLength = Object.keys(monitor.peers).length

      await monitor.cleanPeers(true)

      await expect(Object.keys(monitor.peers).length).toBeLessThan(previousLength)
    })
  })

  describe('acceptNewPeer', async() => {
    it('should be a function', async() => {
      await expect(monitor.acceptNewPeer).toBeFunction()
    })

    it('should be ok', async() => {
      process.env.ARK_ENV = false

      const peer = {
        ip: '45.76.142.128',
        port: 4002,
        nethash: '578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23'
      }

      await monitor.acceptNewPeer(peer)

      await expect(monitor.peers[peer.ip]).toBeObject()

      process.env.ARK_ENV = 'test'
    })
  })

  describe('getPeers', async() => {
    it('should be a function', async() => {
      await expect(monitor.getPeers).toBeFunction()
    })

    it('should be ok', async() => {
      await monitor.discoverPeers()

      const peers = monitor.getPeers()

      await expect(peers).toBeArray()
      await expect(peers.length).toBeGreaterThan(10)
    })
  })

  describe('getRandomPeer', async() => {
    it('should be a function', async() => {
      await expect(monitor.getRandomPeer).toBeFunction()
    })

    it('should be ok', async() => {
      const peers = monitor.getRandomPeer()

      await expect(peers).toBeObject()
      await expect(peers).toHaveProperty('ip')
      await expect(peers).toHaveProperty('port')
    })
  })

  describe('getRandomDownloadBlocksPeer', async() => {
    it('should be a function', async() => {
      await expect(monitor.getRandomDownloadBlocksPeer).toBeFunction()
    })

    it('should be ok', async() => {
      const peers = monitor.getRandomDownloadBlocksPeer()

      await expect(peers).toBeObject()
      await expect(peers).toHaveProperty('ip')
      await expect(peers).toHaveProperty('port')
    })
  })

  describe('discoverPeers', async() => {
    it('should be a function', async() => {
      await expect(monitor.discoverPeers).toBeFunction()
    })

    it('should be ok', async() => {
      const peers = await monitor.discoverPeers()

      await expect(peers).toBeObject()
      await expect(Object.keys(peers).length).toBeGreaterThan(10)
    })
  })

  describe('getNetworkHeight', async() => {
    it('should be a function', async() => {
      await expect(monitor.getNetworkHeight).toBeFunction()
    })

    it('should be ok', async() => {
      await monitor.discoverPeers()

      const status = await monitor.getNetworkHeight()

      await expect(status).toBeNumber()
    })
  })

  describe('getPBFTForgingStatus', async() => {
    it('should be a function', async() => {
      await expect(monitor.getPBFTForgingStatus).toBeFunction()
    })

    it('should be ok', async() => {
      await monitor.discoverPeers()

      const status = await monitor.getPBFTForgingStatus()

      await expect(status).toBeNumber()
    })
  })

  describe('downloadBlocks', async() => {
    it('should be a function', async() => {
      await expect(monitor.downloadBlocks).toBeFunction()
    })

    it('should be ok', async() => {
      const blocks = await monitor.downloadBlocks(1)

      await expect(blocks).toBeArray()
      await expect(blocks.length).toBeGreaterThan(10)
    })
  })

  describe('broadcastBlock', async() => {
    it('should be a function', async() => {
      await expect(monitor.broadcastBlock).toBeFunction()
    })
  })

  describe('broadcastTransactions', async() => {
    it('should be a function', async() => {
      await expect(monitor.broadcastTransactions).toBeFunction()
    })

    it('should be ok', async() => {
      await expect(monitor.broadcastTransactions).toBeFunction()

      await expect(monitor.toBroadcastV1)
    })
  })
})
