'use strict'

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
    this.__exportPaths(paths)

    /**
     * TODO: Move this out eventually - not really it's responsiblity
     */
    this.plugins = new PluginRegistrar(this, options)
  }

  /**
   * Tear down the container.
   * @param  {Object} paths
   * @param  {Object} options
   * @return {void}
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
   * Export path variables before we bootstrap anything.
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
      this.resolvePlugin('logger').info('Stopping ARK Core...')

      // await this.resolvePlugin('database').saveWallets(true)

      // const lastBlock = this.resolvePlugin('blockchain').getLastBlock()

      // if (lastBlock) {
      //   const spvFile = `${process.env.ARK_PATH_DATA}/spv.json`
      //   await fs.writeFile(spvFile, JSON.stringify(lastBlock.data))
      // }

      await this.plugins.tearDown()

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
