// @ts-check
const deepmerge = require('deepmerge')

let instance = null

class Config {
  constructor () {
    if (!instance) {
      instance = this
    }
    return instance
  }

  init (config) {
    this.server = config.server
    this.network = config.network
    this.genesisBlock = config.genesisBlock
    this.delegates = config.delegates
    this.buildConstants()
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
}

module.exports = new Config()
