'use strict'

const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const axiosMock = new MockAdapter(axios)

const app = require('./__support__/setup')

const defaults = require('../lib/defaults')

let monitor
let Peer
let peerMock

beforeAll(async () => {
  await app.setUp()

  monitor = require('../lib/monitor')
  Peer = require('../lib/peer')
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(async () => {
  monitor.config = defaults

  const initialPeersMock = {};
  ['0.0.0.0', '0.0.0.1', '0.0.0.2', '0.0.0.3', '0.0.0.4'].forEach(ip => {
    const initialPeer = new Peer(ip, 4000)
    initialPeersMock[ip] = Object.assign(initialPeer, initialPeer.headers, { ban: 0 })
  });
  monitor.peers = initialPeersMock

  peerMock = new Peer('0.0.0.99', 4000) // this peer is just here to be picked up by tests below (not added to initial peers)
  Object.assign(peerMock, peerMock.headers, { status: 200 })

  axiosMock.reset() // important: resets any existing mocking behavior
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

  describe('start', () => {
    it('should have timeout of 60 minutes', () => {
      expect(monitor.config.suspendMinutes).toBe(60)
    })
  })

  describe('cleanPeers', () => {
    it('should be a function', () => {
      expect(monitor.cleanPeers).toBeFunction()
    })

    it('should be ok', async () => {
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
      axiosMock.onGet(`${peerMock.url}/peer/status`).reply(() => [200, { success: true }, peerMock.headers])
      process.env.ARK_ENV = false

      await monitor.acceptNewPeer(peerMock)

      expect(monitor.peers[peerMock.ip]).toBeObject()

      process.env.ARK_ENV = 'test'
    })
  })

  describe('getPeers', () => {
    it('should be a function', () => {
      expect(monitor.getPeers).toBeFunction()
    })

    it('should be ok', async () => {
      const peers = monitor.getPeers()

      expect(peers).toBeArray()
      expect(peers.length).toBe(5) // 5 from peers.json
    })
  })

  describe('getRandomPeer', () => {
    it('should be a function', () => {
      expect(monitor.getRandomPeer).toBeFunction()
    })

    it('should be ok', async () => {
      const peer = monitor.getRandomPeer()

      expect(peer).toBeObject()
      expect(peer).toHaveProperty('ip')
      expect(peer).toHaveProperty('port')
    })
  })

  describe('getRandomDownloadBlocksPeer', () => {
    it('should be a function', () => {
      expect(monitor.getRandomDownloadBlocksPeer).toBeFunction()
    })

    it('should be ok', async () => {
      axiosMock.onGet(/.*\/peer\/blocks\/common/).reply(() => [200, { success: true, common: true }, peerMock.headers])
      const peer = await monitor.getRandomDownloadBlocksPeer()

      expect(peer).toBeObject()
      expect(peer).toHaveProperty('ip')
      expect(peer).toHaveProperty('port')
    })
  })

  describe('discoverPeers', () => {
    it('should be a function', () => {
      expect(monitor.discoverPeers).toBeFunction()
    })

    it('should be ok', async () => {
      axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { success: true }, peerMock.headers])
      axiosMock.onGet(/.*\/peer\/list/).reply(() => [200, { peers: [ peerMock.toBroadcastInfo() ] }, peerMock.headers])

      const peers = await monitor.discoverPeers()

      expect(peers).toBeObject()
      expect(Object.keys(peers).length).toBe(6) // 5 from initial peers + 1 from peerMock
      expect(peers[peerMock.ip]).toBeObject()
    })
  })

  describe('hasPeers', () => {
    it('should be a function', () => {
      expect(monitor.hasPeers).toBeFunction()
    })
  })

  describe('getNetworkHeight', () => {
    it('should be a function', () => {
      expect(monitor.getNetworkHeight).toBeFunction()
    })

    it('should be ok', async () => {
      axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { success: true, height: 2 }, peerMock.headers])
      axiosMock.onGet(/.*\/peer\/list/).reply(() => [200, { peers: [] }, peerMock.headers])
      await monitor.discoverPeers()

      const height = await monitor.getNetworkHeight()
      expect(height).toBe(2)
    })

    // TODO test with peers with different heights (use replyOnce) and check that median is OK
  })

  describe('getPBFTForgingStatus', () => {
    it('should be a function', () => {
      expect(monitor.getPBFTForgingStatus).toBeFunction()
    })

    it('should be ok', async () => {
      axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { success: true, height: 2 }, peerMock.headers])
      axiosMock.onGet(/.*\/peer\/list/).reply(() => [200, { peers: [] }, peerMock.headers])

      await monitor.discoverPeers()
      const pbftForgingStatus = monitor.getPBFTForgingStatus()

      expect(pbftForgingStatus).toBeNumber()
      // TODO test mocking peers currentSlot & forgingAllowed
    })
  })

  describe('downloadBlocks', () => {
    it('should be a function', () => {
      expect(monitor.downloadBlocks).toBeFunction()
    })

    it('should be ok', async () => {
      axiosMock.onGet(/.*\/peer\/blocks\/common/).reply(() => [200, { success: true, common: true }, peerMock.headers])
      axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { success: true, height: 2 }, peerMock.headers])
      axiosMock.onGet(/.*\/peer\/blocks/).reply(() => [200, { blocks: [ { id: 1 }, { id: 2 } ] }, peerMock.headers])

      const blocks = await monitor.downloadBlocks(1)

      expect(blocks).toBeArray()
      expect(blocks.length).toBe(2)
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

      expect(monitor.toJson)
    })
  })

  describe('__checkDNSConnectivity', () => {
    it('should be a function', () => {
      expect(monitor.__checkDNSConnectivity).toBeFunction()
    })
  })

  describe('__checkNTPConnectivity', () => {
    it('should be a function', () => {
      expect(monitor.__checkNTPConnectivity).toBeFunction()
    })
  })
})
