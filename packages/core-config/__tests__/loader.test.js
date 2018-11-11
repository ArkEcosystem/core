const path = require('path')
const configLoader = require('../lib/loader')

const stubConfigPath = path.resolve(__dirname, './__stubs__')

const stubConfig = {
  delegates: require('./__stubs__/delegates'),
  genesisBlock: require('./__stubs__/genesisBlock'),
  network: require('./__stubs__/network'),
}

beforeEach(() => {
  process.env.ARK_PATH_CONFIG = stubConfigPath
  process.env.ARK_NETWORK = JSON.stringify(stubConfig.network)
})

afterEach(() => {
  delete process.env.ARK_PATH_CONFIG
})

describe('Config Loader', () => {
  it('should fail without a config', async () => {
    try {
      await configLoader.setUp()
    } catch (error) {
      expect(error.message).toEqual('undefined (object) is required')
    }
  })

  it('should succeed with a config from a string', async () => {
    const result = await configLoader.setUp()

    expect(result.delegates).toEqual(stubConfig.delegates)
    expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    expect(result.network).toEqual(stubConfig.network)
  })

  it('should succeed with a config from an object', async () => {
    const result = await configLoader.setUp()

    expect(result.delegates).toEqual(stubConfig.delegates)
    expect(result.genesisBlock).toEqual(stubConfig.genesisBlock)
    expect(result.network).toEqual(stubConfig.network)
  })
})
