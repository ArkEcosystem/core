const popsicle = require('popsicle')
const Delegate = require('app/models/delegate')
const logger = require('app/core/logger')
const sleep = require('app/utils/sleep')
const Transaction = require('app/models/transaction')

module.exports = class ForgerManager {
  constructor (config, password) {
    this.password = password
    this.bip38 = config.delegates ? config.delegates.bip38 : null
    this.secrets = config.delegates ? config.delegates.secrets : null
    this.network = config.network
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
    this.delegates = this.secrets.map(passphrase => new Delegate(passphrase, this.network, this.password))
    if (this.bip38) {
      const bip38Delegate = new Delegate(this.bip38, this.network, this.password)
      if ((bip38Delegate.address && !address) || bip38Delegate.address === address) {
        logger.info('BIP38 Delegate loaded')
        this.delegates.push(bip38Delegate)
      }
    }

    return this.delegates
  }

  startForging (proxy) {
    this.proxy = proxy
    let round = null
    let forgingData = null
    const data = {}

    const monitor = async () => {
      try {
        round = await this.getRound()
        if (!round.canForge) {
          logger.debug('Block already forged in current slot')
          await sleep(100) // basically looping until we lock at beginning of next slot
          return monitor()
        }

        const delegate = await this.pickForgingDelegate(round)
        if (!delegate) {
          logger.debug(`Next delegate ${round.delegate.publicKey} is not configured on this node`)
          await sleep(7900) // we will check at next slot
          return monitor()
        }

        forgingData = await this.getTransactions()
        const transactions = forgingData.transactions ? forgingData.transactions.map(serializedTx => Transaction.fromBytes(serializedTx)) : []
        logger.debug(`Received ${transactions.length} transactions from the pool containing ${forgingData.poolSize}`)

        data.previousBlock = round.lastBlock
        data.timestamp = round.timestamp
        data.reward = round.reward

        const block = await delegate.forge(transactions, data)

        this.broadcast(block)
        await sleep(7900) // we will check at next slot
        return monitor()
      } catch (error) {
        logger.debug(`Not able to forge: ${error.message}`)
        // console.log(round)
        // logger.info('round:', round ? round.current : '', 'height:', round ? round.lastBlock.height : '')
        await sleep(2000) // no idea when this will be ok, so waiting 2s before checking again
        return monitor()
      }
    }

    return monitor()
  }

  async broadcast (block) {
    logger.info(`Broadcasting forged block id ${block.data.id} at height ${block.data.height} with ${block.data.numberOfTransactions} transactions`)
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
      url: this.proxy + '/internal/unconfirmedTransactions',
      headers: this.headers,
      timeout: 2000
    }).use(popsicle.plugins.parse('json'))

    return result.body.data
  }
}
