import msgpack from "msgpack-lite";
import * as arkEncoders from "./ark";

export class ArkCodec {
    get blocks() {
        const codec: any = msgpack.createCodec();
        codec.addExtPacker(0x3f, Object, arkEncoders.blockEncode);
        codec.addExtUnpacker(0x3f, arkEncoders.blockDecode);

        return codec;
    }

    get transactions() {
        const codec: any = msgpack.createCodec();
        codec.addExtPacker(0x4f, Object, arkEncoders.transactionEncode);
        codec.addExtUnpacker(0x4f, arkEncoders.transactionDecode);

        return codec;
    }
}
