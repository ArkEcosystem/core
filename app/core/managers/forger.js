const popsicle = require('popsicle')
const Delegate = require('app/models/delegate')
const goofy = require('app/core/goofy')

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

  async loadDelegates () {
    if (!this.secrets) { return Promise.reject(new Error('No delegates found')) }

    this.delegates = this.secrets.map(passphrase => new Delegate(passphrase, this.network))

    return this.delegates
  }

  startForging (proxy) {
    this.proxy = proxy
    const that = this
    let round = null
    const data = {}

    const monitor = async () => {
      try {
        const r = await that.getRound()
        round = r
        if (!round.canForge) {
          throw new Error('Block already forged in current slot')
        }
        data.previousBlock = round.lastBlock
        data.timestamp = round.timestamp
        data.reward = round.reward

        const delegate = await that.pickForgingDelegate(round)
        const block = await delegate.forge([], data)
        that.broadcast(block)

        await new Promise(resolve => setTimeout(resolve, 1000))

        monitor()
      } catch (error) {
        goofy.info('Not able to forge:', error.message)
        goofy.info('round:', round ? round.current : '', 'height:', round ? round.lastBlock.height : '')
      }
    }

    return monitor()
  }

  async broadcast (block) {
    console.log(block.data)
    const result = await popsicle.request({
      method: 'POST',
      url: this.proxy + '/internal/block',
      body: block.data,
      headers: this.headers,
      timeout: 2000
    }).use(popsicle.plugins.parse('json'))

    return result.success
  }

  async pickForgingDelegate (round) {
    return this.delegates.find(delegate => delegate.publicKey === round.delegate.publicKey)
  }

  async getRound () {
    const result = await popsicle.request({
      method: 'GET',
      url: this.proxy + '/internal/round',
      headers: this.headers,
      timeout: 2000
    }).use(popsicle.plugins.parse('json'))

    return result.body.round
  }
}
