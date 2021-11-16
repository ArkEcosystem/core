import { Models } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { Blocks, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { decode, encode } from "msgpack-lite";
import { camelize } from "xcase";

import { Codec } from "../contracts";
import { Codec as CodecException } from "../exceptions";

@Container.injectable()
export class MessagePackCodec implements Codec {
    public encodeBlock(block: any): Buffer {
        try {
            const newBlock = {};
            for (const key of Object.keys(block)) {
                if (!key.startsWith("Block_")) throw new Error("Invalid block.");
                const newKey = camelize(key.slice("Block_".length));
                newBlock[newKey] = block[key];
            }

            return Blocks.Serializer.serializeHeader(newBlock as Interfaces.IBlockData);
        } catch (err) {
            throw new CodecException.BlockEncodeException(block.Block_id, err.message);
        }
    }

    public decodeBlock(buffer: Buffer): Models.Block {
        try {
            return Blocks.Deserializer.deserialize(buffer, false).data as Models.Block;
        } catch (err) {
            throw new CodecException.BlockDecodeException(undefined, err.message);
        }
    }

    public encodeTransaction(transaction: any): Buffer {
        try {
            return encode([
                transaction.Transaction_id,
                transaction.Transaction_block_id,
                transaction.Transaction_block_height,
                transaction.Transaction_sequence,
                transaction.Transaction_timestamp,
                transaction.Transaction_serialized,
            ]);
        } catch (err) {
            throw new CodecException.TransactionEncodeException(transaction.Transaction_id, err.message);
        }
    }

    public decodeTransaction(buffer: Buffer): Models.Transaction {
        let transactionId = undefined;
        try {
            const [id, blockId, blockHeight, sequence, timestamp, serialized] = decode(buffer);
            transactionId = id;

            const transaction: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytesUnsafe(
                serialized,
                id,
            );

            /* istanbul ignore next */
            return {
                id: id,
                version: transaction.data.version!,
                blockId: blockId,
                blockHeight: blockHeight,
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
                typeGroup: transaction.data.typeGroup || 1,
                nonce: Utils.BigNumber.make(transaction.data.nonce || 0),
                // @ts-ignore
                asset: transaction.data.asset,
            };
        } catch (err) {
            throw new CodecException.TransactionDecodeException(transactionId as unknown as string, err.message);
        }
    }

    public encodeRound(round: any): Buffer {
        try {
            return encode([round.Round_public_key, round.Round_balance, round.Round_round]);
        } catch (err) {
            throw new CodecException.RoundEncodeException(round.Round_round, err.message);
        }
    }

    public decodeRound(buffer: Buffer): Models.Round {
        try {
            const [publicKey, balance, round] = decode(buffer);

            return {
                publicKey,
                balance,
                round,
            };
        } catch (err) {
            throw new CodecException.RoundDecodeException(undefined, err.message);
        }
    }
}
