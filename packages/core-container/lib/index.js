'use strict'

const fs = require('fs')
const path = require('path')
const expandHomeDir = require('expand-home-dir')
const PluginRegistrar = require('./registrars/plugin')
const { createContainer } = require('awilix')

class Container {
  /**
   * Create a new container instance.
   * @constructor
   */
  constructor () {
    this.container = createContainer()

    this.__registerExitHandler()
  }

  /**
   * Initialise the container.
   * @param  {Object} paths
   * @param  {Object} options
   * @return {void}
   */
  init (paths, options = {}) {
    this._exposeEnvironmentVariables(paths)

    /**
     * TODO: Move this out eventually - not really it's responsiblity
     */
    this.plugins = new PluginRegistrar(this, options)
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
      throw new Error(err.message)
    }
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
   * Expose some variables to the environment.
   * @return {void}
   */
  _exposeEnvironmentVariables (paths) {
    for (let [key, value] of Object.entries(paths)) {
      process.env[`ARK_PATH_${key.toUpperCase()}`] = expandHomeDir(value)
    }

    const envPath = expandHomeDir(`${paths.data}/.env`)
    if (fs.existsSync(envPath)) {
      const env = require('envfile').parseFileSync(envPath)
      Object.keys(env).forEach(key => (process.env[key] = env[key]))
    }

    const network = path.resolve(expandHomeDir(`${paths.config}/network.json`))

    process.env.ARK_NETWORK = require(network).name
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
      logger.info('Stopping ARK Core...')

      // await this.resolvePlugin('database').saveWallets(true)

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

/**
 * @type {Container}
 */
module.exports = new Container()
