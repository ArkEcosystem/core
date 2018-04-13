const path = require('path')
const config = require('@arkecosystem/core-config')

const stubConfigPath = 'config/devnet'
const stubConfig = {
  api: {
    p2p: require(path.resolve(stubConfigPath, 'api/p2p.json')),
    public: require(path.resolve(stubConfigPath, 'api/public.json'))
  },
  delegates: require(path.resolve(stubConfigPath, 'delegates.json')),
  genesisBlock: require(path.resolve(stubConfigPath, 'genesisBlock.json')),
  network: require(path.resolve(stubConfigPath, 'network.json')),
  server: require(path.resolve(stubConfigPath, 'server.json')),
  webhooks: require(path.resolve(stubConfigPath, 'webhooks.json'))
}

describe('Core | Config', () => {
  it('should fail without a config', async () => {
    try {
      await config.init()
    } catch (error) {
      await expect(error.message).toEqual('Cannot read property \'api\' of undefined')
    }
  })

  it('should succeed with a config from a string', async () => {
    const result = await config.init(stubConfigPath)

    await expect(result.api.p2p).toEqual(stubConfig.api.p2p)
    await expect(result.api.public).toEqual(stubConfig.api.public)
    await expect(result.delegates).toEqual(stubConfig.delegates)
    await expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    await expect(result.network).toEqual(stubConfig.network)
    await expect(result.server).toEqual(stubConfig.server)
    await expect(result.webhooks).toEqual(stubConfig.webhooks)
  })

  it('should succeed with a config from an object', async () => {
    const result = await config.init(stubConfig)

    await expect(result.api.p2p).toEqual(stubConfig.api.p2p)
    await expect(result.api.public).toEqual(stubConfig.api.public)
    await expect(result.delegates).toEqual(stubConfig.delegates)
    await expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    await expect(result.network).toEqual(stubConfig.network)
    await expect(result.server).toEqual(stubConfig.server)
    await expect(result.webhooks).toEqual(stubConfig.webhooks)
  })
})
