'use strict'

const expandHomeDir = require('expand-home-dir')
const PluginRegistrar = require('./plugin-registrar')
const { createContainer } = require('awilix')

class Container {
  /**
   * Create a new plugin manager instance.
   * @constructor
   */
  constructor () {
    this.container = createContainer()

    this.__registerExitHandler()
  }

  /**
   * Initialise the plugin container.
   * @param  {Object} paths
   * @param  {Object} options
   * @return {void}
   */
  init (paths, options = {}) {
    this.__exportPaths(paths)

    /**
     * TODO: Move this outside of the container as it isn't it's responsibility...
     */
    this.plugins = new PluginRegistrar(this, options)
  }

  /**
   * Get a plugin instance.
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
   * Resolve an instance from the .
   * @param  {string} key
   * @return {Object}
   * @throws {Error}
   */
  get (key) {
    try {
      return this.container.resolve(key).plugin
    } catch (err) {
      throw new Error(err.message)
    }
  }

  /**
   * Determine if the given plugin exists.
   * @param  {String}  key
   * @return {Boolean}
   */
  has (key) {
    try {
      this.container.get(key)

      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Get the configuration of a plugin.
   * @param  {String} key
   * @return {Object}
   * @throws {Error}
   */
  config (key) {
    try {
      return this.container.get(key).options
    } catch (err) {
      throw new Error(`The service "${key}" is not available.`)
    }
  }

  /**
   * Export path variables before we bootstrap any plugins.
   * @param  {Object} paths
   * @return {void}
   */
  __exportPaths (paths) {
    for (let [key, value] of Object.entries(paths)) {
      process.env[`ARK_PATH_${key.toUpperCase()}`] = expandHomeDir(value)
    }
  }

  /**
   * Handle any exit signals.
   * @return {void}
   */
  __registerExitHandler () {
    const handleExit = async () => {
      this.get('logger').info('Stopping ARK Core...')

      // await this.get('database').saveWallets(true)

      // const lastBlock = this.get('blockchain').getLastBlock()

      // if (lastBlock) {
      //   const spvFile = `${process.env.ARK_PATH_DATA}/spv.json`
      //   await fs.writeFile(spvFile, JSON.stringify(lastBlock.data))
      // }

      await this.plugins.teardown()

      process.exit()
    }

    // Handle CTRL + C
    ['SIGINT'].forEach((eventType) => process.on(eventType, handleExit))
  }
}

/**
 * @type {Container}
 */
module.exports = new Container()
