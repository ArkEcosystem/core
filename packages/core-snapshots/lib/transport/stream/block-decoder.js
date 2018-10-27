'use strict'

const Transform = require('stream').Transform
const { decamelizeKeys } = require('xcase')
const { Block } = require('@arkecosystem/crypto').models

class BlockDecoder extends Transform {
  constructor () {
    super({ objectMode: true,  highWaterMark: 16 })
  }

  _transform (chunk, enc, done) {
    console.log('transform')
    try {
      let blockData = Block.deserialize(chunk.toString('hex'), true)
      if (blockData.height === 1) {
        blockData.previousBlockHex = null
        blockData.previousBlock = null
      }
      console.log(blockData)
      blockData.id = Block.getId(blockData)
      blockData.totalAmount = +blockData.totalAmount.toFixed()
      blockData.reward = +blockData.reward.toFixed()
      blockData.totalFee = +blockData.totalFee.toFixed()

      const object = decamelizeKeys(blockData)
      this.push(object)
    }
    catch (error) {
      console.log(error)
    }
    done()
  }
}

module.exports = new BlockDecoder()
