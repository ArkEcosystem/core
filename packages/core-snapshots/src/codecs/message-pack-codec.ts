import { Models } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { Blocks, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { decode, encode } from "msgpack-lite";
import { camelizeKeys } from "xcase";

import { Codec } from "../contracts";
import { Codec as CodecException } from "../exceptions";

@Container.injectable()
export class MessagePackCodec implements Codec {
    private static removePrefix(item: Record<string, any>, prefix: string): Record<string, any> {
        const itemToReturn = {};

        for (const key of Object.keys(item)) {
            itemToReturn[key.replace(prefix, "")] = item[key];
        }

        return itemToReturn;
    }

    public blocksEncode(block: any): Buffer {
        try {
            const blockCamelized = camelizeKeys(MessagePackCodec.removePrefix(block, "Block_"));

            return Blocks.Serializer.serialize(blockCamelized, true);
        } catch (err) {
            throw new CodecException.BlockEncodeException(block.Block_id, err.message);
        }
    }

    public blocksDecode(buffer: Buffer): Models.Block {
        try {
            return Blocks.Deserializer.deserialize(buffer.toString("hex"), false).data as Models.Block;
        } catch (err) {
            throw new CodecException.BlockDecodeException(undefined, err.message);
        }
    }

    public transactionsEncode(transaction): Buffer {
        try {
            return encode([
                transaction.Transaction_id,
                transaction.Transaction_block_id,
                transaction.Transaction_sequence,
                transaction.Transaction_timestamp,
                transaction.Transaction_serialized,
            ]);
        } catch (err) {
            throw new CodecException.TransactionEncodeException(transaction.Transaction_id, err.message);
        }
    }

    public transactionsDecode(buffer: Buffer): Models.Transaction {
        let transactionId = undefined;
        try {
            const [id, blockId, sequence, timestamp, serialized] = decode(buffer);
            transactionId = id;

            const transaction: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytesUnsafe(
                serialized,
                id,
            );

            return {
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
                amount: transaction.data.amount,
                fee: transaction.data.fee,
                serialized: serialized,
                /* istanbul ignore next */
                typeGroup: transaction.data.typeGroup || 1,
                nonce: Utils.BigNumber.make(transaction.data.nonce || 0),
                // @ts-ignore
                asset: transaction.data.asset,
            };
        } catch (err) {
            throw new CodecException.TransactionDecodeException((transactionId as unknown) as string, err.message);
        }
    }

    public roundsEncode(round): Buffer {
        try {
            const roundCamelized = camelizeKeys(MessagePackCodec.removePrefix(round, "Round_"));

            return encode([roundCamelized.publicKey, roundCamelized.balance, roundCamelized.round]);
        } catch (err) {
            throw new CodecException.RoundEncodeException(round.Round_round, err.message);
        }
    }

    public roundsDecode(buffer: Buffer): Models.Round {
        let roundRound = undefined;

        try {
            const [publicKey, balance, round] = decode(buffer);

            roundRound = round;

            const roundEntity: Models.Round = {
                publicKey,
                balance,
                round,
            };

            return roundEntity;
        } catch (err) {
            throw new CodecException.RoundDecodeException((roundRound as unknown) as string, err.message);
        }
    }
}
