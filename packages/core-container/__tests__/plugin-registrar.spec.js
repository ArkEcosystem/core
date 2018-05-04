'use strict'

const path = require('path')
const registrar = require('../lib/plugin-registrar')

const stubPlugins = require('./__stubs__/plugins.js')
const stubPluginPath = path.resolve(__dirname, './__stubs__')

describe('Plugin Registrar', () => {
  it('should be an object', async () => {
    await expect(registrar).toBeObject()
  })

  it('should register plugin list from file', async () => {
    await registrar.init(stubPluginPath)

    await expect(registrar.plugins).toEqual(stubPlugins)
  })

  it('should register a hook', async () => {
    await registrar.init(stubPluginPath)
    await registrar.plugins.load('init')

    await expect(registrar.has('stub-plugin')).toBeTruthy()
  })

  it('should register a plugin', async () => {
    const pluginName = './__tests__/__stubs__/plugin'
    const pluginConfig = stubPlugins.init[pluginName]

    await registrar.init(stubPluginPath)
    await registrar.register(pluginName, pluginConfig)

    await expect(registrar.has('stub-plugin')).toBeTruthy()
  })
})
