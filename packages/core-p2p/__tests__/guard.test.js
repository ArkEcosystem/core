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

  describe('__determineSuspensionTime', () => {
    const convertToMinutes = actual => {
      return Math.round(moment.duration(actual.diff(moment.now())).asMinutes())
    }

    const dummy = {
      version: '2.0.0',
      status: 200,
      state: {}
    }

    it('should be a function', () => {
      expect(guard.__determineSuspensionTime).toBeFunction()
    })

    it('should return a 1 day suspension for "Blacklisted"', () => {
      const actual = guard.__determineSuspensionTime({
        ip: 'dummy-ip-addr'
      })

      expect(convertToMinutes(actual)).toBe(1440)
    })

    it('should return a 6 hours suspension for "Invalid Version"', () => {
      const actual = guard.__determineSuspensionTime({
        version: '1.0.0'
      })

      expect(convertToMinutes(actual)).toBe(360)
    })

    it('should return a 10 minutes suspension for "Node is not at height"', () => {
      guard.monitor.getNetworkHeight = jest.fn(() => 154)

      const actual = guard.__determineSuspensionTime({
        ...dummy,
        state: {
          height: 1
        }
      })

      expect(convertToMinutes(actual)).toBe(10)
    })

    it('should return a 5 minutes suspension for "Invalid Response Status"', () => {
      const actual = guard.__determineSuspensionTime({
        ...dummy,
        ...{ status: 201 }
      })

      expect(convertToMinutes(actual)).toBe(5)
    })

    it('should return a 2 minutes suspension for "Timeout"', () => {
      const actual = guard.__determineSuspensionTime({
        ...dummy,
        ...{ delay: -1 }
      })

      expect(convertToMinutes(actual)).toBe(2)
    })

    it('should return a 1 minutes suspension for "High Latency"', () => {
      const actual = guard.__determineSuspensionTime({
        ...dummy,
        ...{ delay: 3000 }
      })

      expect(convertToMinutes(actual)).toBe(1)
    })

    it('should return a 30 minutes suspension for "Unknown"', () => {
      const actual = guard.__determineSuspensionTime(dummy)

      expect(convertToMinutes(actual)).toBe(30)
    })
  })
})
