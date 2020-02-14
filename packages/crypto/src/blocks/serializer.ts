import assert from "assert";
import ByteBuffer from "bytebuffer";
import Long from "long";
import { PreviousBlockIdFormatError } from "../errors";
import { IBlock, IBlockData, ITransactionData } from "../interfaces";
import { configManager } from "../managers/config";
import { Utils } from "../transactions";
import { Block } from "./block";

export class Serializer {
    public static size(block: IBlock): number {
        let size = this.headerSize(block.data) + block.data.blockSignature.length / 2;

        for (const transaction of block.transactions) {
            size += 4 /* tx length */ + transaction.serialized.length;
        }

        return size;
    }

    public static serializeWithTransactions(block: IBlockData): Buffer {
        const transactions: ITransactionData[] = block.transactions || [];
        block.numberOfTransactions = block.numberOfTransactions || transactions.length;

        const serializedHeader: Buffer = this.serialize(block);

        const buffer: ByteBuffer = new ByteBuffer(serializedHeader.length + transactions.length * 4, true)
            .append(serializedHeader)
            .skip(transactions.length * 4);

        for (let i = 0; i < transactions.length; i++) {
            const serialized: Buffer = Utils.toBytes(transactions[i]);
            buffer.writeUint32(serialized.length, serializedHeader.length + i * 4);
            buffer.append(serialized);
        }

        return buffer.flip().toBuffer();
    }

    public static serialize(block: IBlockData, includeSignature: boolean = true): Buffer {
        const buffer: ByteBuffer = new ByteBuffer(512, true);

        this.serializeHeader(block, buffer);

        if (includeSignature) {
            this.serializeSignature(block, buffer);
        }

        return buffer.flip().toBuffer();
    }

    private static headerSize(block: IBlockData): number {
        const constants = configManager.getMilestone(block.height - 1 || 1);

        return 4 + // version
            4 + // timestamp
            4 + // height
            (constants.block.idFullSha256 ? 32 : 8) + // previousBlock
            4 + // numberOfTransactions
            8 + // totalAmount
            8 + // totalFee
            8 + // reward
            4 + // payloadLength
            block.payloadHash.length / 2 +
            block.generatorPublicKey.length / 2;
    }

    private static serializeHeader(block: IBlockData, buffer: ByteBuffer): void {
        const constants = configManager.getMilestone(block.height - 1 || 1);

        if (constants.block.idFullSha256) {
            if (block.previousBlock.length !== 64) {
                throw new PreviousBlockIdFormatError(block.height, block.previousBlock);
            }

            block.previousBlockHex = block.previousBlock;
        } else {
            block.previousBlockHex = Block.toBytesHex(block.previousBlock);
        }

        buffer.writeUint32(block.version);
        buffer.writeUint32(block.timestamp);
        buffer.writeUint32(block.height);
        buffer.append(block.previousBlockHex, "hex");
        buffer.writeUint32(block.numberOfTransactions);
        buffer.writeUint64(Long.fromString(block.totalAmount.toString()));
        buffer.writeUint64(Long.fromString(block.totalFee.toString()));
        buffer.writeUint64(Long.fromString(block.reward.toString()));
        buffer.writeUint32(block.payloadLength);
        buffer.append(block.payloadHash, "hex");
        buffer.append(block.generatorPublicKey, "hex");

        assert.strictEqual(buffer.offset, this.headerSize(block));
    }

    private static serializeSignature(block: IBlockData, buffer: ByteBuffer): void {
        if (block.blockSignature) {
            buffer.append(block.blockSignature, "hex");
        }
    }
}
