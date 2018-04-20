'use strict';

const path = require('path')
const fs = require('fs-extra')
const dirTree = require('directory-tree')
const isString = require('lodash/isString')
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

    await this.__copyFiles(files)

    this.__createBindings(files)
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
      throw new Error('The directory does not exist or is not accessible because of security settings.')
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
}
