'use strict'
const msgpack = require('msgpack-lite')
const arkEncoders = require('./ark')

class ArkCodec {
  get blocks () {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x3F, Object, arkEncoders.blockEncode)
    codec.addExtUnpacker(0x3F, arkEncoders.blockDecode)

    return codec
  }

  get transactions () {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x4F, Object, arkEncoders.transactionEncode)
    codec.addExtUnpacker(0x4F, arkEncoders.transactionDecode)

    return codec
  }
}

module.exports = new ArkCodec()
