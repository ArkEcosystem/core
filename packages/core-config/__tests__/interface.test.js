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
  it('should be an object', async () => {
    await expect(instance).toBeObject()
  })

  describe('getConstants', async () => {
    it('should be a function', async () => {
      await expect(instance.getConstants).toBeFunction()
    })

    it('should return valid constants', async () => {
      instance._buildConstants()

      await expect(instance.getConstants(1)).toEqual(fixture[0])
      await expect(instance.getConstants(75600)).toEqual(fixture[1])
    })
  })

  describe('_buildConstants', async () => {
    it('should be a function', async () => {
      await expect(instance._buildConstants).toBeFunction()
    })

    it('should build valid constants', async () => {
      instance._buildConstants()

      await expect(instance.constants).toEqual(fixture)
    })
  })

  describe('_exposeEnvironmentVariables', async () => {
    it('should be a function', async () => {
      await expect(instance._exposeEnvironmentVariables).toBeFunction()
    })

    it('should expose environment variables', async () => {
      instance._exposeEnvironmentVariables()

      await expect(process.env.ARK_NETWORK).toBe('testnet')
    })
  })

  describe('_validateConfig', async () => {
    it('should be a function', async () => {
      await expect(instance._validateConfig).toBeFunction()
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
