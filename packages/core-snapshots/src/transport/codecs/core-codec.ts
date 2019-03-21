import msgpack from "msgpack-lite";
import * as coreEncoders from "./core";

export class CoreCodec {
    get blocks() {
        const codec = msgpack.createCodec();
        codec.addExtPacker(0x3f, Object, coreEncoders.blockEncode);
        codec.addExtUnpacker(0x3f, coreEncoders.blockDecode);

        return codec;
    }

    get transactions() {
        const codec = msgpack.createCodec();
        codec.addExtPacker(0x4f, Object, coreEncoders.transactionEncode);
        codec.addExtUnpacker(0x4f, coreEncoders.transactionDecode);

        return codec;
    }
}
