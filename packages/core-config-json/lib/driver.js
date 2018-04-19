'use strict';

const { ConfigInterface } = require('@arkecosystem/core-config')
const path = require('path')
const fs = require('fs')
const dirTree = require('directory-tree')
const isString = require('lodash/isString')
const assert = require('assert-plus')

module.exports = class Config extends ConfigInterface {
  /**
   * [make description]
   * @return {[type]} [description]
   */
  async make () {
    let options = this.options

    if (isString(options.network)) {
      options = this.__loadFromPath()
    }

    assert.object(options)

    for (const [key, value] of Object.entries(options)) {
      this[key] = value
    }

    this.__buildConstants()

    return this
  }

  /**
   * [__loadFromPath description]
   * @return {[type]} [description]
   */
  __loadFromPath () {
    const basePath = path.resolve(this.options.network)

    if (!fs.existsSync(basePath)) {
      throw new Error('The directory does not exist or is not accessible because of security settings.')
    }

    const formatName = (file) => path.basename(file.name, path.extname(file.name))

    let configTree = {}

    dirTree(basePath, { extensions: /\.js/ }).children.forEach(entry => {
      let name = formatName(entry)

      if (entry.type === 'directory') {
        configTree[name] = {}
        entry.children.forEach(e => (configTree[name][formatName(e)] = require(e.path)))
      } else {
        configTree[name] = require(entry.path)
      }
    })

    return configTree
  }
}
