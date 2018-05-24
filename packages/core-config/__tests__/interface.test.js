'use strict'

const ConfigInterface = require('../lib/interface')
const fixture = require('./__fixtures__/constants.json')
const networkConfig = require('../../crypto/lib/networks/ark/testnet.json')

let instance

beforeAll(() => {
  process.env.ARK_NETWORK = JSON.stringify(networkConfig)

  instance = new ConfigInterface()
  instance.network = networkConfig
});

describe('Config Interface', () => {
  it('should be an object', () => {
    expect(instance).toBeObject()
  })

  describe('getConstants', () => {
    it('should be a function', () => {
      expect(instance.getConstants).toBeFunction()
    })

    it('should return valid constants', async () => {
      instance.buildConstants()

      expect(instance.getConstants(1)).toEqual(fixture[0])
      expect(instance.getConstants(75600)).toEqual(fixture[1])
    })
  })

  describe('buildConstants', () => {
    it('should be a function', () => {
      expect(instance.buildConstants).toBeFunction()
    })
  })

  describe('_validateConfig', () => {
    it('should be a function', () => {
      expect(instance._validateConfig).toBeFunction()
    })

    it('should not throw on valid config', async () => {
      expect(() => {
        instance._validateConfig()
      }).not.toThrow()
    })

    it('should throw on invalid config', async () => {
      instance.network = networkConfig
      instance.network.pubKeyHash = 'invalid-pubKeyHash'

      expect(() => {
        instance._validateConfig()
      }).toThrow()
    })
  })
})
