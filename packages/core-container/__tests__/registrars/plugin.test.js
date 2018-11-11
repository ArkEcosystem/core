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
    ['a', 'b', 'c'].forEach(char => {
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

    it.skip('should register plugins with @ paths', () => {})
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
    const plugins = {}

    beforeEach(async () => {
      await instance.setUp()
      ;['a', 'b', 'c'].forEach(char => {
        expect(instance.container.has(`stub-plugin-${char}`)).toBeTrue()
      })
      ;['a', 'b', 'c'].forEach(char => {
        plugins[char] = require(`${stubPluginPath}/plugin-${char}`)
      })
    })

    it('should deregister plugins supporting deregister', async () => {
      ['a', 'b'].forEach(char => {
        plugins[char].plugin.deregister = jest.fn()
      })

      await instance.tearDown()
      ;['a', 'b'].forEach(char => {
        expect(plugins[char].plugin.deregister).toHaveBeenCalled()
      })

      expect(plugins.c.deregister).not.toBeDefined()
    })

    it('should deregister all the plugins in inverse order', async () => {
      const spy = jest.fn()
      ;['a', 'b'].forEach(char => {
        plugins[char].plugin.deregister = () => spy(char)
      })

      await instance.tearDown()

      expect(spy).toHaveBeenNthCalledWith(1, 'b')
      expect(spy).toHaveBeenNthCalledWith(2, 'a')
    })
  })
})
