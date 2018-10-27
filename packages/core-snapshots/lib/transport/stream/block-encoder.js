'use strict'

const Transform = require('stream').Transform
const { camelizeKeys } = require('xcase')
const { Block } = require('@arkecosystem/crypto').models

class BlockEncoder extends Transform {
  constructor () {
    super({ objectMode: true })
  }

  _transform (chunk, enc, done) {
    const data = camelizeKeys(chunk)
    console.log(data)
    const serialized = Block.serialize(data)
    this.push(serialized)
    done()
  }
}

module.exports = new BlockEncoder()
