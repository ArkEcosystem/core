'use strict';

const axios = require('axios')
const dirTree = require('directory-tree')
const fs = require('fs-extra')
const path = require('path')
const { ConfigInterface, getTargetDirectory } = require('@arkecosystem/core-config')

module.exports = class Config extends ConfigInterface {
  /**
   * [make description]
   * @return {[type]} [description]
   */
  async make () {
    await this.__createFromDirectory()

    this.__buildConstants()

    return this
  }

  /**
   * [__createFromDirectory description]
   * @return {[type]} [description]
   */
  async __createFromDirectory () {
    const files = this.__getFiles()

    this.__createBindings(files)

    await this.__buildPeers(files.peers)

    await this.__copyFiles(files)
  }

  /**
   * [__createBindings description]
   * @param  {[type]} files [description]
   * @return {[type]}       [description]
   */
  __createBindings (files) {
    for (const [key, value] of Object.entries(files)) {
      this[key] = require(value)
    }
  }

  /**
   * [__getFiles description]
   * @return {[type]} [description]
   */
  __getFiles () {
    const basePath = path.resolve(this.options.config)

    if (!fs.existsSync(basePath)) {
      throw new Error('An invalid configuration was provided or is inaccessible due to it\'s security settings.')
      process.exit(1) // eslint-disable-line no-unreachable
    }

    const formatName = (file) => path.basename(file.name, path.extname(file.name))

    let configTree = {}

    dirTree(basePath, { extensions: /\.js/ }).children.forEach(entry => {
      if (entry.type === 'file') {
        configTree[formatName(entry)] = entry.path
      }
    })

    return configTree
  }

  /**
   * [__copyFiles description]
   * @return {[type]} [description]
   */
  async __copyFiles () {
    await fs.ensureDir(this.options.config)

    return fs.copy(this.options.config, getTargetDirectory('config'))
  }

  /**
   * [__buildPeers description]
   * @param  {[type]} configFile [description]
   * @return {[type]}            [description]
   */
  async __buildPeers (configFile) {
    if (!this.peers.sources) {
      return false
    }

    let output = require(configFile)

    for (let i = this.peers.sources.length - 1; i >= 0; i--) {
      const source = this.peers.sources[i]

      // Local File...
      if (source.startsWith('/')) {
        output.list = require(source)

        // TODO: for now we will write into the core-config files, this will later on be ~/.ark/config/peers.json
        fs.writeFileSync(configFile, JSON.stringify(output, null, 2))

        break
      }

      // URLs...
      try {
        const response = await axios.get(source)

        output.list = response.data

        // TODO: for now we will write into the core-config files, this will later on be ~/.ark/config/peers.json
        fs.writeFileSync(configFile, JSON.stringify(output, null, 2))

        break
      } catch (error) {
        console.log(error.message)
      }
    }
  }
}
