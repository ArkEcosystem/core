import { CryptoError } from "../errors";
import { IBlockData, IBlockSignedData, IReader } from "../interfaces";
import { configManager } from "../managers";
import { SerdeFactory } from "../serde";
import { BigNumber } from "../utils";

export class Deserializer {
    public static deserialize(serialized: Buffer): IBlockData {
        try {
            const reader = SerdeFactory.createReader(serialized);
            const signedData = this.readSignedData(reader);
            const blockSignature = reader.readEcdsaSignature().toString("hex");
            const transactions = this.readTransactions(reader, signedData.numberOfTransactions);

            if (reader.getRemainderLength() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return { ...signedData, blockSignature, transactions };
        } catch (cause) {
            throw new CryptoError(`Cannot deserialize block.`, { cause });
        }
    }

    public static readSignedData(reader: IReader): IBlockSignedData {
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

        const previousBlockVotesLength = reader.readUInt8();
        const previousBlockVotes = reader.readSchnorrMultiSignature(previousBlockVotesLength);

        return { version, ...common, previousBlockVotes };
    }

    public static readTransactions(reader: IReader, numberOfTransactions: number): Buffer[] {
        const lengths: number[] = [];
        const transactions: Buffer[] = [];

        for (let i = 0; i < numberOfTransactions; i++) {
            lengths.push(reader.readUInt32LE());
        }

        for (const length of lengths) {
            transactions.push(reader.readBuffer(length));
        }

        return transactions;
    }
}
