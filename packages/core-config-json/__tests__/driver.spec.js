'use strict';

const path = require('path')
const JsonDriver = require('../lib/driver')

const stubConfigPath = path.resolve(__dirname, './stubs')

const stubConfig = {
  delegates: require('./stubs/delegates'),
  genesisBlock: require('./stubs/genesisBlock'),
  network: require('./stubs/network')
}

describe('JSON Driver', () => {
  it('should fail without a config', async () => {
    try {
      const driver = new JsonDriver(stubConfigPath)
      await driver.make()
    } catch (error) {
      await expect(error.message).toEqual('undefined (object) is required')
    }
  })

  it('should succeed with a config from a string', async () => {
    const driver = new JsonDriver(stubConfigPath)
    const result = await driver.make()

    await expect(result.delegates).toEqual(stubConfig.delegates)
    await expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    await expect(result.network).toEqual(stubConfig.network)
  })

  it('should succeed with a config from an object', async () => {
    const driver = new JsonDriver(stubConfig)
    const result = await driver.make()

    await expect(result.delegates).toEqual(stubConfig.delegates)
    await expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    await expect(result.network).toEqual(stubConfig.network)
  })
})
