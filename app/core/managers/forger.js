const popsicle = require('popsicle')
const Delegate = require('app/models/delegate')
const goofy = require('app/core/goofy')
const sleep = require('app/utils/sleep')

module.exports = class ForgerManager {
  constructor (config, password) {
    this.password = password
    this.bip38 = config.delegates ? config.delegates.bip38 : null
    this.secrets = config.delegates ? config.delegates.secrets : null
    this.network = config.network
    this.delegateEncryption = config.server.delegateEncryption
    this.headers = {
      version: config.server.version,
      port: config.server.port,
      nethash: config.network.nethash
    }
  }

  async loadDelegates (address) {
    if (!this.bip38 && !this.secrets) {
      throw new Error('No delegate found')
    }

    if (this.secrets && !this.delegateEncryption) {
      this.delegates = this.secrets.map(passphrase => new Delegate(passphrase, this.network, this.password))
      goofy.info('Loading clear secrets for delegates. Warning - use only in autoforging mode')
    }

    if (this.bip38 && this.delegateEncryption) {
      const bip38Delegate = new Delegate(this.bip38, this.network, this.password)
      if ((bip38Delegate.address && !address) || bip38Delegate.address === address) {
        goofy.info('BIP38 Delegate loaded')
        this.delegates = bip38Delegate
      }
    }

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
      } catch (error) {
        goofy.info('Not able to forge:', error.message)
        goofy.info('round:', round ? round.current : '', 'height:', round ? round.lastBlock.height : '')
      }
      await sleep(1000)
      return monitor()
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
