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
      return Math.ceil(moment.duration(actual.diff(moment.now())).asMinutes())
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
      const { until, reason } = guard.__determineSuspensionTime({
        ip: 'dummy-ip-addr'
      })

      expect(convertToMinutes(until)).toBe(1440)
      expect(reason).toBe('Blacklisted')
    })

    it('should return a 6 hours suspension for "Invalid Version"', () => {
      const { until, reason } = guard.__determineSuspensionTime({
        version: '1.0.0'
      })

      expect(convertToMinutes(until)).toBe(360)
      expect(reason).toBe('Invalid Version')
    })

    it('should return a 10 minutes suspension for "Node is not at height"', () => {
      guard.monitor.getNetworkHeight = jest.fn(() => 154)

      const { until, reason } = guard.__determineSuspensionTime({
        ...dummy,
        state: {
          height: 1
        }
      })

      expect(convertToMinutes(until)).toBe(10)
      expect(reason).toBe('Node is not at height')
    })

    it('should return a 5 minutes suspension for "Invalid Response Status"', () => {
      const { until, reason } = guard.__determineSuspensionTime({
        ...dummy,
        ...{ status: 201 }
      })

      expect(convertToMinutes(until)).toBe(5)
      expect(reason).toBe('Invalid Response Status')
    })

    it('should return a 2 minutes suspension for "Timeout"', () => {
      const { until, reason } = guard.__determineSuspensionTime({
        ...dummy,
        ...{ delay: -1 }
      })

      expect(convertToMinutes(until)).toBe(2)
      expect(reason).toBe('Timeout')
    })

    it('should return a 1 minutes suspension for "High Latency"', () => {
      const { until, reason } = guard.__determineSuspensionTime({
        ...dummy,
        ...{ delay: 3000 }
      })

      expect(convertToMinutes(until)).toBe(1)
      expect(reason).toBe('High Latency')
    })

    it('should return a 30 minutes suspension for "Unknown"', () => {
      const { until, reason } = guard.__determineSuspensionTime(dummy)

      expect(convertToMinutes(until)).toBe(30)
      expect(reason).toBe('Unknown')
    })
  })
})
