'use strict'

const path = require('path')
const PluginRegistrar = require('../../lib/registrars/plugin')

const stubPlugins = require('../__stubs__/plugins.js')
const stubPluginPath = path.resolve(__dirname, '../__stubs__')

let instance
beforeEach(() => {
  process.env.ARK_PATH_CONFIG = stubPluginPath

  const container = require('../../lib')
  instance = new PluginRegistrar(container)
})

describe('Plugin Registrar', () => {
  it('should be an object', async () => {
    await expect(instance).toBeObject()
  })

  it('should register a hook', async () => {
    await instance.registerGroup('init')

    await expect(instance.container.has('stub-plugin')).toBeTruthy()
  })

  it('should register a plugin', async () => {
    const pluginName = './__tests__/__stubs__/plugin'

    await instance.register(pluginName, { enabled: false })

    await expect(instance.container.has('stub-plugin')).toBeTruthy()
  })
})
