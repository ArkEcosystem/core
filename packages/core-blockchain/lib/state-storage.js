'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const blockchainMachine = require('./machines/blockchain')

// Stores the last n blocks. The amount of last blocks
// can be configured by the option `state.maxLastBlocks`.
const _lastBlocks = []

/**
 * Represents an in-memory storage for state machine data.
 */
class StateStorage {
  constructor () {
    this.reset()
  }

  /**
   * Resets the state.
   * @returns {void}
   */
  reset () {
    this.blockchain = blockchainMachine.initialState
    this.lastDownloadedBlock = null
    this.blockPing = null
    this.started = false
    this.rebuild = true
    this.fastRebuild = false
    this.noBlockCounter = 0
    this.networkStart = false

    _lastBlocks.length = 0
  }

  /**
   * Get the last block.
   * @returns {Block|null}
   */
  getLastBlock () {
    return _lastBlocks.slice(-1)[0] || null
  }

  /**
   * Sets the last block.
   * @returns {void}
   */
  setLastBlock (block) {
    _lastBlocks.push(block)

    if (_lastBlocks.length > container.resolveOptions('blockchain').state.maxLastBlocks) {
      _lastBlocks.shift()
    }
  }

  /**
   * Gets the last blocks.
   * @returns {Array}
   */
  getLastBlocks () {
    return _lastBlocks
  }

  /**
   * Gets the last block ids.
   * @returns {Array}
   */
  getLastBlockIds () {
    return _lastBlocks.map(b => b.data.id)
  }

  /**
   * Ping a block.
   * @param {Block} incomingBlock
   * @returns {Boolean}
   */
  pingBlock (incomingBlock) {
    if (!this.blockPing) return false

    if (this.blockPing.block.height === incomingBlock.height && this.blockPing.block.id === incomingBlock.id) {
      this.blockPing.count++
      this.blockPing.last = new Date().getTime()

      return true
    }

    return false
  }

  /**
   * Push ping block
   * @param {Block} block
   * @returns {void}
   */
  pushPingBlock (block) {
    // logging for stats about network health
    if (this.blockPing) {
      logger.info(`Block ${this.blockPing.block.height.toLocaleString()} pinged blockchain ${this.blockPing.count} times`)
    }

    this.blockPing = {
      count: 1,
      first: new Date().getTime(),
      last: new Date().getTime(),
      block
    }
  }
}

module.exports = Object.seal(new StateStorage())
