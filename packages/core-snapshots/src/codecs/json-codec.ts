import { Models } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { camelizeKeys } from "xcase";

import { Codec } from "../contracts";
import { Codec as CodecException } from "../exceptions";

@Container.injectable()
export class JSONCodec implements Codec {
    private static prepareData(data: any) {
        if (Buffer.isBuffer(data)) {
            return data.toJSON();
        }

        if (typeof data === "bigint") {
            return data.toString();
        }

        return data;
    }

    private static removePrefix(item: Record<string, any>, prefix: string): any {
        const itemToReturn = {};

        for (const key of Object.keys(item)) {
            itemToReturn[key.replace(prefix, "")] = JSONCodec.prepareData(item[key]);
        }

        return itemToReturn;
    }

    private static stringify(item: any): string {
        return JSON.stringify(item, (_, value) => (typeof value === "bigint" ? `${value}n` : value));
    }

    private static parse(text: string) {
        return JSON.parse(text, (_, value) => {
            if (typeof value === "string") {
                const match = value.match(/(-?\d+)n/);
                if (match && match[0] === value) {
                    value = BigInt(match[1]);
                }
            }
            return value;
        });
    }

    public encodeBlock(block: any): Buffer {
        try {
            const blockStringified = JSONCodec.stringify(camelizeKeys(JSONCodec.removePrefix(block, "Block_")));

            return Buffer.from(blockStringified);
        } catch (err) {
            throw new CodecException.BlockEncodeException(block.Block_id, err.message);
        }
    }

    public decodeBlock(buffer: Buffer): Models.Block {
        try {
            return JSON.parse(buffer.toString());
        } catch (err) {
            throw new CodecException.BlockDecodeException(undefined, err.message);
        }
    }

    public encodeTransaction(transaction: any): Buffer {
        try {
            let tmp = JSONCodec.removePrefix(transaction, "Transaction_");
            tmp = camelizeKeys(tmp);

            tmp = JSONCodec.stringify(tmp);

            return Buffer.from(tmp);
        } catch (err) {
            throw new CodecException.TransactionEncodeException(transaction.Transaction_id, err.message);
        }
    }

    public decodeTransaction(buffer: Buffer): Models.Transaction {
        try {
            const tmp = JSONCodec.parse(buffer.toString());

            const serialized = [] as any[];

            for (const value of Object.values(tmp.serialized.data)) {
                serialized.push(value);
            }

            tmp.serialized = Buffer.from(serialized);

            return tmp;
        } catch (err) {
            throw new CodecException.TransactionDecodeException(undefined, err.message);
        }
    }

    public encodeRound(round: any): Buffer {
        try {
            return Buffer.from(JSONCodec.stringify(camelizeKeys(JSONCodec.removePrefix(round, "Round_"))));
        } catch (err) {
            throw new CodecException.RoundEncodeException(round.Round_round, err.message);
        }
    }

    public decodeRound(buffer: Buffer): Models.Round {
        try {
            return JSON.parse(buffer.toString());
        } catch (err) {
            throw new CodecException.RoundDecodeException(undefined, err.message);
        }
    }
}
