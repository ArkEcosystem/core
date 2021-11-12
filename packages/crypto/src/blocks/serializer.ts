import { HashAlgorithms } from "../crypto";
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
        } catch (error) {
            throw new Error(`Cannot calculate block id. ${error.message}`);
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
        } catch (error) {
            throw new Error(`Cannot calculate block signed hash. ${error.message}`);
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
        } catch (error) {
            throw new Error(`Cannot serialize block. ${error.message}`);
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
        } catch (error) {
            throw new Error(`Cannot serialize block header. ${error.message}`);
        }
    }

    public static writeSignedSection(writer: IWriter, data: IBlockData): void {
        if (data.height === 1) {
            writer.writeInt32LE(data.version);
            writer.writeInt32LE(data.timestamp);
            writer.writeInt32LE(data.height);
            writer.jump(8);
            writer.writeInt32LE(data.numberOfTransactions);
            writer.writeBigInt64LE(BigInt(data.totalAmount.toString()));
            writer.writeBigInt64LE(BigInt(data.totalFee.toString()));
            writer.writeBigInt64LE(BigInt(data.reward.toString()));
            writer.writeInt32LE(data.payloadLength);
            writer.writeBuffer(Buffer.from(data.payloadHash, "hex"));
            writer.writePublicKey(Buffer.from(data.generatorPublicKey, "hex"));
        } else {
            writer.writeUInt8(data.version);
            writer.writeUInt32LE(data.timestamp);
            writer.writeUInt32LE(data.height);
            writer.writeBuffer(Buffer.from(this.getIdHex(data.previousBlock), "hex"));
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
        if (data.height !== 1) {
            if (!data.blockSignature) {
                throw new Error("No block signature.");
            }

            writer.writeEcdsaSignature(Buffer.from(data.blockSignature, "hex"));
        }
    }

    public static writeTransactions(writer: IWriter, data: IBlockData): void {
        if (!data.transactions) {
            throw new Error("No transactions.");
        }

        const buffers = data.transactions.map((tx) => TransactionUtils.toBytes(tx));
        buffers.forEach((buffer) => writer.writeUInt32LE(buffer.length));
        buffers.forEach((buffer) => writer.writeBuffer(buffer));
    }
}
