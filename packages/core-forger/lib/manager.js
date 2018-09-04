'use strict'

const delay = require('delay')

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')

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

    this.usernames = await this.client.getUsernames()

    const delegates = this.delegates.map(delegate => {
      return `${this.usernames[delegate.publicKey]} (${delegate.publicKey})`
    })

    logger.debug(`Loaded ${delegates} delegates.`)

    return this.delegates
  }

  /**
   * Start forging on the given node.
   * @return {Object}
   */
  async startForging () {
    const slot = slots.getSlotNumber()

    while (slots.getSlotNumber() === slot) {
      await delay(100)
    }

    return this.__monitor(null)
  }

  /**
   * Stop forging on the given node.
   * @return {void}
   */
  async stop () {
    this.isStopped = true
  }

  /**
   * Monitor the node for any actions that trigger forging.
   * @param  {Object} round
   * @return {Function}
   */
  async __monitor (round) {
    try {
      if (this.isStopped) {
        return
      }

      this.__loadUsernames()

      round = await this.client.getRound()
      const delayTime = parseInt(config.getConstants(round.lastBlock.height).blocktime) * 1000 - 2000

      if (!round.canForge) {
        // logger.debug('Block already forged in current slot')
        // technically it is possible to compute doing shennanigan with arkjs.slots lib

        await delay(200) // basically looping until we lock at beginning of next slot

        return this.__monitor(round)
      }

      const delegate = this.__isDelegateActivated(round.currentForger.publicKey)

      if (!delegate) {
        // logger.debug(`Current forging delegate ${round.currentForger.publicKey} is not configured on this node.`)

        if (this.__isDelegateActivated(round.nextForger.publicKey)) {
          const username = this.usernames[round.nextForger.publicKey]
          logger.info(`Next forging delegate ${username} (${round.nextForger.publicKey}) is active on this node.`)
          await this.client.syncCheck()
        }

        await delay(delayTime) // we will check at next slot

        return this.__monitor(round)
      }

      const networkState = await this.client.getNetworkState()

      if (!this.__analyseNetworkState(networkState, delegate)) {
        await delay(delayTime) // we will check at next slot

        return this.__monitor(round)
      }

      await this.__forgeNewBlock(delegate, round)

      await delay(delayTime) // we will check at next slot

      return this.__monitor(round)
    } catch (error) {
      // README: The Blockchain is not ready, monitor until it is instead of crashing.
      if (error.response && error.response.status === 503) {
        logger.warn(`Blockchain not ready - ${error.response.status} ${error.response.statusText}`)

        await delay(2000)

        return this.__monitor(round)
      }

      // README: The Blockchain is ready but an action still failed.
      logger.error(`Forging failed: ${error.message} :bangbang:`)

      logger.info('Round:', round ? round.current : '', 'Height:', round ? round.lastBlock.height.toLocaleString() : '')

      await delay(2000) // no idea when this will be ok, so waiting 2s before checking again

      this.client.emitEvent('forger.failed', error.message)

      return this.__monitor(round)
    }
  }

  /**
   * Creates new block by the delegate and sends it to relay node for verification and broadcast
   * @param {Object} delegate
   * @param {Object} round
   */
  async __forgeNewBlock (delegate, round) {
      // TODO: Disabled for now as this could cause a delay in forging that
      // results in missing a block which we want to avoid.
      //
      // We should either use a very radical timeout like 500ms or look
      // into another solution for broadcasting this specific event.
      //
      // this.client.emitEvent('forger.started', delegate.publicKey)

      const transactions = await this.__getTransactionsForForging()

      const blockOptions = {}
      blockOptions.previousBlock = round.lastBlock
      blockOptions.timestamp = round.timestamp
      blockOptions.reward = round.reward

      const block = await delegate.forge(transactions, blockOptions)

      const username = this.usernames[delegate.publicKey]
      logger.info(`Forged new block ${block.data.id} by delegate ${username} (${delegate.publicKey}) :trident:`)

      this.client.emitEvent('block.forged', block.data)
      transactions.forEach(transaction => this.client.emitEvent('transaction.forged', transaction.data))

      await this.client.broadcast(block.toRawJson())
  }

  /**
   * Gets the unconfirmed transactions from the relay nodes transactio pool
   */
  async __getTransactionsForForging () {
      const response = await this.client.getTransactions()

      const transactions = response.transactions
        ? response.transactions.map(serializedTx => Transaction.fromBytes(serializedTx))
        : []

      logger.debug(`Received ${transactions.length} transactions from the pool containing ${response.poolSize} :money_with_wings:`)

      return transactions
  }

  /**
   * Checks if delegate public key is in the loaded (active) delegates list
   * @param  {Object} PublicKey
   * @return {Object}
   */
  __isDelegateActivated (queryPublicKey) {
    return this.delegates.find(delegate => delegate.publicKey === queryPublicKey)
  }

  /**
   * Analyses network state and decides if forging is allowed
   * @param {Object} networkState internal response
   * @param {Booolean} isAllowedToForge
   */
  __analyseNetworkState (networkState, currentForger) {
    const badState = (networkState, message) => {
      logger.info(message)
      logger.debug(`Network State: ${JSON.stringify(networkState, null, 4)}`)

      return false
    }

    if (networkState.coldStart) {
      return badState(networkState, 'Not allowed to forge during the cold start period. Check peers.json for coldStart setting.')
    }

    if (!networkState.minimumNetworkReach) {
      return badState(networkState, 'Network reach is not sufficient to get quorum.')
    }

    if (networkState.overHeightBlockHeader && networkState.overHeightBlockHeader.generatorPublicKey === currentForger.publicKey) {
      const usernames = this.usernames[currentForger.publicKey]

      return badState(networkState, `Possible double forging for delegate: ${usernames} (${currentForger.publicKey}).`)
    }

    if (networkState.quorum < 0.66) {
      return badState(networkState, 'Fork 6 - Not enough quorum to forge next block.')
    }

    return true
  }

  /**
   * Get a list of all active delegate usernames.
   * @return {Object}
   */
  async __loadUsernames () {
    this.usernames = await this.client.getUsernames()
  }
}
