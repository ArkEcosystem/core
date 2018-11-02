'use strict'

const PluginRegistrar = require('./registrars/plugin')
const Environment = require('./environment')
const { createContainer } = require('awilix')
const delay = require('delay')

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
   * Force the container to exit and print the given message and associated error.
   * @param  {String} message
   * @param  {Error} error
   * @return {void}
   */
  forceExit (message, error = null) {
    this.exit(1, message, error)
  }

  /**
   * Exit the container with the given exitCode, message and associated error.
   * @param  {Number} exitCode
   * @param  {String} message
   * @param  {Error} error
   * @return {void}
   */
  exit (exitCode, message, error = null) {
    this.shuttingDown = true

    const logger = this.resolvePlugin('logger')
    logger.error(':boom: Container force shutdown :boom:')
    logger.error(message)

    if (error) {
      logger.error(error.stack)
    }

    process.exit(exitCode)
  }

  /**
   * Handle any exit signals.
   * @return {void}
   */
  __registerExitHandler () {
    const handleExit = async () => {
      if (this.shuttingDown) {
        return
      }

      this.shuttingDown = true

      const logger = this.resolvePlugin('logger')
      logger.info('Ark Core is trying to gracefully shut down to avoid data corruption :pizza:')

      try {
        const database = this.resolvePlugin('database')
        if (database) {
          const emitter = this.resolvePlugin('event-emitter')

          // Notify plugins about shutdown
          emitter.emit('shutdown')

          // Wait for event to be emitted and give time to finish
          await delay(1000)

          // Save dirty wallets
          await database.saveWallets(false)
        }
      } catch (error) {
        console.log(error.stack)
      }

      await this.plugins.tearDown()

      process.exit()
    }

    // Handle exit events
    ['SIGINT', 'exit'].forEach(eventType => process.on(eventType, handleExit))
  }
}
