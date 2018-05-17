'use strict'

const ConfigInterface = require('../lib/interface')
const fixture = require('./__fixtures__/constants.json')
const networkConfig = require('../lib/networks/testnet/network.json')

let instance

beforeAll(() => {
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
      instance._buildConstants()

      expect(instance.getConstants(1)).toEqual(fixture[0])
      expect(instance.getConstants(75600)).toEqual(fixture[1])
    })
  })

  describe('_buildConstants', () => {
    it('should be a function', () => {
      expect(instance._buildConstants).toBeFunction()
    })

    it('should build valid constants', async () => {
      instance._buildConstants()

      expect(instance.constants).toEqual(fixture)
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
