'use strict'

const { slots } = require('@arkecosystem/crypto')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')
const stateMachine = require('./state-machine')
const Queue = require('./queue')
const delay = require('delay')
const { Block } = require('@arkecosystem/crypto').models

module.exports = class Blockchain {
  /**
   * Create a new blockchain manager instance.
   * @param  {Boolean} networkStart
   * @return {void}
   */
  constructor (networkStart) {
    // flag to force a network start
    stateMachine.state.networkStart = !!networkStart

    if (stateMachine.state.networkStart) {
      logger.warn('ARK Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong. :warning:')
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

    if (nextState.actions.length > 0) {
      logger.debug(`event '${event}': ${JSON.stringify(stateMachine.state.blockchain.value)} -> ${JSON.stringify(nextState.value)} -> actions: ${JSON.stringify(nextState.actions)}`)
    }

    stateMachine.state.blockchain = nextState

    nextState.actions.forEach(actionKey => {
      const action = this.actions[actionKey]

      if (action) {
        return setTimeout(() => action.call(this, event), 0)
      }

      logger.error(`No action '${actionKey}' found :interrobang:`)
    })

    return nextState
  }

  /**
   * Start the blockchain and wait for it to be ready.
   * @return {void}
   */
  async start (skipStartedCheck = false) {
    logger.info('Starting Blockchain Manager :chains:')

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

  async stop () {
    logger.info('Stopping Blockchain Manager :chains:')

    this.isStopped = true

    this.dispatch('STOP')

    this.queue.destroy()
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
   * @return {void}
   */
  async postTransactions (transactions) {
    logger.info(`Received ${transactions.length} new transactions :moneybag:`)

    await this.transactionPool.addTransactions(transactions)
  }

  /**
   * Push a block to the process queue.
   * @param  {Block} block
   * @return {void}
   */
  queueBlock (block) {
    logger.info(`Received new block at height ${block.height.toLocaleString()} with ${block.numberOfTransactions} transactions from ${block.ip}`)

    if (stateMachine.state.started) {
      this.processQueue.push(block)

      stateMachine.state.lastDownloadedBlock = new Block(block)
    } else {
      logger.info('Block disregarded because blockchain is not ready :exclamation:')
    }
  }

  /**
   * Rollback all blocks up to the previous round.
   * @return {void}
   */
  async rollbackCurrentRound () {
    const height = this.getLastBlock().data.height
    const maxDelegates = config.getConstants(height).activeDelegates
    const previousRound = Math.floor((height - 1) / maxDelegates)

    if (previousRound < 2) {
      return
    }

    const newHeight = previousRound * maxDelegates
    const blocksToRemove = await this.database.getBlocks(newHeight, height - newHeight - 1)
    const deleteLastBlock = async () => {
      const lastBlock = stateMachine.state.lastBlock
      await this.database.deleteBlockAsync(lastBlock)

      const newLastBlock = new Block(blocksToRemove.pop())

      stateMachine.state.lastBlock = newLastBlock
      stateMachine.state.lastDownloadedBlock = newLastBlock
    }

    logger.info(`Removing ${height - newHeight} blocks to reset current round :warning:`)

    let count = 0
    const max = this.getLastBlock().data.height - newHeight

    while (this.getLastBlock().data.height >= newHeight + 1) {
      const removalBlockId = this.getLastBlock().data.id
      const removalBlockHeight = this.getLastBlock().data.height.toLocaleString()
      logger.printTracker('Removing block', count++, max, `ID: ${removalBlockId}, Height: ${removalBlockHeight}`)

      await deleteLastBlock()
    }

    await this.database.deleteBlockCommit()

    logger.stopTracker(`${max} blocks removed`, count, max)

    await this.database.deleteRound(previousRound + 1)
  }

  /**
   * Remove N number of blocks.
   * @param  {Number} nblocks
   * @return {void}
   */
  async removeBlocks (nblocks) {
    const blocksToRemove = await this.database.getBlocks(stateMachine.state.lastBlock.data.height - nblocks, nblocks - 1)

    const revertLastBlock = async () => {
      const lastBlock = stateMachine.state.lastBlock

      // TODO: if revertBlock Failed, it might corrupt the database because one block could be left stored
      await this.database.revertBlock(lastBlock)
      await this.database.deleteBlockAsync(lastBlock)

      if (this.transactionPool) {
        await this.transactionPool.addTransactions(lastBlock.transactions)
      }

      const newLastBlock = new Block(blocksToRemove.pop())

      stateMachine.state.lastBlock = newLastBlock
      stateMachine.state.lastDownloadedBlock = newLastBlock
    }

    const __removeBlocks = async (nblocks) => {
      if (nblocks < 1) {
        return
      }

      logger.info(`Undoing block ${this.getLastBlock().data.height.toLocaleString()}`)

      await revertLastBlock()
      await __removeBlocks(nblocks - 1)
    }

    if (nblocks >= this.getLastBlock().data.height) {
      nblocks = this.getLastBlock().data.height - 1
    }

    const resetHeight = this.getLastBlock().data.height - nblocks
    logger.info(`Removing ${nblocks} blocks. Reset to height ${resetHeight.toLocaleString()}`)

    this.queue.pause()
    this.queue.clear(stateMachine)
    await __removeBlocks(nblocks)
    await this.database.deleteBlockCommit()
    this.queue.resume()
  }

  /**
   * Hande a block during a rebuild.
   * NOTE: We should be sure this is fail safe (ie callback() is being called only ONCE)
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
        if (block.data.height % 10000 === 0) {
          await this.database.saveBlockCommit()
        }

        state.lastBlock = block

        return callback()
      } else if (block.data.height > this.getLastBlock().data.height + 1) {
        state.lastDownloadedBlock = state.lastBlock
        return callback()
      } else if (block.data.height < this.getLastBlock().data.height || (block.data.height === this.getLastBlock().data.height && block.data.id === this.getLastBlock().data.id)) {
        state.lastDownloadedBlock = state.lastBlock
        return callback()
      } else {
        state.lastDownloadedBlock = state.lastBlock
        logger.info(`Block ${block.data.height.toLocaleString()} disregarded because on a fork :knife_fork_plate:`)
        return callback()
      }
    } else {
      logger.warn(`Block ${block.data.height.toLocaleString()} disregarded because verification failed :scroll:`)
      logger.warn(block.verification)
      return callback()
    }
  }

  /**
   * Process the given block.
   * NOTE: We should be sure this is fail safe (ie callback() is being called only ONCE)
   * @param  {Block} block
   * @param  {Function} callback
   * @return {(Function|void)}
   */
  async processBlock (block, callback) {
    if (!block.verification.verified) {
      logger.warn(`Block ${block.data.height.toLocaleString()} disregarded because verification failed :scroll:`)
      return callback()
    }

    try {
      if (this.__isChained(stateMachine.state.lastBlock, block)) {
        await this.acceptChainedBlock(block)
        stateMachine.state.lastBlock = block
      } else {
        await this.manageUnchainedBlock(block)
      }
    } catch (error) {
      logger.error(`Refused new block ${JSON.stringify(block.data)}`)
      logger.debug(error.stack)
      this.dispatch('FORK')
      return callback()
    }

    try {
      // broadcast only current block
      const blocktime = config.getConstants(block.data.height).blocktime
      if (slots.getSlotNumber() * blocktime <= block.data.timestamp) {
        this.p2p.broadcastBlock(block)
      }
    } catch (error) {
      logger.warn(`Can't broadcast properly block ${JSON.stringify(block.data.heigt)}`)
      logger.debug(error.stack)
    }

    return callback()
  }

  /**
   * Accept a new chained block.
   * @param  {Block} block
   * @param  {Object} state
   * @return {void}
   */
  async acceptChainedBlock (block) {
    await this.database.applyBlock(block)
    await this.database.saveBlock(block)

    if (this.transactionPool) {
      try {
        await this.transactionPool.acceptChainedBlock(block)
      } catch (error) {
        logger.warn('Issue applying block to transaction pool')
        logger.debug(error.stack)
      }
    }
  }

  /**
   * Manage a block that is out of order.
   * @param  {Block} block
   * @param  {Object} state
   * @return {void}
   */
  async manageUnchainedBlock (block) {
    if (block.data.height > this.getLastBlock().data.height + 1) {
      logger.debug(`Blockchain not ready to accept new block at height ${block.data.height.toLocaleString()}. Last block: ${this.getLastBlock().data.height.toLocaleString()} :warning:`)
      stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
    } else if (block.data.height < this.getLastBlock().data.height) {
      logger.debug(`Block ${block.data.height.toLocaleString()} disregarded because already in blockchain :warning:`)
    } else if (block.data.height === this.getLastBlock().data.height && block.data.id === this.getLastBlock().data.id) {
      logger.debug(`Block ${block.data.height.toLocaleString()} just received :chains:`)
    } else {
      const isValid = await this.database.validateForkedBlock(block)

      if (isValid) {
        this.dispatch('FORK')
      } else {
        logger.info(`Forked block disregarded because it is not allowed to forge. Caused by delegate: ${block.data.generatorPublicKey} :bangbang:`)
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
      ? await this.transactionPool.getTransactionsForForging(blockSize)
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
    if (!this.p2p.hasPeers()) {
      return true
    }

    block = block || this.getLastBlock()

    return slots.getTime() - block.data.timestamp < 3 * config.getConstants(block.data.height).blocktime
  }

  /**
   * Determine if the blockchain is synced after a rebuild.
   * @param  {Block}  block
   * @return {Boolean}
   */
  isRebuildSynced (block) {
    if (!this.p2p.hasPeers()) {
      return true
    }

    block = block || this.getLastBlock()

    const remaining = slots.getTime() - block.data.timestamp
    logger.info(`Remaining block timestamp ${remaining} :hourglass:`)

    // stop fast rebuild 7 days before the last network block
    return slots.getTime() - block.data.timestamp < 3600 * 24 * 7
    // return slots.getTime() - block.data.timestamp < 100 * config.getConstants(block.data.height).blocktime
  }

  /**
   * Get the last block of the blockchain.
   * @return {Object}
   */
  getLastBlock () {
    return stateMachine.state.lastBlock
  }

  /**
   * Get the last downloaded block of the blockchain.
   * @return {Object}
   */
  getLastDownloadedBlock () {
    return stateMachine.state.lastDownloadedBlock
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
    if (stateMachine.state.blockPing) {
      logger.info(`Block ${stateMachine.state.blockPing.block.height.toLocaleString()} pinged blockchain ${stateMachine.state.blockPing.count} times`)
    }

    stateMachine.state.blockPing = {
      count: 1,
      first: new Date().getTime(),
      last: new Date().getTime(),
      block
    }
  }

  /**
   * Get the list of events that are available.
   * @return {Array}
   */
  getEvents () {
    return [
      'block.applied',
      'block.forged',
      'block.reverted',
      'delegate.registered',
      'delegate.resigned',
      'forger.failed',
      'forger.missing',
      'forger.started',
      'peer.added',
      'peer.removed',
      'state:started',
      'transaction.applied',
      'transaction.expired',
      'transaction.forged',
      'transaction.reverted',
      'wallet:cold:created'
    ]
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
    const followsPrevious = nextBlock.data.previousBlock === previousBlock.data.id
    const isFuture = nextBlock.data.timestamp > previousBlock.data.timestamp
    const isPlusOne = nextBlock.data.height === previousBlock.data.height + 1

    return followsPrevious && isFuture && isPlusOne
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
