import { camelizeKeys } from "xcase";
import { Codec } from "../contracts";
import { Container } from "@arkecosystem/core-kernel";
import { Codec as CodecException } from "../exceptions";

@Container.injectable()
export class JSONCodec implements Codec {
    public blocksEncode(block): Buffer {
        try {
            let blockStringified = JSONCodec.stringify(camelizeKeys(JSONCodec.removePrefix(block, "Block_")))

            return Buffer.from(blockStringified);
        } catch (e) {
            throw new CodecException.BlockEncodeException(block.Block_id);
        }
    };

    public blocksDecode(buffer: Buffer): any {
        try {
            return JSON.parse(buffer.toString());
        } catch (e) {
            throw new CodecException.BlockDecodeException();
        }
    };

    public transactionsEncode(transaction) {
        try {
            let tmp = JSONCodec.removePrefix(transaction, "Transaction_");
            tmp = camelizeKeys(tmp);

            tmp = JSONCodec.stringify(tmp);

            return Buffer.from(tmp);
        } catch (e) {
            throw new CodecException.TransactionEncodeException(transaction.Transaction_id)
        }
    };

    public transactionsDecode(buffer: Buffer) {
        try {
            let tmp = JSONCodec.parse(buffer.toString());

            let serialized = [] as any[];

            for(let value of Object.values(tmp.serialized.data)) {
                serialized.push(value);
            }

            tmp.serialized = Buffer.from(serialized);

            return tmp;
        } catch (e) {
            throw new CodecException.TransactionDecodeException();
        }
    };

    public roundsEncode(round) {
        try {
            return Buffer.from(JSONCodec.stringify(camelizeKeys(JSONCodec.removePrefix(round, "Round_"))));
        } catch (e) {
            throw new CodecException.RoundEncodeException(round.Round_round);
        }
    };

    public roundsDecode(buffer: Buffer) {
        try {
            return JSON.parse(buffer.toString());
        } catch (e) {
            throw new CodecException.RoundDecodeException()
        }
    };

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
