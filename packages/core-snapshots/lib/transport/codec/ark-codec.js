const msgpack = require('msgpack-lite')
const arkEncoders = require('./ark')

class ArkCodec {
  get blocks() {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x3f, Object, arkEncoders.blockEncode)
    codec.addExtUnpacker(0x3f, arkEncoders.blockDecode)

    return codec
  }

  get transactions() {
    const codec = msgpack.createCodec()
    codec.addExtPacker(0x4f, Object, arkEncoders.transactionEncode)
    codec.addExtUnpacker(0x4f, arkEncoders.transactionDecode)

    return codec
  }
}

module.exports = new ArkCodec()
