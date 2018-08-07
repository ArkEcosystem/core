'use strict'

const app = require('./__support__/setup')
const moment = require('moment')
const ARK_ENV = process.env.ARK_ENV

const defaults = require('../lib/defaults')

let Manager
let Monitor
let monitor
let peer

beforeAll(async () => {
  await app.setUp()

  Manager = require('../lib/manager')
  Monitor = require('../lib/monitor')
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  const manager = new Manager(defaults)
  monitor = new Monitor(manager)
  peer = {
    ip: '45.76.142.128',
    port: 4002,
    nethash: '578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23'
  }
})

describe('Monitor', () => {
  it('should be an object', () => {
    expect(monitor).toBeObject()
  })

  describe.skip('updateNetworkStatus', () => {
    it('should be a function', () => {
      expect(monitor.updateNetworkStatus).toBeFunction()
    })
  })

  describe('cleanPeers', () => {
    it('should be a function', () => {
      expect(monitor.cleanPeers).toBeFunction()
    })

    it('should be a function', async () => {
      monitor.discoverPeers()

      const previousLength = Object.keys(monitor.peers).length

      await monitor.cleanPeers(true)

      expect(Object.keys(monitor.peers).length).toBeLessThan(previousLength)
    })
  })

  describe('acceptNewPeer', () => {
    it('should be a function', () => {
      expect(monitor.acceptNewPeer).toBeFunction()
    })

    it('should be ok', async () => {
      process.env.ARK_ENV = false

      await monitor.acceptNewPeer(peer)

      expect(monitor.peers[peer.ip]).toBeObject()

      process.env.ARK_ENV = 'test'
    })
  })

  describe('getPeers', () => {
    it('should be a function', () => {
      expect(monitor.getPeers).toBeFunction()
    })

    it('should be ok', async () => {
      await monitor.discoverPeers()

      const peers = monitor.getPeers()

      expect(peers).toBeArray()
      expect(peers.length).toBeGreaterThan(10)
    })
  })

  describe('getRandomPeer', () => {
    it('should be a function', () => {
      expect(monitor.getRandomPeer).toBeFunction()
    })

    it('should be ok', async () => {
      const peers = monitor.getRandomPeer()

      expect(peers).toBeObject()
      expect(peers).toHaveProperty('ip')
      expect(peers).toHaveProperty('port')
    })
  })

  describe('getRandomDownloadBlocksPeer', () => {
    it('should be a function', () => {
      expect(monitor.getRandomDownloadBlocksPeer).toBeFunction()
    })

    it('should be ok', async () => {
      const peers = await monitor.getRandomDownloadBlocksPeer()

      expect(peers).toBeObject()
      expect(peers).toHaveProperty('ip')
      expect(peers).toHaveProperty('port')
    })
  })

  describe('discoverPeers', () => {
    it('should be a function', () => {
      expect(monitor.discoverPeers).toBeFunction()
    })

    it('should be ok', async () => {
      const peers = await monitor.discoverPeers()

      expect(peers).toBeObject()
      expect(Object.keys(peers).length).toBeGreaterThan(10)
    })
  })

  describe('getNetworkHeight', () => {
    it('should be a function', () => {
      expect(monitor.getNetworkHeight).toBeFunction()
    })

    it('should be ok', async () => {
      await monitor.discoverPeers()

      await expect(monitor.getNetworkHeight()).resolves.toBeNumber()
    })
  })

  describe('getPBFTForgingStatus', () => {
    it('should be a function', () => {
      expect(monitor.getPBFTForgingStatus).toBeFunction()
    })

    it('should be ok', async () => {
      await monitor.discoverPeers()

      await expect(monitor.getPBFTForgingStatus()).resolves.toBeNumber()
    })
  })

  describe('downloadBlocks', () => {
    it('should be a function', () => {
      expect(monitor.downloadBlocks).toBeFunction()
    })

    it('should be ok', async () => {
      const blocks = await monitor.downloadBlocks(1)

      expect(blocks).toBeArray()
      expect(blocks.length).toBeGreaterThan(10)
    })
  })

  describe('broadcastBlock', () => {
    it('should be a function', () => {
      expect(monitor.broadcastBlock).toBeFunction()
    })
  })

  describe('broadcastTransactions', () => {
    it('should be a function', () => {
      expect(monitor.broadcastTransactions).toBeFunction()
    })

    it('should be ok', () => {
      expect(monitor.broadcastTransactions).toBeFunction()

      expect(monitor.toBroadcastV1)
    })
  })

  describe('__isSuspended', () => {
    it('should be a function', () => {
      expect(monitor.__isSuspended).toBeFunction()
    })

    it('should have timeout of 60 minutes', () => {
      expect(monitor.manager.config.suspendMinutes).toBe(60)
    })

    it('should return true', async () => {
      process.env.ARK_ENV = false
      peer.ip = '1.2.3.4'
      await monitor.acceptNewPeer(peer)
      process.env.ARK_ENV = ARK_ENV

      expect(monitor.__isSuspended(peer)).toBe(true)
    })

    it('should return false because passed', async () => {
      process.env.ARK_ENV = false
      peer.ip = '1.2.3.4'
      await monitor.acceptNewPeer(peer)
      monitor.suspendedPeers['1.2.3.4'].until = moment().subtract(1, 'minutes')
      process.env.ARK_ENV = ARK_ENV

      expect(monitor.__isSuspended(peer)).toBe(false)
    })

    it('should return false because not suspended', () => {
      expect(monitor.__isSuspended(peer)).toBe(false)
    })
  })
})
