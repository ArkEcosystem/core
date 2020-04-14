import { createCodec, encode, decode } from "msgpack-lite";
import { camelizeKeys } from "xcase";
import { Utils, Blocks, Transactions, Interfaces } from "@arkecosystem/crypto";
import { Models } from "@arkecosystem/core-database";
import { Codec as CodecException } from "../exceptions";

export class Codec {
    public static get blocks() {
        const codec = createCodec();
        codec.addExtPacker(0x3f, Object, Codec.encodeBlock);
        codec.addExtUnpacker(0x3f, Codec.decodeBlock);

        return codec;
    }

    public static get transactions() {
        const codec = createCodec();
        codec.addExtPacker(0x4f, Object, Codec.encodeTransaction);
        codec.addExtUnpacker(0x4f, Codec.decodeTransaction);

        return codec;
    }

    public static get rounds() {
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

            // console.log("BlockCamelized", blockCamelized);

            // console.log(blockCamelized.height);

            blockCamelized.totalAmount = Utils.BigNumber.make(blockCamelized.totalAmount);
            blockCamelized.totalFee = Utils.BigNumber.make(blockCamelized.totalFee);
            blockCamelized.reward = Utils.BigNumber.make(blockCamelized.reward);

            if (blockCamelized.id === "03baed9cf928dffb6d5c389a6fa1c59bb357ca9d32447980f82e4a53930515f0"
                // blockCamelized.id === "6c34dc96ede343b75b609493595216d98952b07dd7465f96496342d9df141e6d" || // 1896568
                // blockCamelized.id === "160ee4bcefc43dd3496a2ca591b290d6ec81cd2993d612be3d9c0f88a69bf818"    // 1896570
            ) {
                console.log(blockCamelized);
            }

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

            // console.log("Block Deserialized", block);

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
        // return JSON.parse(buffer.toString());
        let transactionId = undefined;
        try {
            const [id, blockId, sequence, timestamp, serialized] = decode(buffer);
            transactionId = id;

            const transaction: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytesUnsafe(serialized, id);

            // console.log("Transaction Decoded: ", transaction);

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

            // console.log("TransactionToReturn Decoded: ", transactionEntity);

            return transactionEntity;
        } catch (e) {
            throw new CodecException.TransactionDecodeException(transactionId as unknown as string);
        }
    };

    private static encodeRound(round) {
        // return JSON.stringify(camelizeKeys(Codec.removePrefix(round, "Round_")));

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
            // return JSON.parse(buffer.toString());
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
