'use strict'

const app = require('./__support__/setup')
const moment = require('moment')
const ARK_ENV = process.env.ARK_ENV

const defaults = require('../lib/defaults')

let guard
let Peer
let peerMock

beforeAll(async () => {
  await app.setUp()

  guard = require('../lib/guard')
  Peer = require('../lib/peer')
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(async () => {
  guard.monitor.config = defaults
  guard.monitor.peers = {}

  peerMock = new Peer('0.0.0.99', 4002) // this peer is here to be ready for future use in tests (not added to initial peers)
  Object.assign(peerMock, peerMock.headers)
})

describe('Guard', () => {
  it('should be an object', () => {
    expect(guard).toBeObject()
  })

  describe('isSuspended', () => {
    it('should be a function', () => {
      expect(guard.isSuspended).toBeFunction()
    })

    it('should return true', async () => {
      process.env.ARK_ENV = false
      await guard.monitor.acceptNewPeer(peerMock)
      process.env.ARK_ENV = ARK_ENV

      expect(guard.isSuspended(peerMock)).toBe(true)
    })

    it('should return false because passed', async () => {
      process.env.ARK_ENV = false
      await guard.monitor.acceptNewPeer(peerMock)
      guard.suspensions[peerMock.ip].until = moment().subtract(1, 'minutes')
      process.env.ARK_ENV = ARK_ENV

      expect(guard.isSuspended(peerMock)).toBe(false)
    })

    it('should return false because not suspended', () => {
      expect(guard.isSuspended(peerMock)).toBe(false)
    })
  })
})
