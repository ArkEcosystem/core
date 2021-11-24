import ByteBuffer from "bytebuffer";

import { CryptoError } from "../errors";
import { IBlockData, IBlockSignedData } from "../interfaces";
import { configManager } from "../managers";
import { BigNumber } from "../utils";

export class Deserializer {
    public static deserialize(serialized: Buffer): IBlockData {
        try {
            const buffer = ByteBuffer.wrap(serialized).LE();
            const signedData = this.readSignedData(buffer);
            const blockSignature = this.readBlockSignature(buffer);
            const transactions = this.readTransactions(buffer, signedData.numberOfTransactions);

            if (buffer.remaining() !== 0) {
                throw new CryptoError("Buffer has space leftover.");
            }

            return { ...signedData, blockSignature, transactions };
        } catch (cause) {
            throw new CryptoError(`Cannot deserialize block.`, { cause });
        }
    }

    public static readSignedData(buffer: ByteBuffer): IBlockSignedData {
        const version = buffer.readUint32();

        if (version !== 0 && version !== 1) {
            throw new CryptoError("Unexpected block version.");
        }

        const timestamp = buffer.readUint32();
        const height = buffer.readUint32();

        const previousMilestone = configManager.getMilestone(height - 1 || 1);
        const previousBlock = previousMilestone.block.idFullSha256
            ? buffer.readBytes(32).toString("hex")
            : buffer.readBytes(8).BE().readUint64().toString();

        const numberOfTransactions = buffer.readUint32();
        const totalAmount = BigNumber.make(buffer.readUint64().toString());
        const totalFee = BigNumber.make(buffer.readUint64().toString());
        const reward = BigNumber.make(buffer.readUint64().toString());
        const payloadLength = buffer.readUint32();
        const payloadHash = buffer.readBytes(32).toString("hex");
        const generatorPublicKey = buffer.readBytes(33).toString("hex");

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

        const previousBlockVotes = this.readPreviousBlockVotes(buffer);

        return { version, ...common, previousBlockVotes };
    }

    public static readBlockSignature(buffer: ByteBuffer): string {
        if (buffer.readUint8(buffer.offset) !== 0x30) {
            throw new CryptoError("Not ECDSA signature.");
        }

        return buffer.readBytes(2 + buffer.readUint8(buffer.offset + 1)).toString("hex");
    }

    public static readPreviousBlockVotes(buffer: ByteBuffer): string[] {
        const length = buffer.readUint8();
        const previousBlockVotes: string[] = [];

        for (let i = 0; i < length; i++) {
            const previousBlockVote = buffer.readBytes(65).toString("hex");
            previousBlockVotes.push(previousBlockVote);
        }

        return previousBlockVotes;
    }

    public static readTransactions(buffer: ByteBuffer, numberOfTransactions: number): Buffer[] {
        const lengths: number[] = [];
        const transactions: Buffer[] = [];

        for (let i = 0; i < numberOfTransactions; i++) {
            lengths.push(buffer.readUint32());
        }

        for (const length of lengths) {
            transactions.push(buffer.readBytes(length).toBuffer());
        }

        return transactions;
    }
}
