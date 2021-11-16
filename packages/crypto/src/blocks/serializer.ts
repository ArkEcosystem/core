import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IBlockData, IWriter } from "../interfaces";
import { configManager } from "../managers/config";
import { Factory as SerdeFactory } from "../serde";
import { Utils as TransactionUtils } from "../transactions";

export class Serializer {
    private static cachedIds = new WeakMap<IBlockData, string>();

    public static getId(data: IBlockData): string {
        try {
            let id = this.cachedIds.get(data);

            if (!id) {
                const constants = configManager.getMilestone(data.height);
                const buffer = Buffer.alloc(constants.block.maxPayload);
                const writer = SerdeFactory.createWriter(buffer);

                this.writeSignedSection(writer, data);
                if (data.height !== 1) {
                    this.writeBlockSignature(writer, data);
                }

                const hash = HashAlgorithms.sha256(writer.getResult());
                const computedId = constants.block.idFullSha256
                    ? hash.toString("hex")
                    : hash.readBigUInt64LE().toString(10);

                const outlookTable: Record<string, string> = configManager.get("exceptions").outlookTable ?? {};
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
            const constants = configManager.getMilestone(data.height);
            const buffer = Buffer.alloc(constants.block.maxPayload);
            const writer = SerdeFactory.createWriter(buffer);

            this.writeSignedSection(writer, data);

            return HashAlgorithms.sha256(writer.getResult());
        } catch (cause) {
            throw new CryptoError(`Cannot calculate block signed hash.`, { cause });
        }
    }

    public static serialize(data: IBlockData): Buffer {
        try {
            const constants = configManager.getMilestone(data.height);
            const buffer = Buffer.alloc(constants.block.maxPayload);
            const writer = SerdeFactory.createWriter(buffer);

            this.writeSignedSection(writer, data);
            this.writeBlockSignature(writer, data);
            this.writeTransactions(writer, data);

            return writer.getResult();
        } catch (cause) {
            throw new CryptoError(`Cannot serialize block.`, { cause });
        }
    }

    public static serializeHeader(data: IBlockData): Buffer {
        try {
            const constants = configManager.getMilestone(data.height);
            const buffer = Buffer.alloc(constants.block.maxPayload);
            const writer = SerdeFactory.createWriter(buffer);

            this.writeSignedSection(writer, data);
            this.writeBlockSignature(writer, data);

            return writer.getResult();
        } catch (cause) {
            throw new CryptoError(`Cannot serialize block header.`, { cause });
        }
    }

    public static writeSignedSection(writer: IWriter, data: IBlockData): void {
        if (data.height === 1) {
            writer.writeInt32LE(data.version);
            writer.writeInt32LE(data.timestamp);
            writer.writeInt32LE(data.height);

            // if (data.previousBlock !== "0") {
            //     throw new CryptoError(`Invalid genesis block.`);
            // }

            writer.jump(8);
            writer.writeInt32LE(data.numberOfTransactions);
            writer.writeBigInt64LE(BigInt(data.totalAmount.toString()));
            writer.writeBigInt64LE(BigInt(data.totalFee.toString()));
            writer.writeBigInt64LE(BigInt(data.reward.toString()));
            writer.writeInt32LE(data.payloadLength);
            writer.writeBuffer(Buffer.from(data.payloadHash, "hex"));
            writer.writePublicKey(Buffer.from(data.generatorPublicKey, "hex"));
        } else {
            const previousConstants = configManager.getMilestone(data.height - 1);

            writer.writeUInt32LE(data.version);
            writer.writeUInt32LE(data.timestamp);
            writer.writeUInt32LE(data.height);

            if (previousConstants.block.idFullSha256) {
                writer.writeBuffer(Buffer.from(data.previousBlock, "hex"));
            } else {
                writer.writeBigUInt64BE(BigInt(data.previousBlock));
            }

            writer.writeUInt32LE(data.numberOfTransactions);
            writer.writeBigUInt64LE(BigInt(data.totalAmount.toString()));
            writer.writeBigUInt64LE(BigInt(data.totalFee.toString()));
            writer.writeBigUInt64LE(BigInt(data.reward.toString()));
            writer.writeUInt32LE(data.payloadLength);
            writer.writeBuffer(Buffer.from(data.payloadHash, "hex"));
            writer.writePublicKey(Buffer.from(data.generatorPublicKey, "hex"));
        }
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
