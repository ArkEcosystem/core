import { createCodec, encode, decode } from "msgpack-lite";
import { camelizeKeys } from "xcase";
import { Utils, Blocks, Transactions, Interfaces } from "@arkecosystem/crypto";
import { Models } from "@arkecosystem/core-database";
import { Codec as CodecException } from "../exceptions";
import { Codec as ICodec  } from "../contracts";
import { Container } from "@arkecosystem/core-kernel";
import msgpack from "msgpack-lite";

@Container.injectable()
export class Codec implements ICodec {
    // public name: string = "default";

    public createDecodeStream(table: string): NodeJS.ReadWriteStream {
        return msgpack.createDecodeStream({ codec: this[table]() });
    }

    public createEncodeStream(table: string): NodeJS.ReadWriteStream {
        return msgpack.createEncodeStream({ codec: this[table]() });
    }

    // @ts-ignore
    private blocks() {
        const codec = createCodec();
        codec.addExtPacker(0x3f, Object, Codec.encodeBlock);
        codec.addExtUnpacker(0x3f, Codec.decodeBlock);

        return codec;
    }

    // @ts-ignore
    private transactions() {
        const codec = createCodec();
        codec.addExtPacker(0x4f, Object, Codec.encodeTransaction);
        codec.addExtUnpacker(0x4f, Codec.decodeTransaction);

        return codec;
    }

    // @ts-ignore
    private rounds() {
        const codec = createCodec();
        codec.addExtPacker(0x5f, Object, Codec.encodeRound);
        codec.addExtUnpacker(0x5f, Codec.decodeRound);

        return codec;
    }

    private static removePrefix(item: Object, prefix: string): Object {
        let itemToReturn = {};

        for(let key of Object.keys(item)) {
            itemToReturn[key.replace(prefix, "")] = item[key];
        }

        return itemToReturn;
    };

    private static encodeBlock(block: any) {
        try {
            let blockCamelized = camelizeKeys(Codec.removePrefix(block, "Block_"));

            blockCamelized.totalAmount = Utils.BigNumber.make(blockCamelized.totalAmount);
            blockCamelized.totalFee = Utils.BigNumber.make(blockCamelized.totalFee);
            blockCamelized.reward = Utils.BigNumber.make(blockCamelized.reward);

            return Blocks.Serializer.serialize(blockCamelized, true);
        } catch (e) {
            throw new CodecException.BlockEncodeException(block.Block_id);
        }
    };

    private static decodeBlock(buffer: Buffer) {
        let blockId = undefined;
        try {
            let block: any = Blocks.Deserializer.deserialize(buffer.toString("hex"), false).data;

            blockId = block.id;

            block.totalAmount = block.totalAmount.toFixed();
            block.totalFee = block.totalFee.toFixed();
            block.reward = block.reward.toFixed();

            return block;
        } catch (e) {
            throw new CodecException.BlockDecodeException(blockId as unknown as string);
        }
    };

    private static encodeTransaction(transaction) {
        // return JSON.stringify(camelizeKeys(Codec.removePrefix(transaction, "Transaction_")));
        // const transactionCamelized = camelizeKeys(Codec.removePrefix(transaction, "Transaction_"));
        // const transactionCamelized: any = Codec.removePrefix(transaction, "Transaction_");

        // console.log("Transaction", transaction);
        // console.log("TransactionCamelized", transactionCamelized);

        // return encode([
        //     transactionCamelized.id,
        //     transactionCamelized.blockId,
        //     transactionCamelized.sequence,
        //     transactionCamelized.timestamp,
        //     transactionCamelized.serialized,
        // ]);
        try {
            return encode([
                transaction.Transaction_id,
                transaction.Transaction_block_id,
                transaction.Transaction_sequence,
                transaction.Transaction_timestamp,
                transaction.Transaction_serialized,
            ]);
        } catch (e) {
            throw new CodecException.TransactionEncodeException(transaction.Transaction_id)
        }
    };


    private static decodeTransaction(buffer: Buffer) {
        let transactionId = undefined;
        try {
            const [id, blockId, sequence, timestamp, serialized] = decode(buffer);
            transactionId = id;

            const transaction: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytesUnsafe(serialized, id);

            let transactionEntity: Models.Transaction = {
                id: id,
                version: transaction.data.version!,
                blockId: blockId,
                sequence: sequence,
                timestamp: timestamp,
                senderPublicKey: transaction.data.senderPublicKey!,
                // @ts-ignore
                recipientId: transaction.data.recipientId,
                type: transaction.data.type,
                vendorField: transaction.data.vendorField,
                amount: BigInt(transaction.data.amount.toFixed()),
                fee: BigInt(transaction.data.fee.toFixed()),
                serialized: serialized,
                typeGroup: transaction.data.typeGroup || 1,
                // @ts-ignore
                nonce: BigInt(transaction.data.nonce ? transaction.data.nonce.toFixed() : 0),
                // @ts-ignore
                asset: transaction.data.asset
            };

            return transactionEntity;
        } catch (e) {
            throw new CodecException.TransactionDecodeException(transactionId as unknown as string);
        }
    };

    private static encodeRound(round) {
        try {
            let roundCamelized = camelizeKeys(Codec.removePrefix(round, "Round_"));

            return encode([roundCamelized.publicKey, roundCamelized.balance, roundCamelized.round]);
        } catch (e) {
            throw new CodecException.RoundEncodeException(round.round);
        }
    };

    private static decodeRound(buffer: Buffer) {
        let roundRound = undefined;

        try {
            const [publicKey, balance, round] = decode(buffer);

            let roundEntity: Models.Round = {
                publicKey,
                balance,
                round
            };

            roundRound = round;

            return roundEntity;
        } catch (e) {
            throw new CodecException.RoundDecodeException(roundRound as unknown as string)
        }
    };
}
