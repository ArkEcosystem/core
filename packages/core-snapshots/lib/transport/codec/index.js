'use strict'
const msgpack = require('msgpack-lite')
const { blockEncode, blockDecode, transactionEncode, transactionDecode } = require('./ark')

module.exports = {
  blockCodec: () => {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x3F, Object, blockEncode)
    codec.addExtUnpacker(0x3F, blockDecode)

    return codec
  },

  transactionCodec: () => {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x4F, Object, transactionEncode)
    codec.addExtUnpacker(0x4F, transactionDecode)

    return codec
  }
}
