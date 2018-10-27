'use strict'
const msgpack = require('msgpack-lite')
const { blockEncode, blockDecode } = require('./ark')

module.exports = {
  blockCodec: (Class = Object) => {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x3F, Class, blockEncode)
    codec.addExtUnpacker(0x3F, blockDecode)

    return codec
  }
}
