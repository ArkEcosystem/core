'use strict'

const path = require('path')
const JsonDriver = require('../lib/driver')

const stubConfigPath = path.resolve(__dirname, './__stubs__')

const stubConfig = {
  delegates: require('./__stubs__/delegates'),
  genesisBlock: require('./__stubs__/genesisBlock'),
  network: require('./__stubs__/network')
}

beforeEach(() => {
  process.env.ARK_PATH_CONFIG = stubConfigPath
  process.env.ARK_NETWORK = JSON.stringify(stubConfig.network)
})

afterEach(() => {
  delete process.env.ARK_PATH_CONFIG
})

describe('JSON Driver', () => {
  it('should fail without a config', async () => {
    try {
      const driver = new JsonDriver()
      await driver.make()
    } catch (error) {
      expect(error.message).toEqual('undefined (object) is required')
    }
  })

  it('should succeed with a config from a string', async () => {
    const driver = new JsonDriver()
    const result = await driver.make()

    expect(result.delegates).toEqual(stubConfig.delegates)
    expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    expect(result.network).toEqual(stubConfig.network)
  })

  it('should succeed with a config from an object', async () => {
    const driver = new JsonDriver()
    const result = await driver.make()

    expect(result.delegates).toEqual(stubConfig.delegates)
    expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    expect(result.network).toEqual(stubConfig.network)
  })
})
