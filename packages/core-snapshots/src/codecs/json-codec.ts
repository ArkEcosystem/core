import { camelizeKeys } from "xcase";
import { Codec } from "../contracts";
import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class JSONCodec implements Codec {

    // public createDecodeStream(table: string): NodeJS.ReadWriteStream {
    //     return msgpack.createDecodeStream({ codec: this[table]() });
    // }
    //
    // public createEncodeStream(table: string): NodeJS.ReadWriteStream {
    //     return msgpack.createEncodeStream({ codec: this[table]() });
    // }

    public blocksEncode(block): Buffer {
        let blockStringified = JSONCodec.stringify(camelizeKeys(JSONCodec.removePrefix(block, "Block_")))

        // console.log("BLOCK: ", blockStringified)

        return Buffer.from(blockStringified);
    };

    public blocksDecode(buffer: Buffer): any {
        return JSON.parse(buffer.toString());
    };

    public transactionsEncode(transaction) {
        let tmp = JSONCodec.removePrefix(transaction, "Transaction_");
        tmp = camelizeKeys(tmp);

        tmp = JSONCodec.stringify(tmp);

        return Buffer.from(tmp);
    };

    public transactionsDecode(buffer: Buffer) {
        let tmp = JSONCodec.parse(buffer.toString());

        console.log("Transaction: ", tmp)

        tmp.serialized = Buffer.from(tmp.serialized.data);

        return tmp;
    };

    public roundsEncode(round) {
        return Buffer.from(JSONCodec.stringify(camelizeKeys(JSONCodec.removePrefix(round, "Round_"))));
    };

    public roundsDecode(buffer: Buffer) {
        return JSON.parse(buffer.toString());
    };

    // // @ts-ignore
    // private blocks() {
    //     const codec = createCodec();
    //     codec.addExtPacker(0x3f, Object, JSONCodec.blocksEncode);
    //     codec.addExtUnpacker(0x3f, JSONCodec.blocksDecode);
    //
    //     return codec;
    // }
    //
    // // @ts-ignore
    // private transactions() {
    //     const codec = createCodec();
    //     codec.addExtPacker(0x4f, Object, JSONCodec.transactionsEncode);
    //     codec.addExtUnpacker(0x4f, JSONCodec.transactionsDecode);
    //
    //     return codec;
    // }
    //
    // // @ts-ignore
    // private rounds() {
    //     const codec = createCodec();
    //     codec.addExtPacker(0x5f, Object, JSONCodec.roundsEncode);
    //     codec.addExtUnpacker(0x5f, JSONCodec.roundsDecode);
    //
    //     return codec;
    // }

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



    private static stringify(item: any): string {
        // return JSON.stringify(item, typeof item === 'bigint'
        //     ? item.toString()
        //     : item);

        return JSON.stringify(item, (_, v) => typeof v === 'bigint' ? `${v}n` : v);
    };

    private static parse(text: string) {
        return JSON.parse(text, (_, value) => {
            if (typeof value === 'string') {
                const m = value.match(/(-?\d+)n/);
                if (m && m[0] === value) {
                    value = BigInt(m[1]);
                }
            }
            return value;
        });
    }
}
