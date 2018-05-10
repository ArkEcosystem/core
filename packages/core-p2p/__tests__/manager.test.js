'use strict'

const app = require('./__support__/setup')

let manager

beforeAll(async (done) => {
  await app.setUp()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(() => {
  manager = new (require('../lib/manager'))(require('../lib/defaults'))
})

describe('Peer Manager', () => {
  it('should be an object', async () => {
    await expect(manager).toBeObject()
  })

  describe('start', async () => {
    it('should be a function', async () => {
      await expect(manager.start).toBeFunction()
    })
  })

  describe('stop', async () => {
    it('should be a function', async () => {
      await expect(manager.stop).toBeFunction()
    })
  })

  describe('updateNetworkStatus', async () => {
    it('should be a function', async () => {
      await expect(manager.updateNetworkStatus).toBeFunction()
    })
  })

  describe('downloadBlocks', async () => {
    it('should be a function', async () => {
      await expect(manager.downloadBlocks).toBeFunction()
    })
  })

  describe('broadcastBlock', async () => {
    it('should be a function', async () => {
      await expect(manager.broadcastBlock).toBeFunction()
    })
  })

  describe('broadcastTransactions', async () => {
    it('should be a function', async () => {
      await expect(manager.broadcastTransactions).toBeFunction()
    })
  })

  describe('acceptNewPeer', async () => {
    it('should be a function', async () => {
      await expect(manager.acceptNewPeer).toBeFunction()
    })
  })

  describe('getPeers', async () => {
    it('should be a function', async () => {
      await expect(manager.getPeers).toBeFunction()
    })
  })

  describe('getNetworkHeight', async () => {
    it('should be a function', async () => {
      await expect(manager.getNetworkHeight).toBeFunction()
    })
  })

  describe('__checkDNSConnectivity', async () => {
    it('should be a function', async () => {
      await expect(manager.__checkDNSConnectivity).toBeFunction()
    })
  })

  describe('__checkNTPConnectivity', async () => {
    it('should be a function', async () => {
      await expect(manager.__checkNTPConnectivity).toBeFunction()
    })
  })
})
