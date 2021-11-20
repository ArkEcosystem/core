import { Serde } from "..";
import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IBlockData, IBlockHeaderData, IBlockSignedData, IWriter } from "../interfaces";
import { configManager } from "../managers";

type OutlookTable = {
    [id: string]: string | undefined;
};

export class Serializer {
    public static getSignedSize(data: IBlockSignedData): number {
        const previousMilestone = configManager.getMilestone(data.height - 1 || 1);

        let size = 0;
        size += 4; // version
        size += 4; // timestamp
        size += 4; // height
        size += previousMilestone.block.idFullSha256 ? 32 : 8;
        size += 4; // numberOfTransactions
        size += 8; // totalAmount
        size += 8; // totalFee
        size += 8; // reward
        size += 4; // payloadLength
        size += data.payloadHash.length / 2;
        size += data.generatorPublicKey.length / 2;

        if (data.version === 1) {
            size += 1; // previousBlockVotes.length
            size += data.previousBlockVotes.length * 65;
        }

        return size;
    }

    public static getHeaderSize(data: IBlockHeaderData): number {
        return this.getSignedSize(data) + data.blockSignature.length / 2;
    }

    public static getSize(data: IBlockData): number {
        return this.getHeaderSize(data) + data.transactions.reduce((sum, b) => sum + 4 + b.length, 0);
    }

    public static getSignedHash(data: IBlockSignedData): Buffer {
        try {
            const size = this.getSignedSize(data);
            const writer = Serde.SerdeFactory.createWriter(Buffer.alloc(size));
            this.writeSignedData(writer, data);

            if (writer.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return HashAlgorithms.sha256(writer.getResult());
        } catch (cause) {
            throw new CryptoError("Cannot calculate block signed hash.", { cause });
        }
    }

    public static getHeaderHash(data: IBlockHeaderData): Buffer {
        try {
            const size = this.getHeaderSize(data);
            const writer = Serde.SerdeFactory.createWriter(Buffer.alloc(size));
            this.writeSignedData(writer, data);
            writer.writeEcdsaSignature(Buffer.from(data.blockSignature, "hex"));

            if (writer.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return HashAlgorithms.sha256(writer.getResult());
        } catch (cause) {
            throw new CryptoError("Cannot calculate block header hash.", { cause });
        }
    }

    public static getId(data: IBlockHeaderData): string {
        try {
            const hash = data.height === 1 ? this.getSignedHash(data) : this.getHeaderHash(data);
            const milestone = configManager.getMilestone(data.height);
            const id = milestone.block.idFullSha256 ? hash.toString("hex") : hash.readBigUInt64LE().toString();

            return configManager.get<OutlookTable>("exceptions.outlookTable")?.[id] ?? id;
        } catch (cause) {
            throw new CryptoError("Cannot calculate block id.", { cause });
        }
    }

    public static serialize(data: IBlockData): Buffer {
        try {
            const size = this.getSize(data);
            const writer = Serde.SerdeFactory.createWriter(Buffer.alloc(size));
            this.writeSignedData(writer, data);
            writer.writeEcdsaSignature(Buffer.from(data.blockSignature, "hex"));
            data.transactions.forEach((buffer) => writer.writeUInt32LE(buffer.length));
            data.transactions.forEach((buffer) => writer.writeBuffer(buffer));

            if (writer.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return Buffer.from(writer.getResult());
        } catch (cause) {
            throw new CryptoError("Cannot serialize block.", { cause });
        }
    }

    public static writeSignedData(writer: IWriter, data: IBlockSignedData): void {
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
}
