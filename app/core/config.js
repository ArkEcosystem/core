const path = require('path')
const fs = require('fs')
const dirTree = require('directory-tree')
const Sntp = require('sntp')
const deepmerge = require('deepmerge')
const isString = require('lodash/isString')
const logger = require('app/core/logger')
const assert = require('assert-plus')

let instance = null

class Config {
  constructor () {
    if (!instance) {
      instance = this
    }

    return instance
  }

  async init (config) {
    try {
      if (isString(config)) {
        config = this._loadFromFile(config)
      }

      assert.object(config)

      for (const [key, value] of Object.entries(config)) {
        this[key] = value
      }

      logger.init(this.server, this.network.name)

      const time = await this.ntp()
      logger.debug('Local clock is off by ' + parseInt(time.t) + 'ms from NTP ⏰')

      this.buildConstants()

      return this
    } catch (error) {
      logger.error(error.stack)
    }
  }

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

  async ntp () {
    try {
      return Sntp.time()
    } catch (error) {
      logger.warn('can\'t ping ntp')
      return {t: 0}
    }
  }

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

  _loadFromFile (network) {
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

module.exports = new Config()
