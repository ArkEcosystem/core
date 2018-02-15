const Sntp = require('sntp')
const deepmerge = require('deepmerge')

let goofy
let instance = null

class Config {
  constructor () {
    if (!instance) {
      instance = this
    }

    return instance
  }

  async init (config) {
    this.api = config.api
    this.webhooks = config.webhooks
    this.server = config.server
    this.network = config.network
    this.genesisBlock = config.genesisBlock
    this.delegates = config.delegates

    goofy = require('app/core/goofy') // need to do here to be sure goofy is initialised
    goofy.init(this.server.consoleLogLevel, this.server.fileLogLevel, this.network.name)

    const time = await this.ntp()
    goofy.debug('Local clock is off by ' + parseInt(time.t) + 'ms from NTP ⏰')

    this.buildConstants()

    return this
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
      await Sntp.time()
    } catch (error) {
      goofy.warn('can\'t ping ntp')
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
}

module.exports = new Config()
