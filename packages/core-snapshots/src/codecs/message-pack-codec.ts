import { Blocks, CryptoSuite } from "@arkecosystem/core-crypto";
import { Models } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import { decode, encode } from "msgpack-lite";
import { camelizeKeys } from "xcase";

import { Codec } from "../contracts";
import { Codec as CodecException } from "../exceptions";

@Container.injectable()
export class MessagePackCodec implements Codec {
    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoSuite.CryptoManager;

    @Container.inject(Container.Identifiers.TransactionManager)
    private readonly transactionsManager!: CryptoSuite.TransactionManager;

    @Container.inject(Container.Identifiers.BlockFactory)
    private readonly blockFactory!: Blocks.BlockFactory;

    private static removePrefix(item: Record<string, any>, prefix: string): Record<string, any> {
        const itemToReturn = {};

        for (const key of Object.keys(item)) {
            itemToReturn[key.replace(prefix, "")] = item[key];
        }

        return itemToReturn;
    }

    public encodeBlock(block: any): Buffer {
        try {
            const blockCamelized = camelizeKeys(MessagePackCodec.removePrefix(block, "Block_"));
            return this.blockFactory.serializer.serialize(blockCamelized, true);
        } catch (err) {
            throw new CodecException.BlockEncodeException(block.Block_id, err.message);
        }
    }

    public decodeBlock(buffer: Buffer): Models.Block {
        try {
            return this.blockFactory.deserializer.deserialize(buffer.toString("hex"), false).data as Models.Block;
        } catch (err) {
            throw new CodecException.BlockDecodeException(undefined, err.message);
        }
    }

    public encodeTransaction(transaction): Buffer {
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

    public decodeTransaction(buffer: Buffer): Models.Transaction {
        let transactionId = undefined;
        try {
            const [id, blockId, sequence, timestamp, serialized] = decode(buffer);
            transactionId = id;

            const transaction: Interfaces.ITransaction = this.transactionsManager.TransactionFactory.fromBytesUnsafe(
                serialized,
                id,
            );

            /* istanbul ignore next */
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
                typeGroup: transaction.data.typeGroup || 1,
                nonce: this.cryptoManager.LibraryManager.Libraries.BigNumber.make(transaction.data.nonce || 0),
                // @ts-ignore
                asset: transaction.data.asset,
            };
        } catch (err) {
            throw new CodecException.TransactionDecodeException((transactionId as unknown) as string, err.message);
        }
    }

    public encodeRound(round): Buffer {
        try {
            const roundCamelized = camelizeKeys(MessagePackCodec.removePrefix(round, "Round_"));

            return encode([roundCamelized.publicKey, roundCamelized.balance, roundCamelized.round]);
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
