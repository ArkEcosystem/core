import { CryptoError } from "../errors";
import { IBlockData, IBlockPayloadSection, IBlockSignatureSection, IBlockSignedSection, IReader } from "../interfaces";
import { configManager } from "../managers";
import { SerdeFactory } from "../serde";
import { BigNumber } from "../utils";

export class Deserializer {
    public static deserialize(buffer: Buffer): IBlockData {
        try {
            const reader = SerdeFactory.createReader(buffer);
            const signedSection = this.readSignedSection(reader);
            const signatureSection = this.readSignatureSection(reader);
            const payloadSection = this.readPayloadSection(reader, signedSection.numberOfTransactions);

            if (reader.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return { ...signedSection, ...signatureSection, ...payloadSection };
        } catch (cause) {
            throw new CryptoError(`Cannot deserialize block.`, { cause });
        }
    }

    public static readSignedSection(reader: IReader): IBlockSignedSection {
        const version = reader.readUInt32LE();

        if (version !== 0 && version !== 1) {
            throw new CryptoError("Unexpected block version.");
        }

        const timestamp = reader.readUInt32LE();
        const height = reader.readUInt32LE();

        const previousMilestone = configManager.getMilestone(height - 1 || 1);
        const previousBlock = previousMilestone.block.idFullSha256
            ? reader.readBuffer(32).toString("hex")
            : reader.readBigUInt64BE().toString();

        const numberOfTransactions = reader.readUInt32LE();
        const totalAmount = BigNumber.make(reader.readBigUInt64LE());
        const totalFee = BigNumber.make(reader.readBigUInt64LE());
        const reward = BigNumber.make(reader.readBigUInt64LE());
        const payloadLength = reader.readUInt32LE();
        const payloadHash = reader.readBuffer(32).toString("hex");
        const generatorPublicKey = reader.readPublicKey().toString("hex");

        const common = {
            timestamp,
            height,
            previousBlock,
            numberOfTransactions,
            totalAmount,
            totalFee,
            reward,
            payloadLength,
            payloadHash,
            generatorPublicKey,
        };

        if (version === 0) {
            return { version, ...common };
        }

        const previousBlockVotesCount = reader.readUInt8();
        const previousBlockVotes = reader.readSchnorrMultiSignature(previousBlockVotesCount);

        return { version, ...common, previousBlockVotes };
    }

    public static readSignatureSection(reader: IReader): IBlockSignatureSection {
        return { blockSignature: reader.readEcdsaSignature().toString("hex") };
    }

    public static readPayloadSection(reader: IReader, numberOfTransactions: number): IBlockPayloadSection {
        const lengths: number[] = [];
        const buffers: Buffer[] = [];

        for (let i = 0; i < numberOfTransactions; i++) {
            lengths.push(reader.readUInt32LE());
        }

        for (const length of lengths) {
            buffers.push(reader.readBuffer(length));
        }

        return { transactions: buffers.map((b) => ({ serialized: b })) };
    }
}
