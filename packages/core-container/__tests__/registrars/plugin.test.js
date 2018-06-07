'use strict'

const path = require('path')
const Container = require('../../lib/container')
const PluginRegistrar = require('../../lib/registrars/plugin')

const stubPluginPath = path.resolve(__dirname, '../__stubs__')

let instance
beforeEach(() => {
  process.env.ARK_PATH_CONFIG = stubPluginPath

  instance = new PluginRegistrar(new Container())
})

describe('Plugin Registrar', () => {
  it('should be an object', () => {
    expect(instance).toBeObject()
  })

  it('should load the plugins and their options', () => {
    ;['a', 'b', 'c'].forEach(char => {
      const pluginName = `./__tests__/__stubs__/plugin-${char}`
      expect(instance.plugins[pluginName]).toBeObject()
    })

    expect(instance.plugins['./__tests__/__stubs__/plugin-b']).toHaveProperty('property', 'value')
  })

  describe('register', () => {
    it('should be a function', () => {
      expect(instance.setUp).toBeFunction()
    })

    it('should register a plugin', async () => {
      const pluginName = './__tests__/__stubs__/plugin-a'

      await instance.register(pluginName, { enabled: false })

      expect(instance.container.has('stub-plugin-a')).toBeTrue()
    })
  })

  describe('setUp', () => {
    it('should be a function', () => {
      expect(instance.setUp).toBeFunction()
    })

    it('should register each plugin', async () => {
      await instance.setUp()

      ;['a', 'b', 'c'].forEach(char => {
        expect(instance.container.has(`stub-plugin-${char}`)).toBeTrue()
      })
    })

    describe('with a plugin name as the value of the `exit` option', () => {
      it('should register the plugins but ignore the the rest', async () => {
        instance.options.exit = './__tests__/__stubs__/plugin-a'

        await instance.setUp()

        expect(instance.container.has('stub-plugin-a')).toBeTrue()

        ;['b', 'c'].forEach(char => {
          expect(instance.container.has(`stub-plugin-${char}`)).toBeFalse()
        })
      })
    })
  })

  describe('tearDown', () => {
    it('should deregister all the plugins in inverse order', async () => {
      await instance.setUp()

      ;['a', 'b', 'c'].forEach(char => {
        expect(instance.container.has(`stub-plugin-${char}`)).toBeTrue()
      })

      await instance.tearDown()

      ;['a', 'b', 'c'].forEach(char => {
        expect(instance.container.has(`stub-plugin-${char}`)).toBeFalse()
      })
    })
  })
})
