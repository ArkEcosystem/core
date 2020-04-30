import { encode, decode } from "msgpack-lite";
import { camelizeKeys } from "xcase";
import { Utils, Blocks, Interfaces, Transactions } from "@arkecosystem/crypto";
import { Models } from "@arkecosystem/core-database";
import { Codec as CodecException } from "../exceptions";
import { Codec as ICodec  } from "../contracts";
import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class Codec implements ICodec {
    public blocksEncode(block: any) {
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

    public blocksDecode(buffer: Buffer) {
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

    public transactionsEncode(transaction) {
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

    public transactionsDecode(buffer: Buffer) {
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

    public roundsEncode(round) {
        try {
            let roundCamelized = camelizeKeys(Codec.removePrefix(round, "Round_"));

            return encode([roundCamelized.publicKey, roundCamelized.balance, roundCamelized.round]);
        } catch (e) {
            throw new CodecException.RoundEncodeException(round.Round_round);
        }
    };

    public roundsDecode(buffer: Buffer) {
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

    private static removePrefix(item: Object, prefix: string): Object {
        let itemToReturn = {};

        for(let key of Object.keys(item)) {
            itemToReturn[key.replace(prefix, "")] = item[key];
        }

        return itemToReturn;
    };
}
