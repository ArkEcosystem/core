'use strict'
const msgpack = require('msgpack-lite')
const { blockEncode, blockDecode } = require('./ark')

module.exports = {
  blockCodec: () => {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x3F, Object, blockEncode)
    codec.addExtUnpacker(0x3F, blockDecode)

    return codec
  }
}
