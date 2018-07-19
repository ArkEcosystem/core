'use strict'

const app = require('./__support__/setup')

let manager

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  manager = new (require('../lib/manager'))(require('../lib/defaults'))
})

describe('Peer Manager', () => {
  it('should be an object', () => {
    expect(manager).toBeObject()
  })

  describe('start', () => {
    it('should be a function', () => {
      expect(manager.start).toBeFunction()
    })
  })

  describe('stop', () => {
    it('should be a function', () => {
      expect(manager.stop).toBeFunction()
    })
  })

  describe('updateNetworkStatus', () => {
    it('should be a function', () => {
      expect(manager.updateNetworkStatus).toBeFunction()
    })
  })

  describe('downloadBlocks', () => {
    it('should be a function', () => {
      expect(manager.downloadBlocks).toBeFunction()
    })
  })

  describe('broadcastBlock', () => {
    it('should be a function', () => {
      expect(manager.broadcastBlock).toBeFunction()
    })
  })

  describe('broadcastTransactions', () => {
    it('should be a function', () => {
      expect(manager.broadcastTransactions).toBeFunction()
    })
  })

  describe('acceptNewPeer', () => {
    it('should be a function', () => {
      expect(manager.acceptNewPeer).toBeFunction()
    })
  })

  describe('getPeers', () => {
    it('should be a function', () => {
      expect(manager.getPeers).toBeFunction()
    })
  })

  describe('getNetworkHeight', () => {
    it('should be a function', () => {
      expect(manager.getNetworkHeight).toBeFunction()
    })
  })

  describe('__checkDNSConnectivity', () => {
    it('should be a function', () => {
      expect(manager.__checkDNSConnectivity).toBeFunction()
    })
  })

  describe('__checkNTPConnectivity', () => {
    it('should be a function', () => {
      expect(manager.__checkNTPConnectivity).toBeFunction()
    })
  })
})
