'use strict'

const _ = require('lodash')
const { Block } = require('@arkecosystem/crypto').models

module.exports = class BlockHeaderManager {
  /**
   * Create a new wallet manager instance.
   * @constructor
   */
  constructor () {
    this.reset()
  }

  /**
   * Reset the blocks index.
   * @return {void}
   */
  reset () {
    this.byId = {}
    this.byHeight = {}
  }

  /**
   * Index the given blocks.
   * @param  {Array} blocks
   * @return {void}
   */
  index (blocks) {
    blocks.forEach(block => this.reindex(block))
  }

  /**
   * Reindex the given block header.
   * @param  {Block} block
   * @return {void}
   */
  reindex (block) {
    const blockHeader = new Block()
    Object.assign(blockHeader, block)
    delete blockHeader.transactions
    if (blockHeader.id) {
      this.byId[blockHeader.id] = blockHeader
    }

    if (blockHeader.height) {
      this.byHeight[blockHeader.height] = blockHeader
    }
  }

  /**
   * Get a block by the given id.
   * @param  {String} id
   * @return {(Block|undefined)}
   */
  getBlockById (id) {
    return this.byId[id]
  }

  /**
   * Get a block by the given height.
   * @param  {String} height
   * @return {(Block|undefined)}
   */
  getBlockByHeight (height) {
    return this.byHeight[height]
  }

  getLastBlocks (quantity) {
    const blocks = _(this.byHeight).toPairs().sortBy(0).fromPairs().value()
    console.log('this.byHeight', this.byHeight)
    console.log('lastblocks', blocks)

    return _.takeRight(Object.values(blocks), quantity)
  }
}
