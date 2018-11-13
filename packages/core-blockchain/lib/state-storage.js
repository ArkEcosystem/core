/* eslint max-len: "off" */

const container = require('@arkecosystem/core-container')

const logger = container.resolvePlugin('logger')
const immutable = require('immutable')
const assert = require('assert')
const blockchainMachine = require('./machines/blockchain')

// Stores the last n blocks in ascending height. The amount of last blocks
// can be configured by the option `state.maxLastBlocks`.
let _lastBlocks = immutable.OrderedMap()

// Map Block instances to block data.
const _mapToBlockData = blocks =>
  blocks.map(block => ({ ...block.data, transactions: block.transactions }))

/**
 * Represents an in-memory storage for state machine data.
 */
class StateStorage {
  constructor() {
    this.reset()
  }

  /**
   * Resets the state.
   * @returns {void}
   */
  reset() {
    this.blockchain = blockchainMachine.initialState
    this.lastDownloadedBlock = null
    this.blockPing = null
    this.started = false
    this.forked = false
    this.forkedBlock = null
    this.rebuild = true
    this.fastRebuild = false
    this.checkLaterTimeout = null
    this.noBlockCounter = 0
    this.p2pUpdateCounter = 0
    this.networkStart = false

    this.clear()
  }

  /**
   * Clear last blocks.
   * @returns {void}
   */
  clear() {
    _lastBlocks = _lastBlocks.clear()
  }

  /**
   * Clear check later timeout.
   * @returns {void}
   */
  clearCheckLater() {
    if (this.checkLaterTimeout) {
      clearTimeout(this.checkLaterTimeout)
      this.checkLaterTimeout = null
    }
  }

  /**
   * Get the last block.
   * @returns {Block|null}
   */
  getLastBlock() {
    return _lastBlocks.last() || null
  }

  /**
   * Sets the last block.
   * @returns {void}
   */
  setLastBlock(block) {
    // Only keep blocks which are below the new block height (i.e. rollback)
    if (
      _lastBlocks.last() &&
      _lastBlocks.last().data.height !== block.data.height - 1
    ) {
      assert(block.data.height - 1 <= _lastBlocks.last().data.height)
      _lastBlocks = _lastBlocks.filter(b => b.data.height < block.data.height)
    }

    _lastBlocks = _lastBlocks.set(block.data.height, block)

    // Delete oldest block if size exceeds the maximum
    if (
      _lastBlocks.size >
      container.resolveOptions('blockchain').state.maxLastBlocks
    ) {
      _lastBlocks = _lastBlocks.delete(_lastBlocks.first().data.height)
    }
  }

  /**
   * Get the last blocks.
   * @returns {Array}
   */
  getLastBlocks() {
    return _lastBlocks
      .reverse()
      .valueSeq()
      .toArray()
  }

  /**
   * Get the last blocks data.
   * @returns {Array}
   */
  getLastBlocksData() {
    return _mapToBlockData(_lastBlocks.reverse())
      .valueSeq()
      .toArray()
  }

  /**
   * Get the last block ids.
   * @returns {Array}
   */
  getLastBlockIds() {
    return _lastBlocks
      .reverse()
      .map(b => b.data.id)
      .valueSeq()
      .toArray()
  }

  /**
   * Get last blocks in the given height range in ascending order.
   * @param {Number} start
   * @param {Number} end
   */
  getLastBlocksByHeight(start, end) {
    end = end || start
    return _mapToBlockData(
      _lastBlocks.filter(
        block => block.data.height >= start && block.data.height <= end,
      ),
    )
      .valueSeq()
      .toArray()
  }

  /**
   * Get common blocks for the given IDs.
   * @returns {Array}
   */
  getCommonBlocks(ids) {
    return this.getLastBlocksData().filter(block => ids.includes(block.id))
  }

  /**
   * Ping a block.
   * @param {Block} incomingBlock
   * @returns {Boolean}
   */
  pingBlock(incomingBlock) {
    if (!this.blockPing) return false

    if (
      this.blockPing.block.height === incomingBlock.height &&
      this.blockPing.block.id === incomingBlock.id
    ) {
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
  pushPingBlock(block) {
    // logging for stats about network health
    if (this.blockPing) {
      logger.info(
        `Block ${this.blockPing.block.height.toLocaleString()} pinged blockchain ${
          this.blockPing.count
        } times`,
      )
    }

    this.blockPing = {
      count: 1,
      first: new Date().getTime(),
      last: new Date().getTime(),
      block,
    }
  }
}

module.exports = Object.seal(new StateStorage())
