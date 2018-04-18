'use strict';

const path = require('path')
const fs = require('fs')
const dirTree = require('directory-tree')
const deepmerge = require('deepmerge')
const isString = require('lodash/isString')
const assert = require('assert-plus')

let instance

class Manager {
  /**
   * [constructor description]
   * @return {[type]} [description]
   */
  constructor () {
    if (!instance) {
      instance = this
    }

    return instance
  }

  /**
   * [init description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  async init (config) {
    if (isString(config)) {
      config = this.__loadFromPath(config)
    }

    assert.object(config)

    for (const [key, value] of Object.entries(config)) {
      this[key] = value
    }

    this.buildConstants()

    return this
  }

  /**
   * [buildConstants description]
   * @return {[type]} [description]
   */
  buildConstants () {
    this.constants = this.network.constants.sort((a, b) => a.height - b.height)
    this.constant = {
      index: 0,
      data: this.constants[0]
    }

    let lastmerged = 0

    while (lastmerged < this.constants.length - 1) {
      this.constants[lastmerged + 1] = deepmerge(this.constants[lastmerged], this.constants[lastmerged + 1])
      lastmerged++
    }
  }

  /**
   * [getConstants description]
   * @param  {[type]} height [description]
   * @return {[type]}        [description]
   */
  getConstants (height) {
    while ((this.constant.index < this.constants.length - 1) && height >= this.constants[this.constant.index + 1].height) {
      this.constant.index++
      this.constant.data = this.constants[this.constant.index]
    }
    while (height < this.constants[this.constant.index].height) {
      this.constant.index--
      this.constant.data = this.constants[this.constant.index]
    }

    return this.constant.data
  }

  /**
   * [__loadFromPath description]
   * @param  {[type]} network [description]
   * @return {[type]}         [description]
   */
  __loadFromPath (network) {
    const basePath = path.resolve(network)

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

/**
 * [exports description]
 * @type {Manager}
 */
module.exports = new Manager()
