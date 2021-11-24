import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IBlockData, IBlockHeaderData, IBlockSignedData, IWriter } from "../interfaces";
import { configManager } from "../managers";
import { SerdeFactory } from "../serde";

type OutlookTable = {
    [id: string]: string | undefined;
};

export class Serializer {
    public static getSignedSize(signed: IBlockSignedData): number {
        const previousMilestone = configManager.getMilestone(signed.height - 1 || 1);

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

        if (signed.version === 1) {
            size += 1; // previousBlockVotes.length
            size += signed.previousBlockVotes.length * 65;
        }

        return size;
    }

    public static getHeaderSize(header: IBlockHeaderData): number {
        return this.getSignedSize(header) + header.blockSignature.length / 2;
    }

    public static getSize(data: IBlockData): number {
        return this.getHeaderSize(data) + data.transactions.reduce((sum, b) => sum + 4 + b.length, 0);
    }

    public static getSignedHash(signed: IBlockSignedData): Buffer {
        try {
            const size = this.getSignedSize(signed);
            const writer = SerdeFactory.createWriter(Buffer.alloc(size));
            this.writeSignedData(writer, signed);

            if (writer.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return HashAlgorithms.sha256(writer.getResult());
        } catch (cause) {
            throw new CryptoError("Cannot calculate block signed hash.", { cause });
        }
    }

    public static getHeaderHash(header: IBlockHeaderData): Buffer {
        try {
            const size = this.getHeaderSize(header);
            const writer = SerdeFactory.createWriter(Buffer.alloc(size));
            this.writeSignedData(writer, header);
            writer.writeEcdsaSignature(Buffer.from(header.blockSignature, "hex"));

            if (writer.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return HashAlgorithms.sha256(writer.getResult());
        } catch (cause) {
            throw new CryptoError("Cannot calculate block header hash.", { cause });
        }
    }

    public static getId(header: IBlockHeaderData): string {
        try {
            const hash = header.height === 1 ? this.getSignedHash(header) : this.getHeaderHash(header);
            const milestone = configManager.getMilestone(header.height);
            const id = milestone.block.idFullSha256 ? hash.toString("hex") : hash.readBigUInt64LE().toString();
            const outlookTable = configManager.get<OutlookTable>("exceptions.outlookTable") ?? {};

            return outlookTable[id] ?? id;
        } catch (cause) {
            throw new CryptoError("Cannot calculate block id.", { cause });
        }
    }

    public static serialize(data: IBlockData): Buffer {
        try {
            const size = this.getSize(data);
            const writer = SerdeFactory.createWriter(Buffer.alloc(size));
            this.writeSignedData(writer, data);
            writer.writeEcdsaSignature(Buffer.from(data.blockSignature, "hex"));
            this.writeTransactions(writer, data.transactions);

            if (writer.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return Buffer.from(writer.getResult());
        } catch (cause) {
            throw new CryptoError("Cannot serialize block.", { cause });
        }
    }

    public static writeSignedData(writer: IWriter, data: IBlockSignedData): void {
        if (data.version !== 0 && data.version !== 1) {
            throw new CryptoError("Unexpected block version.");
        }

        writer.writeUInt32LE(data.version);
        writer.writeUInt32LE(data.timestamp);
        writer.writeUInt32LE(data.height);

        const previousMilestone = configManager.getMilestone(data.height - 1 || 1);
        previousMilestone.block.idFullSha256
            ? writer.writeBuffer(Buffer.from(data.previousBlock, "hex"))
            : writer.writeBigUInt64BE(BigInt(data.previousBlock));

        writer.writeUInt32LE(data.numberOfTransactions);
        writer.writeBigUInt64LE(BigInt(data.totalAmount.toString()));
        writer.writeBigUInt64LE(BigInt(data.totalFee.toString()));
        writer.writeBigUInt64LE(BigInt(data.reward.toString()));
        writer.writeUInt32LE(data.payloadLength);
        writer.writeBuffer(Buffer.from(data.payloadHash, "hex"));
        writer.writePublicKey(Buffer.from(data.generatorPublicKey, "hex"));

        if (data.version === 1) {
            writer.writeUInt8(data.previousBlockVotes.length);
            writer.writeSchnorrMultiSignature(data.previousBlockVotes);
        }
    }

    public static writeTransactions(writer: IWriter, transactions: readonly Buffer[]): void {
        for (const transaction of transactions) {
            writer.writeUInt32LE(transaction.length);
        }

        for (const transaction of transactions) {
            writer.writeBuffer(transaction);
        }
    }
}
