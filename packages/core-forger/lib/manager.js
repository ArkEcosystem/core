'use strict'

const delay = require('delay')

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')
const emitter = container.resolvePlugin('event-emitter')

const { slots } = require('@arkecosystem/crypto')
const { Delegate, Transaction } = require('@arkecosystem/crypto').models

const Client = require('./client')

module.exports = class ForgerManager {
  /**
   * Create a new forger manager instance.
   * @param  {Object} options
   */
  constructor (options) {
    this.secrets = config.delegates ? config.delegates.secrets : null
    this.network = config.network
    this.client = new Client(options.hosts)
  }

  /**
   * Load all delegates that forge.
   * @param  {String} bip38
   * @param  {String} password
   * @return {Array}
   */
  async loadDelegates (bip38, password) {
    if (!bip38 && !this.secrets) {
      throw new Error('No delegate found')
    }

    this.delegates = this.secrets.map(passphrase => new Delegate(passphrase, this.network, password))

    if (bip38) {
      logger.info('BIP38 Delegate loaded')

      this.delegates.push(new Delegate(bip38, this.network, password))
    }

    return this.delegates
  }

  /**
   * Start forging on the given node.
   * @return {Object}
   */
  async startForging () {
    // TODO: assuming that blockTime = 8s
    const slot = slots.getSlotNumber()

    while (slots.getSlotNumber() === slot) {
      await delay(100)
    }

    return this.__monitor(null, null, {})
  }

  /**
   * Monitor the node for any actions that trigger forging.
   * @param  {Object} round
   * @param  {Object} transactionData
   * @param  {Object} data
   * @return {Function}
   */
  async __monitor (round, transactionData, data) {
    try {
      round = await this.client.getRound()

      if (!round.canForge) {
        // logger.debug('Block already forged in current slot')
        // technically it is possible to compute doing shennanigan with arkjs.slots lib
        await delay(100) // basically looping until we lock at beginning of next slot

        return this.__monitor(round, transactionData, data)
      }

      const delegate = await this.__pickForgingDelegate(round)
      if (!delegate) {
        // logger.debug(`Next delegate ${round.delegate.publicKey} is not configured on this node`)
        await delay(7900) // we will check at next slot

        return this.__monitor(round, transactionData, data)
      }

      const networkState = await this.client.getNetworkState()
      if (!networkState.forgingAllowed) {
        this.__analyseNetworkState(networkState, delegate)

        await delay(7800) // we will check at next slot

        return this.__monitor(round, transactionData, data)
      }

      emitter.emit('forger.started', delegate.publicKey)

      transactionData = await this.client.getTransactions()
      const transactions = transactionData.transactions ? transactionData.transactions.map(serializedTx => Transaction.fromBytes(serializedTx)) : []
      logger.debug(`Received ${transactions.length} transactions from the pool containing ${transactionData.poolSize} :money_with_wings:`)

      if (!slots.isForgingAllowed()) {
        logger.info('Forger was not allowed to forge. Slots isForgingAllowed=false')

        await delay(3700) // we will check at next slot

        return this.__monitor(round, transactionData, data)
      }

      data.previousBlock = round.lastBlock
      data.timestamp = round.timestamp
      data.reward = round.reward

      const block = await delegate.forge(transactions, data)

      logger.info(`Block ${block.data.id} was forged by delegate ${delegate.publicKey} :trident:`)

      emitter.emit('block.forged', block.data)

      transactions.forEach(transaction => emitter.emit('transaction.forged', transaction.data))

      this.client.broadcast(block.toRawJson())

      await delay(7800) // we will check at next slot

      return this.__monitor(round, transactionData, data)
    } catch (error) {
      logger.error(`Forging failed: ${error.message} :bangbang:`)

      // console.log(round)
      // logger.info('round:', round ? round.current : '', 'height:', round ? round.lastBlock.data.height.toLocaleString() : '')
      await delay(2000) // no idea when this will be ok, so waiting 2s before checking again

      emitter.emit('forger.failed', error.message)

      return this.__monitor(round, transactionData, data)
    }
  }

  /**
   * Pick the delegate that will forge.
   * @param  {Object} round
   * @return {Object}
   */
  async __pickForgingDelegate (round) {
    return this.delegates.find(delegate => delegate.publicKey === round.delegate.publicKey)
  }

  __analyseNetworkState (networkState, currentDelegate) {
    if (networkState.overHeightBlockHeader && networkState.overHeightBlockHeader.generatorPublicKey === currentDelegate.publicKey) {
      logger.info(`Possible double forging for delegate: ${currentDelegate.publicKey}. NetworkState: ${networkState}.`)
    } else {
      logger.info(`Fork 6 - Not enough quorum to forge next block. NetworkState: ${networkState}.`)
    }
  }
}
