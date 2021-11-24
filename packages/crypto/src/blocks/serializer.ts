import ByteBuffer from "bytebuffer";

import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IBlockData, IBlockHeaderData, IBlockSignedData } from "../interfaces";
import { configManager } from "../managers";

type OutlookTable = {
    [id: string]: string | undefined;
};

export class Serializer {
    public static getSignedDataSize(data: IBlockSignedData): number {
        const previousMilestone = configManager.getMilestone(data.height - 1 || 1);

        let size = 0;
        size += 4; // version
        size += 4; // timestamp
        size += 4; // height
        size += previousMilestone.block.idFullSha256 ? 32 : 8; // previousBlock
        size += 4; // numberOfTransactions
        size += 8; // totalAmount
        size += 8; // totalFee
        size += 8; // reward
        size += 4; // payloadLength
        size += 32; // payloadHash
        size += 33; // generatorPublicKey

        if (data.version === 1) {
            size += 1; // previousBlockVotes.length
            size += data.previousBlockVotes.length * 65;
        }

        return size;
    }

    public static getHeaderDataSize(data: IBlockHeaderData): number {
        return this.getSignedDataSize(data) + data.blockSignature.length / 2;
    }

    public static getDataSize(data: IBlockData): number {
        return this.getHeaderDataSize(data) + data.transactions.reduce((sum, b) => sum + 4 + b.length, 0);
    }

    public static getSignedDataHash(data: IBlockSignedData): Buffer {
        try {
            const buffer = new ByteBuffer(this.getSignedDataSize(data)).LE();
            this.writeSignedData(buffer, data);

            if (buffer.remaining() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return HashAlgorithms.sha256(buffer.flip().toBuffer());
        } catch (cause) {
            throw new CryptoError("Cannot calculate block signed hash.", { cause });
        }
    }

    public static getHeaderDataHash(data: IBlockHeaderData): Buffer {
        try {
            const buffer = new ByteBuffer(this.getHeaderDataSize(data)).LE();
            this.writeSignedData(buffer, data);
            this.writeBlockSignature(buffer, data.blockSignature);

            if (buffer.remaining() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return HashAlgorithms.sha256(buffer.flip().toBuffer());
        } catch (cause) {
            throw new CryptoError("Cannot calculate block header hash.", { cause });
        }
    }

    public static getId(data: IBlockHeaderData): string {
        try {
            const hash = data.height === 1 ? this.getSignedDataHash(data) : this.getHeaderDataHash(data);
            const milestone = configManager.getMilestone(data.height);
            const id = milestone.block.idFullSha256 ? hash.toString("hex") : hash.readBigUInt64LE().toString();
            const outlookTable = configManager.get<OutlookTable>("exceptions.outlookTable") ?? {};

            return outlookTable[id] ?? id;
        } catch (cause) {
            throw new CryptoError("Cannot calculate block id.", { cause });
        }
    }

    public static serialize(data: IBlockData): Buffer {
        try {
            const buffer = new ByteBuffer(this.getDataSize(data)).LE();
            this.writeSignedData(buffer, data);
            this.writeBlockSignature(buffer, data.blockSignature);
            this.writeTransactions(buffer, data.transactions);

            if (buffer.remaining() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return buffer.flip().toBuffer();
        } catch (cause) {
            throw new CryptoError("Cannot serialize block.", { cause });
        }
    }

    public static writeSignedData(buffer: ByteBuffer, data: IBlockSignedData): void {
        if (data.version !== 0 && data.version !== 1) {
            throw new CryptoError("Unexpected block version.");
        }

        buffer.writeUint32(data.version);
        buffer.writeUint32(data.timestamp);
        buffer.writeUint32(data.height);

        const previousMilestone = configManager.getMilestone(data.height - 1 || 1);
        previousMilestone.block.idFullSha256
            ? buffer.append(data.previousBlock, "hex")
            : // @ts-ignore
              buffer.BE().writeUint64(data.previousBlock).LE();

        buffer.writeUint32(data.numberOfTransactions);

        // @ts-ignore
        buffer.writeUint64(data.totalAmount.toString());
        // @ts-ignore
        buffer.writeUint64(data.totalFee.toString());
        // @ts-ignore
        buffer.writeUint64(data.reward.toString());

        buffer.writeUint32(data.payloadLength);
        buffer.append(data.payloadHash, "hex");
        buffer.append(data.generatorPublicKey, "hex");

        if (data.version === 1) {
            this.writePreviousBlockVotes(buffer, data.previousBlockVotes);
        }
    }

    public static writePreviousBlockVotes(buffer: ByteBuffer, previousBlockVotes: readonly string[]): void {
        buffer.writeUint8(previousBlockVotes.length);

        for (const previousBlockVote of previousBlockVotes) {
            buffer.append(previousBlockVote, "hex");
        }
    }

    public static writeBlockSignature(buffer: ByteBuffer, blockSignature: string): void {
        buffer.append(blockSignature, "hex");
    }

    public static writeTransactions(buffer: ByteBuffer, transactions: readonly Buffer[]): void {
        for (const transaction of transactions) {
            buffer.writeUint32(transaction.length);
        }

        for (const transaction of transactions) {
            buffer.append(transaction);
        }
    }
}
