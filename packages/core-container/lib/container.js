'use strict'

const PluginRegistrar = require('./registrars/plugin')
const Environment = require('./environment')
const { createContainer } = require('awilix')

module.exports = class Container {
  /**
   * Create a new container instance.
   * @constructor
   */
  constructor () {
    this.container = createContainer()

    this.__registerExitHandler()
  }

  /**
   * Set up the container.
   * @param  {Object} variables
   * @param  {Object} options
   * @return {void}
   */
  async setUp (variables, options = {}) {
    this.env = new Environment(variables)
    this.env.setUp()

    if (options.skipPlugins) {
      return
    }

    // TODO: Move this out eventually - not really the responsibility of the container
    this.plugins = new PluginRegistrar(this, options)
    await this.plugins.setUp()
  }

  /**
   * Tear down the container.
   * @return {Promise}
   */
  async tearDown () {
    return this.plugins.tearDown()
  }

  /**
   * Add a new registration.
   * @param  {string} key
   * @return {Object}
   * @throws {Error}
   */
  register (name, resolver) {
    try {
      return this.container.register(name, resolver)
    } catch (err) {
      throw new Error(err.message)
    }
  }

  /**
   * Resolve a registration.
   * @param  {string} key
   * @return {Object}
   * @throws {Error}
   */
  resolve (key) {
    try {
      return this.container.resolve(key)
    } catch (err) {
      throw new Error(err.message)
    }
  }

  /**
   * Resolve a plugin.
   * @param  {string} key
   * @return {Object}
   * @throws {Error}
   */
  resolvePlugin (key) {
    try {
      return this.container.resolve(key).plugin
    } catch (err) {
      return null
    }
  }

  /**
   * Resolve the options of a plugin. Available before a plugin mounts.
   * @param  {string} key
   * @return {Object}
   * @throws {Error}
   */
  resolveOptions (key) {
    return this.plugins.resolveOptions(key)
  }

  /**
   * Determine if the given registration exists.
   * @param  {String}  key
   * @return {Boolean}
   */
  has (key) {
    try {
      this.container.resolve(key)

      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Handle any exit signals.
   * @return {void}
   */
  __registerExitHandler () {
    let shuttingDown = false

    const handleExit = async () => {
      if (shuttingDown) {
        return
      }

      shuttingDown = true

      const logger = this.resolvePlugin('logger')
      logger.info('EXIT handled, trying to shut down gracefully')
      logger.info('Stopping Ark Core')

      try {
        logger.info('Saving wallets')
        await this.resolvePlugin('database').saveWallets(false)
      } catch (error) {}

      // const lastBlock = this.resolvePlugin('blockchain').getLastBlock()

      // if (lastBlock) {
      //   const spvFile = `${process.env.ARK_PATH_DATA}/spv.json`
      //   await fs.writeFile(spvFile, JSON.stringify(lastBlock.data))
      // }

      await this.plugins.tearDown()

      process.exit()
    }

    // Handle exit events
    ['SIGINT', 'exit'].forEach(eventType => process.on(eventType, handleExit))
  }
}
