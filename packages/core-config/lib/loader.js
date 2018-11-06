'use strict'

const axios = require('axios')
const dirTree = require('directory-tree')
const fs = require('fs-extra')
const ow = require('ow')
const path = require('path')
const { configManager } = require('@arkecosystem/crypto')

class ConfigLoader {
  /**
   * Make the config instance.
   * @param  {Object} options
   * @return {ConfigLoader}
   */
  async setUp (options) {
    this.options = options
    this.network = JSON.parse(process.env.ARK_NETWORK)

    await this.__createFromDirectory()

    this._validateConfig()

    this.configureCrypto()

    return this
  }

  /**
   * Get constants for the specified height.
   * @param  {Number} height
   * @return {void}
   */
  getConstants (height) {
    return configManager.getConstants(height)
  }

  /**
   * Configure the crypto package.
   * @return {void}
   */
  configureCrypto () {
    configManager.setConfig(this.network)
  }

  /**
   * Copy the config files to the given destination.
   * @param  {String} dest
   * @return {Promise}
   */
  async copyFiles (dest) {
    if (!dest) {
      dest = `${process.env.ARK_PATH_DATA}/config`
    }

    await fs.ensureDir(dest)

    return fs.copy(process.env.ARK_PATH_CONFIG, dest)
  }

  /**
   * Load and bind the config.
   * @return {void}
   */
  async __createFromDirectory () {
    const files = this.__getFiles()

    this.__createBindings(files)

    await this.__buildPeers(files.peers)
  }

  /**
   * Bind the config values to the instance.
   * @param  {Array} files
   * @return {void}
   */
  __createBindings (files) {
    for (const [key, value] of Object.entries(files)) {
      this[key] = require(value)
    }
  }

  /**
   * Get all config files.
   * @return {Object}
   */
  __getFiles () {
    const basePath = path.resolve(process.env.ARK_PATH_CONFIG)

    if (!fs.existsSync(basePath)) {
      throw new Error('An invalid configuration was provided or is inaccessible due to it\'s security settings.')
      process.exit(1) // eslint-disable-line no-unreachable
    }

    const formatName = (file) => path.basename(file.name, path.extname(file.name))

    let configTree = {}

    dirTree(basePath, { extensions: /\.(js|json)$/ }).children.forEach(entry => {
      if (entry.type === 'file') {
        configTree[formatName(entry)] = entry.path
      }
    })

    return configTree
  }

  /**
   * Build the peer list either from a local file, remote file or object.
   * @param  {String} configFile
   * @return {void}
   */
  async __buildPeers (configFile) {
    if (!this.peers.sources) {
      return
    }

    let output = require(configFile)

    for (let i = this.peers.sources.length - 1; i >= 0; i--) {
      const source = this.peers.sources[i]

      // Local File...
      if (source.startsWith('/')) {
        output.list = require(source)

        fs.writeFileSync(configFile, JSON.stringify(output, null, 2))

        break
      }

      // URL...
      try {
        const response = await axios.get(source)

        output.list = response.data

        fs.writeFileSync(configFile, JSON.stringify(output, null, 2))

        break
      } catch (error) {
        console.error(error.message)
      }
    }
  }

  /**
   * Validate crucial parts of the configuration.
   * @return {void}
   */
  _validateConfig () {
    try {
      ow(this.network.pubKeyHash, ow.number)
      ow(this.network.nethash, ow.string.length(64))
      ow(this.network.wif, ow.number)
    } catch (error) {
      console.error('Invalid configuration. Shutting down :rotating_light:')
      throw Error(error.message)
      process.exit(1) // eslint-disable-line no-unreachable
    }
  }
}

module.exports = new ConfigLoader()
