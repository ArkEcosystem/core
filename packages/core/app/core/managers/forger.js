const popsicle = require('popsicle')
const { slots } = require('@arkecosystem/client')
const { Delegate, Transaction } = require('@arkecosystem/client').models
const logger = require('../logger')
const { msleep } = require('sleep')

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

  async loadDelegates (bip38, address, password) {
    if (!bip38 && !this.secrets) {
      throw new Error('No delegate found')
    }

    this.delegates = this.secrets.map(passphrase => new Delegate(passphrase, this.network, password))

    if (bip38) {
      const bip38Delegate = new Delegate(bip38, this.network, password)

      if ((bip38Delegate.address && !address) || bip38Delegate.address === address) {
        logger.info('BIP38 Delegate loaded')
        this.delegates.push(bip38Delegate)
      }
    }

    return this.delegates
  }

  async startForging (proxy) {
    this.proxy = proxy
    let round = null
    let forgingData = null
    const data = {}

    const monitor = async () => {
      try {
        round = await this.getRound()
        if (!round.canForge) {
          // logger.debug('Block already forged in current slot')
          await msleep(100) // basically looping until we lock at beginning of next slot
          return monitor()
        }

        const delegate = await this.pickForgingDelegate(round)
        if (!delegate) {
          // logger.debug(`Next delegate ${round.delegate.publicKey} is not configured on this node`)
          await msleep(7900) // we will check at next slot
          return monitor()
        }

        forgingData = await this.getTransactions()
        const transactions = forgingData.transactions ? forgingData.transactions.map(serializedTx => Transaction.fromBytes(serializedTx)) : []
        logger.debug(`Received ${transactions.length} transactions from the pool containing ${forgingData.poolSize}`)

        data.previousBlock = round.lastBlock
        data.timestamp = round.timestamp
        data.reward = round.reward

        const block = await delegate.forge(transactions, data)

        this.send(block)
        await sleep(7800) // we will check at next slot
        return monitor()
      } catch (error) {
        logger.debug(`Not able to forge: ${error.message}`)
        // console.log(round)
        // logger.info('round:', round ? round.current : '', 'height:', round ? round.lastBlock.height : '')
        await sleep(2000) // no idea when this will be ok, so waiting 2s before checking again
        return monitor()
      }
    }

    // TODO: assuming that blockTime = 8s
    const slot = slots.getSlotNumber()
    while (slots.getSlotNumber() === slot) {
      await sleep(100)
    }

    return monitor()
  }

  async send (block) {
    logger.info(`Sending forged block id ${block.data.id} at height ${block.data.height} with ${block.data.numberOfTransactions} transactions to relay node`)
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

  async getTransactions () {
    const result = await popsicle.request({
      method: 'GET',
      url: this.proxy + '/internal/forgingTransactions',
      headers: this.headers,
      timeout: 2000
    }).use(popsicle.plugins.parse('json'))

    return result.body.data || {}
  }
}
