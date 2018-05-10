'use strict'

const app = require('./__support__/setup')

let monitor

beforeAll(async (done) => {
  await app.setUp()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(() => {
  const manager = new (require('../lib/manager'))(require('../lib/defaults'))
  monitor = new (require('../lib/monitor'))(manager)
})

describe('Monitor', () => {
  it('should be an object', async () => {
    await expect(monitor).toBeObject()
  })

  describe('start', async () => {
    it('should be a function', async () => {
      await expect(monitor.start).toBeFunction()
    })
  })

  describe('updateNetworkStatus', async () => {
    it('should be a function', async () => {
      await expect(monitor.updateNetworkStatus).toBeFunction()
    })
  })

  describe('cleanPeers', async () => {
    it('should be a function', async () => {
      await expect(monitor.cleanPeers).toBeFunction()
    })
  })

  describe('acceptNewPeer', async () => {
    it('should be a function', async () => {
      await expect(monitor.acceptNewPeer).toBeFunction()
    })
  })

  describe('getPeers', async () => {
    it('should be a function', async () => {
      await expect(monitor.getPeers).toBeFunction()
    })
  })

  describe('getRandomPeer', async () => {
    it('should be a function', async () => {
      await expect(monitor.getRandomPeer).toBeFunction()
    })
  })

  describe('getRandomDownloadBlocksPeer', async () => {
    it('should be a function', async () => {
      await expect(monitor.getRandomDownloadBlocksPeer).toBeFunction()
    })
  })

  describe('discoverPeers', async () => {
    it('should be a function', async () => {
      await expect(monitor.discoverPeers).toBeFunction()
    })
  })

  describe('later', async () => {
    it('should be a function', async () => {
      await expect(monitor.later).toBeFunction()
    })
  })

  describe('getNetworkHeight', async () => {
    it('should be a function', async () => {
      await expect(monitor.getNetworkHeight).toBeFunction()
    })
  })

  describe('getPBFTForgingStatus', async () => {
    it('should be a function', async () => {
      await expect(monitor.getPBFTForgingStatus).toBeFunction()
    })
  })

  describe('downloadBlocks', async () => {
    it('should be a function', async () => {
      await expect(monitor.downloadBlocks).toBeFunction()
    })
  })

  describe('broadcastBlock', async () => {
    it('should be a function', async () => {
      await expect(monitor.broadcastBlock).toBeFunction()
    })
  })

  describe('broadcastTransactions', async () => {
    it('should be a function', async () => {
      await expect(monitor.broadcastTransactions).toBeFunction()
    })
  })

  describe('__registerListeners', async () => {
    it('should be a function', async () => {
      await expect(monitor.__registerListeners).toBeFunction()
    })
  })
})
