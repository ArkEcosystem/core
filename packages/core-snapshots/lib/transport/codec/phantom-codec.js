const msgpack = require('msgpack-lite')
const phantomEncoders = require('./phantom')

class PhantomCodec {
  get blocks() {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x3f, Object, phantomEncoders.blockEncode)
    codec.addExtUnpacker(0x3f, phantomEncoders.blockDecode)

    return codec
  }

  get transactions() {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x4f, Object, phantomEncoders.transactionEncode)
    codec.addExtUnpacker(0x4f, phantomEncoders.transactionDecode)

    return codec
  }
}

module.exports = new PhantomCodec()
