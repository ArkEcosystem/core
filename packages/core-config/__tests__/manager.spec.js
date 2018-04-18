'use strict';

const path = require('path')
const config = require('../src/manager')

const stubConfigPath = path.resolve(__dirname, './stubs')

const stubConfig = {
  delegates: require('./stubs/delegates'),
  genesisBlock: require('./stubs/genesisBlock'),
  network: require('./stubs/network')
}

describe('Manager', () => {
  it('should fail without a config', async () => {
    try {
      await config.init()
    } catch (error) {
      await expect(error.message).toEqual('undefined (object) is required')
    }
  })

  it('should succeed with a config from a string', async () => {
    const result = await config.init(stubConfigPath)

    await expect(result.delegates).toEqual(stubConfig.delegates)
    await expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    await expect(result.network).toEqual(stubConfig.network)
  })

  it('should succeed with a config from an object', async () => {
    const result = await config.init(stubConfig)

    await expect(result.delegates).toEqual(stubConfig.delegates)
    await expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    await expect(result.network).toEqual(stubConfig.network)
  })
})
