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
      const pluginName = `./plugin-${char}`
      expect(instance.plugins[pluginName]).toBeObject()
    })

    expect(instance.plugins['./plugin-b']).toHaveProperty('property', 'value')
  })

  describe('register', () => {
    it('should be a function', () => {
      expect(instance.setUp).toBeFunction()
    })

    it('should register plugins with relative paths', async () => {
      const pluginName = './plugin-a'

      await instance.register(pluginName, { enabled: false })

      expect(instance.container.has('stub-plugin-a')).toBeTrue()
    })

    xit('should register plugins with @ paths', () => {
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
      it('should register the plugins but ignore the rest', async () => {
        instance.options.exit = './plugin-a'

        await instance.setUp()

        expect(instance.container.has('stub-plugin-a')).toBeTrue()

        ;['b', 'c'].forEach(char => {
          expect(instance.container.has(`stub-plugin-${char}`)).toBeFalse()
        })
      })
    })
  })

  describe('tearDown', () => {
    xit('should deregister all the plugins in inverse order', async () => {
      await instance.setUp()

      ;['a', 'b', 'c'].forEach(char => {
        expect(instance.container.has(`stub-plugin-${char}`)).toBeTrue()
      })

      await instance.tearDown()

      ;['a', 'b', 'c'].forEach(char => {
        expect(instance.container.has(`stub-plugin-${char}`)).toBeFalse()
      })
    })

    it('should deregister plugins supporting deregister', async () => {
      await instance.setUp()

      ;['a', 'b', 'c'].forEach(char => {
        expect(instance.container.has(`stub-plugin-${char}`)).toBeTrue()
      })

      const plugins = {}
      await instance.tearDown()
      ;['a', 'b', 'c'].forEach(char => {
        plugins[char] = (require(`${stubPluginPath}/plugin-${char}`))
      })

      ;['a', 'b'].forEach(char => {
        const ref = plugins[char]
        expect(ref.plugin).not.toBeNull()
        expect(ref.plugin.deregister).toHaveBeenCalled()
      })
      // plugin-c does not support deregister
      const refC = plugins['c']
      expect(refC.plugin).not.toBeNull()
      expect(refC.plugin.deregister).not.toBeDefined()
    })
  })
})
