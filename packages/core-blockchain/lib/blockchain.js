'use strict'

const { slots } = require('@arkecosystem/crypto')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const stateMachine = require('./state-machine')
const Queue = require('./queue')
const delay = require('delay')

module.exports = class Blockchain {
  /**
   * Create a new blockchain manager instance.
   * @param  {Number} config
   * @param  {Boolean} networkStart
   * @return {void}
   */
  constructor (config, networkStart) {
    this.config = config

    // flag to force a network start
    stateMachine.state.networkStart = !!networkStart

    if (stateMachine.state.networkStart) {
      logger.warn('ARK Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong.')
      logger.info('Starting ARK Core for a new world, welcome aboard :rocket:')
    }

    this.actions = stateMachine.actionMap(this)

    this.__registerQueue()
  }

  /**
   * Dispatch an event to transition the state machine.
   * @param  {String} event
   * @return {void}
   */
  dispatch (event) {
    const nextState = stateMachine.transition(stateMachine.state.blockchain, event)

    if (nextState.actions.length > 0) logger.debug(`event '${event}': ${JSON.stringify(stateMachine.state.blockchain.value)} -> ${JSON.stringify(nextState.value)} -> actions: ${JSON.stringify(nextState.actions)}`)

    stateMachine.state.blockchain = nextState

    nextState.actions.forEach(actionKey => {
      const action = this.actions[actionKey]

      if (action) {
        return setTimeout(() => action.call(this, event), 0)
      }

      logger.error(`No action '${actionKey}' found`)
    })

    return nextState
  }

  /**
   * Start the blockchain and wait for it to be ready.
   * @return {void}
   */
  async start (skipStartedCheck = false) {
    logger.info('Starting Blockchain Manager...')

    this.dispatch('START')

    if (skipStartedCheck || process.env.ARK_SKIP_BLOCKCHAIN_STARTED_CHECK) {
      return true
    }

    // TODO: this state needs to be set after the state.lastBlock is available if ARK_ENV=test
    while (!stateMachine.state.started) {
      await delay(1000)
    }

    return true
  }

  checkNetwork () {
    throw new Error('Method [checkNetwork] not implemented!')
  }

  /**
   * Update network status.
   * @return {void}
   */
  async updateNetworkStatus () {
    return this.p2p.updateNetworkStatus()
  }

  /**
   * Rebuild N blocks in the blockchain.
   * @param  {Number} nblocks
   * @return {void}
   */
  rebuild (nblocks) {
    throw new Error('Method [rebuild] not implemented!')
  }

  /**
   * Reset the state of the blockchain.
   * @return {void}
   */
  async resetState () {
    this.queue.pause()
    this.queue.clear(stateMachine)

    stateMachine.state = {
      blockchain: stateMachine.initialState,
      started: false,
      lastBlock: null,
      lastDownloadedBlock: null,
      blockPing: null,
      noBlockCounter: 0
    }

    // this.queue.resume()

    // return this.start()
  }

  /**
   * Hand the given transactions to the transaction handler.
   * @param  {Array}   transactions
   * @return {Array}
   */
  postTransactions (transactions) {
    logger.info(`Received ${transactions.length} new transactions`)

    return this.transactionPool.addTransactions(transactions)
  }

  /**
   * Push a block to the process queue.
   * @param  {Block} block
   * @return {void}
   */
  queueBlock (block) {
    logger.info(`Received new block at height ${block.height} with ${block.numberOfTransactions} transactions from ${block.ip}`)

    if (stateMachine.state.started) {
      this.processQueue.push(block)
      stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
    } else {
      logger.info('Block disregarded because blockchain is not ready')
    }
  }

  /**
   * Rollback all blocks up to the previous round.
   * @return {void}
   */
  async rollbackCurrentRound () {
    const deleteLastBlock = async () => {
      const lastBlock = stateMachine.state.lastBlock
      await this.database.deleteBlock(lastBlock)
      const newLastBlock = await this.database.getBlock(lastBlock.data.previousBlock)
      stateMachine.state.lastBlock = newLastBlock
      stateMachine.state.lastDownloadedBlock = newLastBlock
    }

    const height = this.getLastBlock(true).height
    const maxDelegates = this.config.getConstants(height).activeDelegates
    const previousRound = Math.floor((height - 1) / maxDelegates)

    if (previousRound < 2) {
      return
    }

    const newHeight = previousRound * maxDelegates
    logger.info(`Removing ${height - newHeight} blocks to reset current round`)
    let count = 0
    const max = this.getLastBlock(true).height - newHeight
    while (this.getLastBlock(true).height >= newHeight) {
      logger.printTracker('Removing block', count++, max, 'id: ' + this.getLastBlock(true).id + ', height: ' + this.getLastBlock(true).height)
      await deleteLastBlock()
    }
    logger.stopTracker(`${max} blocks removed`, count, max)

    await this.database.deleteRound(previousRound + 1)
  }

  /**
   * Remove N number of blocks.
   * @param  {Number} nblocks
   * @return {void}
   */
  async removeBlocks (nblocks) {
    const revertLastBlock = async () => {
      const lastBlock = stateMachine.state.lastBlock

      await this.database.revertBlock(lastBlock)
      await this.database.deleteBlock(lastBlock)

      if (this.transactionPool) {
        await this.transactionPool.addTransactions(lastBlock.transactions)
      }

      const newLastBlock = await this.database.getBlock(lastBlock.data.previousBlock)
      stateMachine.state.lastBlock = newLastBlock
      stateMachine.state.lastDownloadedBlock = newLastBlock
    }

    const __removeBlocks = async (nblocks) => {
      if (nblocks < 1) {
        return
      }

      logger.info(`Undoing block ${this.getLastBlock(true).height}`)

      await revertLastBlock()
      await __removeBlocks(nblocks - 1)
    }

    if (nblocks >= this.getLastBlock(true).height) {
      nblocks = this.getLastBlock(true).height - 1
    }

    logger.info(`Removing ${nblocks} blocks. Reset to height ${this.getLastBlock(true).height - nblocks}`)

    this.queue.pause()
    this.queue.clear(stateMachine)
    await __removeBlocks(nblocks)
    this.queue.resume()
  }

  /**
   * Hande a block during a rebuild.
   * @param  {Block} block
   * @param  {Function} callback
   * @return {Object}
   */
  async rebuildBlock (block, callback) {
    const state = stateMachine.state

    if (block.verification.verified) {
      if (this.__isChained(state.lastBlock, block)) {
        // save block on database
        await this.database.saveBlockAsync(block)
        // committing to db every 10,000 blocks
        if (block.data.height % 10000 === 0) await this.database.saveBlockCommit()
        state.lastBlock = block
        callback()
      } else if (block.data.height > this.getLastBlock(true).height + 1) {
        logger.info(`Block ${block.data.height} disregarded because blockchain not ready to accept it. Last block: ${this.getLastBlock(true).height}`)
        state.lastDownloadedBlock = state.lastBlock
        callback()
      } else if (block.data.height < this.getLastBlock(true).height || (block.data.height === this.getLastBlock(true).height && block.data.id === this.getLastBlock(true).id)) {
        logger.debug(`Block ${block.data.height} disregarded because already in blockchain`)
        callback()
      } else {
        state.lastDownloadedBlock = state.lastBlock
        logger.info(`Block ${block.data.height} disregarded because on a fork`)
        callback()
      }
    } else {
      logger.warn(`Block ${block.data.height} disregarded because verification failed`)
      callback()
    }
  }

  /**
   * Process the given block.
   * @param  {Block} block
   * @param  {Function} callback
   * @return {(Function|void)}
   */
  async processBlock (block, callback) {
    if (!block.verification.verified) {
      logger.warn(`Block ${block.data.height} disregarded because verification failed`)

      return callback()
    }

    const state = stateMachine.state

    this.__isChained(state.lastBlock, block)
      ? await this.acceptChainedBlock(block, state)
      : await this.manageUnchainedBlock(block, state)

    callback()
  }

  /**
   * Accept a new chained block.
   * @param  {Block} block
   * @param  {Object} state
   * @return {void}
   */
  async acceptChainedBlock (block, state) {
    try {
      await this.database.applyBlock(block)
      await this.database.saveBlock(block)
      state.lastBlock = block

      // broadcast only recent blocks
      if (slots.getTime() - block.data.timestamp < 10) {
        this.p2p.broadcastBlock(block)
      }

      if (this.transactionPool) {
        this.transactionPool.acceptChainedBlock(block)
      }
    } catch (error) {
      logger.error(`Refused new block: ${JSON.stringify(block.data)}`)
      logger.debug(error.stack)

      this.dispatch('FORK')
    }

    state.lastDownloadedBlock = state.lastBlock
  }

  /**
   * Manage a block that is out of order.
   * @param  {Block} block
   * @param  {Object} state
   * @return {void}
   */
  async manageUnchainedBlock (block, state) {
    if (block.data.height > this.getLastBlock(true).height + 1) {
      logger.info(`Blockchain not ready to accept new block at height ${block.data.height}. Last block: ${this.getLastBlock(true).height}`)
    } else if (block.data.height < this.getLastBlock(true).height) {
      logger.debug(`Block ${block.data.height} disregarded because already in blockchain`)
    } else if (block.data.height === this.getLastBlock(true).height && block.data.id === this.getLastBlock(true).id) {
      logger.debug(`Block ${block.data.height} just received`)
    } else {
      const isValid = await this.database.validateForkedBlock(block)

      if (isValid) {
        this.dispatch('FORK')
      } else {
        logger.info(`Forked block disregarded because it is not allowed to forge. Caused by delegate: ${block.data.generatorPublicKey}`)
      }
    }
  }

  /**
   * Get unconfirmed transactions for the specified block size.
   * @param  {Number}  blockSize
   * @param  {Boolean} forForging
   * @return {Object}
   */
  async getUnconfirmedTransactions (blockSize, forForging = false) {
    const transactions = forForging
      ? await this.transactionPool.getTransactionsForForging(0, blockSize)
      : await this.transactionPool.getTransactions(0, blockSize)

    return {
      transactions,
      poolSize: await this.transactionPool.getPoolSize(),
      count: transactions ? transactions.length : -1
    }
  }

  /**
   * Determine if the blockchain is synced.
   * @param  {Block} [block=getLastBlock()]  block
   * @return {Boolean}
   */
  isSynced (block) {
    block = block || this.getLastBlock(true)

    return slots.getTime() - block.timestamp < 3 * this.config.getConstants(block.height).blocktime
  }

  /**
   * Determine if the blockchain is synced after a rebuild.
   * @param  {Block}  block
   * @return {Boolean}
   */
  isRebuildSynced (block) {
    block = block || this.getLastBlock(true)
    logger.info('Remaining block timestamp', slots.getTime() - block.timestamp)

    return slots.getTime() - block.timestamp < 100 * this.config.getConstants(block.height).blocktime
  }

  /**
   * Get the last block of the blockchain.
   * @return {Object}
   */
  getLastBlock (onlyData = false) {
    const block = stateMachine.state.lastBlock

    return onlyData ? block.data : block
  }

  /**
   * Get the last downloaded block of the blockchain.
   * @return {Object}
   */
  getLastDownloadedBlock (onlyData = false) {
    const block = stateMachine.state.lastDownloadedBlock

    return onlyData ? block.data : block
  }

  getBlockPing () {
    return stateMachine.state.blockPing
  }

  pingBlock (incomingBlock) {
    if (!stateMachine.state.blockPing) return false
    if (stateMachine.state.blockPing.block.height === incomingBlock.height && stateMachine.state.blockPing.block.id === incomingBlock.id) {
      stateMachine.state.blockPing.count++
      stateMachine.state.blockPing.last = new Date().getTime()
      return true
    }
    return false
  }

  pushPingBlock (block) {
    // logging for stats about network health
    if (stateMachine.state.blockPing) logger.info(`block ${stateMachine.state.blockPing.block.height} pinged blockchain ${stateMachine.state.blockPing.count} times`)
    stateMachine.state.blockPing = {
      count: 1,
      first: new Date().getTime(),
      last: new Date().getTime(),
      block
    }
  }

  /**
   * Get the state of the blockchain.
   * @return {Object}
   */
  get state () {
    return stateMachine.state
  }

  /**
   * Get the state machine.
   * @return {Object}
   */
  get stateMachine () {
    return stateMachine
  }

  /**
   * Get the network (p2p) interface.
   * @return {P2PInterface}
   */
  get p2p () {
    return container.resolvePlugin('p2p')
  }

  /**
   * Get the transaction handler.
   * @return {TransactionPool}
   */
  get transactionPool () {
    return container.resolvePlugin('transactionPool')
  }

  /**
   * Get the database connection.
   * @return {ConnectionInterface}
   */
  get database () {
    return container.resolvePlugin('database')
  }

  /**
   * Check if the given block is in order.
   * @param  {Block}  previousBlock
   * @param  {Block}  nextBlock
   * @return {Boolean}
   */
  __isChained (previousBlock, nextBlock) {
    return nextBlock.data.previousBlock === previousBlock.data.id && nextBlock.data.timestamp > previousBlock.data.timestamp && nextBlock.data.height === previousBlock.data.height + 1
  }

  /**
   * Register the block queue.
   * @return {void}
   */
  __registerQueue () {
    this.queue = new Queue(this, {
      process: 'PROCESSFINISHED',
      rebuild: 'REBUILDFINISHED'
    })

    this.processQueue = this.queue.process
    this.rebuildQueue = this.queue.rebuild
  }
}
