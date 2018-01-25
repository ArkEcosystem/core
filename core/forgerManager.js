const popsicle = require('popsicle')
const Delegate = require('../model/delegate')
const logger = require('./logger')

module.exports = class ForgerManager {
  constructor (config) {
    this.secrets = config.delegates ? config.delegates.secrets : null
    this.network = config.network
    this.headers = {
      version: config.server.version,
      port: config.server.port,
      nethash: config.network.nethash
    }
  }

  loadDelegates () {
    if (!this.secrets) { return Promise.reject(new Error('No delegates found')) }

    this.delegates = this.secrets.map(passphrase => new Delegate(passphrase, this.network))
    return Promise.resolve(this.delegates)
  }

  startForging (proxy) {
    this.proxy = proxy
    const that = this
    let round = null
    const data = {}
    const monitor = () => {
      that.getRound()
        .then(r => {
          round = r
          if (!round.canForge) throw new Error('Block already forged in current slot')
          data.previousBlock = round.lastBlock
          data.timestamp = round.timestamp
          data.reward = round.reward
          return that.pickForgingDelegate(round)
        })
        .then(delegate => delegate.forge([], data))
        .then(block => that.broadcast(block))
        .catch(error => {
          logger.info('Not able to forge:', error.message)
          logger.info('round:', round ? round.current : '', 'height:', round ? round.lastBlock.height : '')
          return Promise.resolve()
        })
        .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
        .then(() => monitor())
    }

    return monitor()
  }

  broadcast (block) {
    console.log(block.data)
    return popsicle
      .request({
        method: 'POST',
        url: this.proxy + '/internal/block',
        body: block.data,
        headers: this.headers,
        timeout: 2000
      })
      .use(popsicle.plugins.parse('json'))
      .then((result) => result.success)
  }

  pickForgingDelegate (round) {
    return Promise.resolve(this.delegates.find(delegate => delegate.publicKey === round.delegate.publicKey))
  }

  getRound () {
    return popsicle
      .request({
        method: 'GET',
        url: this.proxy + '/internal/round',
        headers: this.headers,
        timeout: 2000
      })
      .use(popsicle.plugins.parse('json'))
      .then((result) => result.body.round)
  }
}
