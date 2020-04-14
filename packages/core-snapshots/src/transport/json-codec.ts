import { createCodec } from "msgpack-lite";
import { camelizeKeys } from "xcase";
import { Codec } from "../contracts";
import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class JSONCodec implements Codec {
    public name: string = "JSON";

    public get blocks() {
        const codec = createCodec();
        codec.addExtPacker(0x3f, Object, JSONCodec.encodeBlock);
        codec.addExtUnpacker(0x3f, JSONCodec.decodeBlock);

        return codec;
    }

    public get transactions() {
        const codec = createCodec();
        codec.addExtPacker(0x4f, Object, JSONCodec.encodeTransaction);
        codec.addExtUnpacker(0x4f, JSONCodec.decodeTransaction);

        return codec;
    }

    public get rounds() {
        const codec = createCodec();
        codec.addExtPacker(0x5f, Object, JSONCodec.encodeRound);
        codec.addExtUnpacker(0x5f, JSONCodec.decodeRound);

        return codec;
    }

    private static removePrefix(item: Object, prefix: string): Object {
        let itemToReturn = {};

        for(let key of Object.keys(item)) {
            itemToReturn[key.replace(prefix, "")] = item[key];
        }

        return itemToReturn;
    };

    private static encodeBlock(block) {
        return JSON.stringify(camelizeKeys(JSONCodec.removePrefix(block, "Block_")));
    };

    private static decodeBlock(buffer: Buffer) {
        return JSON.parse(buffer.toString());
    };

    private static encodeTransaction(transaction) {
        return JSON.stringify(camelizeKeys(JSONCodec.removePrefix(transaction, "Transaction_")));
    };

    private static decodeTransaction(buffer: Buffer) {
        return JSON.parse(buffer.toString());
    };

    private static encodeRound(round) {
        return JSON.stringify(camelizeKeys(JSONCodec.removePrefix(round, "Round_")));
    };

    private static decodeRound(buffer: Buffer) {
        return JSON.parse(buffer.toString());
    };
}
