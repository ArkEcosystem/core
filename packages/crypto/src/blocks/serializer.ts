import assert from "assert";
import ByteBuffer from "bytebuffer";

import { PreviousBlockIdFormatError } from "../errors";
import { IBlock, IBlockData, ITransactionData } from "../interfaces";
import { configManager } from "../managers/config";
import { Utils } from "../transactions";
import { Block } from "./block";

export class Serializer {
    public static size(block: IBlock): number {
        let size = this.headerSize(block.data) + block.data.blockSignature!.length / 2;

        for (const transaction of block.transactions) {
            size += 4 /* tx length */ + transaction.serialized.length;
        }

        return size;
    }

    public static serializeWithTransactions(block: IBlockData): Buffer {
        const transactions: ITransactionData[] = block.transactions || [];
        block.numberOfTransactions = block.numberOfTransactions || transactions.length;

        const serializedHeader: Buffer = this.serialize(block);

        const buff: ByteBuffer = new ByteBuffer(serializedHeader.length + transactions.length * 4, true)
            .append(serializedHeader)
            .skip(transactions.length * 4);

        for (let i = 0; i < transactions.length; i++) {
            const serialized: Buffer = Utils.toBytes(transactions[i]);
            buff.writeUint32(serialized.length, serializedHeader.length + i * 4);
            buff.append(serialized);
        }

        return buff.flip().toBuffer();
    }

    public static serialize(block: IBlockData, includeSignature = true): Buffer {
        const buff: ByteBuffer = new ByteBuffer(512, true);

        this.serializeHeader(block, buff);

        if (includeSignature) {
            this.serializeSignature(block, buff);
        }

        return buff.flip().toBuffer();
    }

    private static headerSize(block: IBlockData): number {
        const constants = configManager.getMilestone(block.height - 1 || 1);

        return (
            4 + // version
            4 + // timestamp
            4 + // height
            (constants.block.idFullSha256 ? 32 : 8) + // previousBlock
            4 + // numberOfTransactions
            8 + // totalAmount
            8 + // totalFee
            8 + // reward
            4 + // payloadLength
            block.payloadHash.length / 2 +
            block.generatorPublicKey.length / 2
        );
    }

    private static serializeHeader(block: IBlockData, buff: ByteBuffer): void {
        const constants = configManager.getMilestone(block.height - 1 || 1);

        if (constants.block.idFullSha256) {
            if (block.previousBlock.length !== 64) {
                throw new PreviousBlockIdFormatError(block.height, block.previousBlock);
            }

            block.previousBlockHex = block.previousBlock;
        } else {
            block.previousBlockHex = Block.toBytesHex(block.previousBlock);
        }

        buff.writeUint32(block.version);
        buff.writeUint32(block.timestamp);
        buff.writeUint32(block.height);
        buff.append(block.previousBlockHex, "hex");
        buff.writeUint32(block.numberOfTransactions);
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buff.writeUint64(block.totalAmount.toString());
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buff.writeUint64(block.totalFee.toString());
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buff.writeUint64(block.reward.toString());
        buff.writeUint32(block.payloadLength);
        buff.append(block.payloadHash, "hex");
        buff.append(block.generatorPublicKey, "hex");

        assert.strictEqual(buff.offset, this.headerSize(block));
    }

    private static serializeSignature(block: IBlockData, buff: ByteBuffer): void {
        if (block.blockSignature) {
            buff.append(block.blockSignature, "hex");
        }
    }
}
