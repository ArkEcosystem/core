import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import {
    IBlockData,
    IBlockHeaderData,
    IBlockPayloadSection,
    IBlockSignatureSection,
    IBlockSignedSection,
    IWriter,
} from "../interfaces";
import { configManager } from "../managers";
import { SerdeFactory } from "../serde";

export class Serializer {
    public static getSignedSectionSize(section: IBlockSignedSection): number {
        let size = 0;

        size += 4; // version
        size += 4; // timestamp
        size += 4; // height

        const previousMilestone = configManager.getMilestone(section.height - 1 || 1);
        size += previousMilestone.block.idFullSha256 ? 32 : 8; // previousBlock

        size += 4; // numberOfTransactions
        size += 8; // totalAmount
        size += 8; // totalFee
        size += 8; // reward
        size += 4; // payloadLength
        size += 32; // payloadHash
        size += 33; // generatorPublicKey

        if (section.version === 1) {
            size += 1; // previousBlockVotes.length
            size += section.previousBlockVotes.length * 65;
        }

        return size;
    }

    public static getSignatureSectionSize(section: IBlockSignatureSection): number {
        return section.blockSignature.length / 2;
    }

    public static getPayloadSectionSize(section: IBlockPayloadSection): number {
        let size = 0;

        for (const transaction of section.transactions) {
            size += 4;
            size += transaction.serialized.length;
        }

        return size;
    }

    public static getSize(block: IBlockData): number {
        let size = 0;

        size += this.getSignedSectionSize(block);
        size += this.getSignatureSectionSize(block);
        size += this.getPayloadSectionSize(block);

        return size;
    }

    public static getId(header: IBlockHeaderData): string {
        try {
            const hash = header.height === 1 ? this.getSignedSectionHash(header) : this.getHeaderHash(header);
            const milestone = configManager.getMilestone(header.height);
            const id = milestone.block.idFullSha256 ? hash.toString("hex") : hash.readBigUInt64LE().toString();

            return configManager.get("exceptions.outlookTable")?.[id] ?? id;
        } catch (cause) {
            throw new CryptoError("Cannot calculate block id.", { cause });
        }
    }

    public static getSignedSectionHash(section: IBlockSignedSection): Buffer {
        try {
            const size = this.getSignedSectionSize(section);
            const buffer = Buffer.alloc(size);
            const writer = SerdeFactory.createWriter(buffer);

            this.writeSignedSection(writer, section);

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
            const size = this.getSignedSectionSize(header) + this.getSignatureSectionSize(header);
            const buffer = Buffer.alloc(size);
            const writer = SerdeFactory.createWriter(buffer);

            this.writeSignedSection(writer, header);
            this.writeSignatureSection(writer, header);

            if (writer.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return HashAlgorithms.sha256(writer.getResult());
        } catch (cause) {
            throw new CryptoError("Cannot calculate block header hash.", { cause });
        }
    }

    public static serialize(block: IBlockData): Buffer {
        try {
            const size = this.getSize(block);
            const buffer = Buffer.alloc(size);
            const writer = SerdeFactory.createWriter(buffer);

            this.writeSignedSection(writer, block);
            this.writeSignatureSection(writer, block);
            this.writePayloadSection(writer, block);

            if (writer.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return writer.getResult();
        } catch (cause) {
            throw new CryptoError("Cannot serialize block.", { cause });
        }
    }

    public static writeSignedSection(writer: IWriter, section: IBlockSignedSection): void {
        if (section.version !== 0 && section.version !== 1) {
            throw new CryptoError("Unexpected block version.");
        }

        writer.writeUInt32LE(section.version);
        writer.writeUInt32LE(section.timestamp);
        writer.writeUInt32LE(section.height);

        const previousMilestone = configManager.getMilestone(section.height - 1 || 1);
        previousMilestone.block.idFullSha256
            ? writer.writeBuffer(Buffer.from(section.previousBlock, "hex"))
            : writer.writeBigUInt64BE(BigInt(section.previousBlock));

        writer.writeUInt32LE(section.numberOfTransactions);
        writer.writeBigUInt64LE(BigInt(section.totalAmount.toString()));
        writer.writeBigUInt64LE(BigInt(section.totalFee.toString()));
        writer.writeBigUInt64LE(BigInt(section.reward.toString()));
        writer.writeUInt32LE(section.payloadLength);
        writer.writeBuffer(Buffer.from(section.payloadHash, "hex"));
        writer.writePublicKey(Buffer.from(section.generatorPublicKey, "hex"));

        if (section.version === 1) {
            writer.writeUInt8(section.previousBlockVotes.length);
            writer.writeSchnorrMultiSignature(section.previousBlockVotes);
        }
    }

    public static writeSignatureSection(writer: IWriter, section: IBlockSignatureSection): void {
        writer.writeEcdsaSignature(Buffer.from(section.blockSignature, "hex"));
    }

    public static writePayloadSection(writer: IWriter, section: IBlockPayloadSection): void {
        for (const transaction of section.transactions) {
            writer.writeUInt32LE(transaction.serialized.length);
        }

        for (const transaction of section.transactions) {
            writer.writeBuffer(transaction.serialized);
        }
    }
}
