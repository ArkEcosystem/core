const msgpack = require('msgpack-lite')
const liteEncoder = require('./lite')

class LiteCodec {
  get blocks() {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x3f, Object, liteEncoder.blockEncode)
    codec.addExtUnpacker(0x3f, liteEncoder.blockDecode)

    return codec
  }

  get transactions() {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x4f, Object, liteEncoder.transactionEncode)
    codec.addExtUnpacker(0x4f, liteEncoder.transactionDecode)

    return codec
  }
}

module.exports = new LiteCodec()
