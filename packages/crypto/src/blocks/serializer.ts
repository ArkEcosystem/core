import assert from "assert";
import ByteBuffer from "bytebuffer";

import { HashAlgorithms } from "../crypto";
import { PreviousBlockIdFormatError } from "../errors";
import { IBlock, IBlockData, IGenesisBlockData, ITransactionData } from "../interfaces";
import { configManager } from "../managers/config";
import { Utils } from "../transactions";
import { Block } from "./block";

export class Serializer {
    private static cachedIds = new WeakMap<IBlockData | IGenesisBlockData, string>();

    public static getId(data: IBlockData | IGenesisBlockData): string {
        let id = this.cachedIds.get(data);

        if (!id) {
            const serializedHeader = Serializer.serializeHeader(data);
            const hash = HashAlgorithms.sha256(serializedHeader);
            const constants = configManager.getMilestone(data.height);
            const computedId = constants.block.idFullSha256
                ? hash.toString("hex")
                : hash.readBigUInt64LE().toString(10);

            const outlookTable: Record<string, string> = configManager.get("exceptions").outlookTable ?? {};
            id = outlookTable[computedId] ?? computedId;
            this.cachedIds.set(data, id);
        }

        return id;
    }

    public static getIdHex(id: string): string {
        if (id.length === 64) {
            return id;
        } else {
            return BigInt(id).toString(16).padStart(16, "0");
        }
    }

    public static serializeHeader(data: IBlockData | IGenesisBlockData): Buffer {
        const constants = configManager.getMilestone(data.height);
        const buffer = new ByteBuffer(constants.block.maxPayload, true);

        this.writeSignedSection(buffer, data);

        if (data.height !== 1) {
            if (!data.blockSignature) {
                throw new Error("Block signature is missing.");
            }

            this.writeBlockSignature(buffer, data.blockSignature);
        }

        return buffer.flip().toBuffer();
    }

    public static writeSignedSection(buffer: ByteBuffer, data: IBlockData | IGenesisBlockData): void {
        if (data.height === 1) {
            buffer.writeInt32(data.version);
            buffer.writeInt32(data.timestamp);
            buffer.writeInt32(data.height);
            buffer.append("0000000000000000", "hex");
            buffer.writeInt32(data.numberOfTransactions);
            buffer.writeInt64(data.totalAmount.toString() as any);
            buffer.writeInt64(data.totalFee.toString() as any);
            buffer.writeInt64(data.reward.toString() as any);
            buffer.writeInt32(data.payloadLength);
            buffer.append(data.payloadHash, "hex");
            buffer.append(data.generatorPublicKey, "hex");
        } else {
            const previousBlockHex = this.getIdHex(data.previousBlock!);

            buffer.writeUint8(data.version);
            buffer.writeUint32(data.timestamp);
            buffer.writeUint32(data.height);
            buffer.append(previousBlockHex, "hex");
            buffer.writeUint32(data.numberOfTransactions);
            buffer.writeUint64(data.totalAmount.toString() as any);
            buffer.writeUint64(data.totalFee.toString() as any);
            buffer.writeUint64(data.reward.toString() as any);
            buffer.writeUint32(data.payloadLength);
            buffer.append(data.payloadHash, "hex");
            buffer.append(data.generatorPublicKey, "hex");
        }
    }

    public static writeBlockSignature(buffer: ByteBuffer, blockSignature: string): void {
        buffer.append(blockSignature, "hex");
    }

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

    public static serialize(block: IBlockData, includeSignature = true): Buffer {
        const buffer: ByteBuffer = new ByteBuffer(512, true);

        this.serializeHeaderPrev(block, buffer);

        if (includeSignature) {
            this.serializeSignature(block, buffer);
        }

        return buffer.flip().toBuffer();
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

    private static serializeHeaderPrev(block: IBlockData, buffer: ByteBuffer): void {
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
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(block.totalAmount.toString());
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(block.totalFee.toString());
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(block.reward.toString());
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
