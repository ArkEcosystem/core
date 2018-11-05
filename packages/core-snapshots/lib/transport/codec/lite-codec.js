'use strict'
const msgpack = require('msgpack-lite')
const liteEncoder = require('./lite')

class LiteCodec {
  get blocks () {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x3F, Object, liteEncoder.blockEncode)
    codec.addExtUnpacker(0x3F, liteEncoder.blockDecode)

    return codec
  }

  get transactions () {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x4F, Object, liteEncoder.transactionEncode)
    codec.addExtUnpacker(0x4F, liteEncoder.transactionDecode)

    return codec
  }
}

module.exports = new LiteCodec()
