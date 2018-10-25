'use strict'

const blockchainMachine = require('./machines/blockchain')
const container = require('@arkecosystem/core-container')

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

    _lastBlocks.length = 0
  }

  /**
   * Get the last block.
   * @returns {Block|null}
   */
  get lastBlock () {
    return _lastBlocks.slice(-1)[0] || null
  }

  /**
   * Sets the last block.
   * @returns {Block}
   */
  set lastBlock (block) {
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
}

module.exports = new StateStorage()
