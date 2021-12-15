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

        const previousBlock = this.readId(reader, height - 1 || 1);

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

        switch (version) {
            case 0: {
                return { ...common, version };
            }

            case 1: {
                const previousBlockVotesCount = reader.readUInt8();
                const previousBlockVotes = reader.readSchnorrMultiSignature(previousBlockVotesCount);

                return { ...common, version, previousBlockVotes };
            }
        }
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

    public static readId(reader: IReader, height: number): string {
        const milestone = configManager.getMilestone(height);

        if (milestone.block.idFullSha256) {
            return reader.readBuffer(32).toString("hex");
        } else {
            return reader.readBigUInt64BE().toString();
        }
    }
}
