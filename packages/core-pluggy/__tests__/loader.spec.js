const path = require('path')
const pluggy = require('../src')

const stubPlugins = require('./stubs/plugins.json')
const stubPluginFile = path.resolve(__dirname, './stubs')

describe('PluginLoader', () => {
  it('should be an object', async () => {
    await expect(pluggy).toBeObject()
  })

  it('should register plugin list from object', async () => {
    await pluggy.init(stubPlugins)

    await expect(pluggy.plugins).toEqual(stubPlugins)
  })

  it('should register plugin list from file', async () => {
    await pluggy.init(stubPluginFile)

    await expect(pluggy.plugins).toEqual(stubPlugins)
  })

  it('should register a hook', async () => {
    await pluggy.init(stubPlugins)
    await pluggy.hook('init')

    await expect(pluggy.has('stub-plugin')).toBeTruthy()
  })

  it('should register a plugin', async () => {
    const pluginName = './__tests__/stubs/plugin'
    const pluginConfig = stubPlugins.init[pluginName]

    await pluggy.init(stubPlugins)
    await pluggy.register('init', pluginName, pluginConfig)

    await expect(pluggy.has('stub-plugin')).toBeTruthy()
  })
})
