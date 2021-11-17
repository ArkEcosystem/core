import { Serde } from "..";
import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IBlockData, IWriter } from "../interfaces";
import { configManager } from "../managers";
import { Utils as TransactionUtils } from "../transactions";

export class Serializer {
    private static cachedIds = new WeakMap<IBlockData, string>();

    public static getSignedSectionSize(data: IBlockData): number {
        const previousConstants = configManager.getMilestone(data.height - 1 || 1);

        const previousBlockSize = previousConstants.block.idFullSha256 ? 32 : 8;
        const payloadHashSize = data.payloadHash.length / 2;
        const generatorPublicKeySize = data.generatorPublicKey.length / 2;

        let size = 0;
        size += 4; // version
        size += 4; // timestamp
        size += 4; // height
        size += previousBlockSize;
        size += 4; // numberOfTransactions
        size += 8; // totalAmount
        size += 8; // totalFee
        size += 8; // reward
        size += 4; // payloadLength
        size += payloadHashSize;
        size += generatorPublicKeySize;

        return size;
    }

    public static getHeaderSize(data: IBlockData): number {
        if (!data.blockSignature) {
            throw new CryptoError("No block signature.");
        }

        const blockSignatureSize = data.blockSignature.length / 2;
        return this.getSignedSectionSize(data) + blockSignatureSize;
    }

    public static getDataSize(data: IBlockData): number {
        if (!data.transactions) {
            throw new CryptoError("No transactions.");
        }

        const buffers = data.transactions.map((tx) => TransactionUtils.toBytes(tx));
        const transactionsSize = buffers.reduce((sum, buffer) => sum + 4 + buffer.length, 0);

        return this.getHeaderSize(data) + transactionsSize;
    }

    public static getId(data: IBlockData): string {
        try {
            let id = this.cachedIds.get(data);

            if (!id) {
                const size = data.height === 1 ? this.getSignedSectionSize(data) : this.getHeaderSize(data);
                const writer = Serde.Factory.createWriter(Buffer.alloc(size));

                this.writeSignedSection(writer, data);
                if (data.height !== 1) this.writeBlockSignature(writer, data);
                const hash = HashAlgorithms.sha256(writer.getResult());

                const constants = configManager.getMilestone(data.height);
                const computedId = constants.block.idFullSha256
                    ? hash.toString("hex")
                    : hash.readBigUInt64LE().toString(10);

                const outlookTable = configManager.get<Record<string, string>>("exceptions.outlookTable") ?? {};
                id = outlookTable[computedId] ?? computedId;
                this.cachedIds.set(data, id);
            }

            return id;
        } catch (cause) {
            throw new CryptoError(`Cannot calculate block id.`, { cause });
        }
    }

    public static getIdHex(id: string): string {
        if (id.length === 64) {
            return id;
        } else {
            return BigInt(id).toString(16).padStart(16, "0");
        }
    }

    public static getSignedHash(data: IBlockData): Buffer {
        try {
            const size = this.getSignedSectionSize(data);
            const writer = Serde.Factory.createWriter(Buffer.alloc(size));

            this.writeSignedSection(writer, data);

            return HashAlgorithms.sha256(writer.getResult());
        } catch (cause) {
            throw new CryptoError(`Cannot calculate block signed hash.`, { cause });
        }
    }

    public static serialize(data: IBlockData): Buffer {
        try {
            const size = this.getDataSize(data);
            const writer = Serde.Factory.createWriter(Buffer.alloc(size));

            this.writeSignedSection(writer, data);
            this.writeBlockSignature(writer, data);
            this.writeTransactions(writer, data);

            return Buffer.from(writer.getResult());
        } catch (cause) {
            throw new CryptoError(`Cannot serialize block.`, { cause });
        }
    }

    public static serializeHeader(data: IBlockData): Buffer {
        try {
            const size = this.getHeaderSize(data);
            const writer = Serde.Factory.createWriter(Buffer.alloc(size));

            this.writeSignedSection(writer, data);
            this.writeBlockSignature(writer, data);

            return Buffer.from(writer.getResult());
        } catch (cause) {
            throw new CryptoError(`Cannot serialize block header.`, { cause });
        }
    }

    public static writeSignedSection(writer: IWriter, data: IBlockData): void {
        writer.writeUInt32LE(data.version);
        writer.writeUInt32LE(data.timestamp);
        writer.writeUInt32LE(data.height);

        const previousConstants = configManager.getMilestone(data.height - 1 || 1);
        previousConstants.block.idFullSha256
            ? writer.writeBuffer(Buffer.from(data.previousBlock ?? "0".repeat(64), "hex"))
            : writer.writeBigUInt64BE(BigInt(data.previousBlock ?? 0));

        writer.writeUInt32LE(data.numberOfTransactions);
        writer.writeBigUInt64LE(BigInt(data.totalAmount.toString()));
        writer.writeBigUInt64LE(BigInt(data.totalFee.toString()));
        writer.writeBigUInt64LE(BigInt(data.reward.toString()));
        writer.writeUInt32LE(data.payloadLength);
        writer.writeBuffer(Buffer.from(data.payloadHash, "hex"));
        writer.writePublicKey(Buffer.from(data.generatorPublicKey, "hex"));
    }

    public static writeBlockSignature(writer: IWriter, data: IBlockData): void {
        if (!data.blockSignature) {
            throw new CryptoError("No block signature.");
        }

        writer.writeEcdsaSignature(Buffer.from(data.blockSignature, "hex"));
    }

    public static writeTransactions(writer: IWriter, data: IBlockData): void {
        if (!data.transactions) {
            throw new CryptoError("No transactions.");
        }

        const buffers = data.transactions.map((tx) => TransactionUtils.toBytes(tx));
        buffers.forEach((buffer) => writer.writeUInt32LE(buffer.length));
        buffers.forEach((buffer) => writer.writeBuffer(buffer));
    }
}
