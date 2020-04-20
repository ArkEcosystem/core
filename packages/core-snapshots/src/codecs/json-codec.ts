import { createCodec } from "msgpack-lite";
import { camelizeKeys } from "xcase";
import { Codec } from "../contracts";
import { Container } from "@arkecosystem/core-kernel";
import msgpack from "msgpack-lite";

@Container.injectable()
export class JSONCodec implements Codec {

    public createDecodeStream(table: string): NodeJS.ReadWriteStream {
        return msgpack.createDecodeStream({ codec: this[table]() });
    }

    public createEncodeStream(table: string): NodeJS.ReadWriteStream {
        return msgpack.createEncodeStream({ codec: this[table]() });
    }

    // @ts-ignore
    private blocks() {
        const codec = createCodec();
        codec.addExtPacker(0x3f, Object, JSONCodec.encodeBlock);
        codec.addExtUnpacker(0x3f, JSONCodec.decodeBlock);

        return codec;
    }

    // @ts-ignore
    private transactions() {
        const codec = createCodec();
        codec.addExtPacker(0x4f, Object, JSONCodec.encodeTransaction);
        codec.addExtUnpacker(0x4f, JSONCodec.decodeTransaction);

        return codec;
    }

    // @ts-ignore
    private rounds() {
        const codec = createCodec();
        codec.addExtPacker(0x5f, Object, JSONCodec.encodeRound);
        codec.addExtUnpacker(0x5f, JSONCodec.decodeRound);

        return codec;
    }

    private static prepareData(data: any) {
        if ( Buffer.isBuffer(data)) {
            return data.toJSON();
        } else if (typeof data === "bigint") {
            return data.toString();
        } else {
            return data
        }
    }

    private static removePrefix(item: Object, prefix: string): any {
        let itemToReturn = {};

        for(let key of Object.keys(item)) {
            itemToReturn[key.replace(prefix, "")] = JSONCodec.prepareData(item[key]);
        }

        return itemToReturn;
    };

    private static encodeBlock(block) {
        return JSONCodec.Stringify(camelizeKeys(JSONCodec.removePrefix(block, "Block_")));
    };

    private static decodeBlock(buffer: Buffer) {
        return JSON.parse(buffer.toString());
    };

    private static encodeTransaction(transaction) {

        let tmp = JSONCodec.removePrefix(transaction, "Transaction_");
        tmp = camelizeKeys(tmp);

        tmp = JSONCodec.Stringify(tmp);

        return tmp;
    };

    private static decodeTransaction(buffer: Buffer) {
        let tmp = JSON.parse(buffer.toString());

        tmp.serialized = Buffer.from(tmp.serialized.data);

        return tmp;
    };

    private static encodeRound(round) {
        return JSONCodec.Stringify(camelizeKeys(JSONCodec.removePrefix(round, "Round_")));
    };

    private static decodeRound(buffer: Buffer) {
        return JSON.parse(buffer.toString());
    };

    private static Stringify(item: any): string {
        return JSON.stringify(item, typeof item === 'bigint'
            ? item.toString()
            : item);
    };
}
