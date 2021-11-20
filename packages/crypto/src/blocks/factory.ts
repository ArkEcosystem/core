import { CryptoError } from "../errors";
import { IBlock, IBlockData, IBlockHeader, IBlockHeaderData, IBlockJson, ITransaction } from "../interfaces";
import { configManager } from "../managers";
import { TransactionFactory } from "../transactions";
import { BigNumber } from "../utils";
import { Deserializer } from "./deserializer";
import { Serializer } from "./serializer";
import { Verifier } from "./verifier";

export class BlockFactory {
    public static createHeaderFromData(data: IBlockHeaderData): IBlockHeader {
        try {
            Verifier.verifyHeader(data);
            const id = Serializer.getId(data);

            return { ...data, id };
        } catch (cause) {
            throw new CryptoError(`Cannot create header (height=${data.height}).`, { cause });
        }
    }

    public static createBlockFromTransactions(header: IBlockHeader, transactions: readonly ITransaction[]): IBlock {
        try {
            Verifier.verifyBlock(header, transactions);

            return { ...header, transactions };
        } catch (cause) {
            throw new CryptoError(`Cannot create block (height=${header.height}).`, { cause });
        }
    }

    public static createBlockFromSerializedTransactions(header: IBlockHeader, serialized: readonly Buffer[]): IBlock {
        try {
            const transactions = serialized.map((s) => TransactionFactory.fromBytesUnsafe(s));
            Verifier.verifyBlock(header, transactions);

            return { ...header, transactions };
        } catch (cause) {
            const msg = `Cannot create block (height=${header.height}) from header and serialized transactions.`;
            throw new CryptoError(msg, { cause });
        }
    }

    public static createBlockFromData(data: IBlockData): IBlock {
        try {
            Verifier.verifyData(data);
            const id = Serializer.getId(data);
            const transactions = data.transactions.map((tx) => TransactionFactory.fromBytesUnsafe(tx));
            Verifier.verifyBlock({ ...data, id }, transactions);

            return { ...data, id, transactions };
        } catch (cause) {
            throw new CryptoError(`Cannot create block (height=${data.height}) from data.`, { cause });
        }
    }

    public static createBlockFromBuffer(buffer: Buffer): IBlock {
        try {
            const data = Deserializer.deserialize(buffer);
            Verifier.verifyData(data);
            const id = Serializer.getId(data);
            const transactions = data.transactions.map((tx) => TransactionFactory.fromBytesUnsafe(tx));
            Verifier.verifyBlock({ ...data, id }, transactions);

            return { ...data, id, transactions };
        } catch (cause) {
            throw new CryptoError("Cannot create block from buffer.", { cause });
        }
    }

    public static createGenesisBlockFromJson(json: IBlockJson): IBlock {
        try {
            if (json.version !== 0 && json.version !== 1) throw new CryptoError("Bad version.");
            if (json.height !== 1) throw new CryptoError("Bad height.");
            if (json.previousBlock !== null) throw new CryptoError("Bad previous block.");

            const milestone = configManager.getMilestone(1);
            const version = json.version;
            const transactions = json.transactions.map((txj) => TransactionFactory.fromGenesisJson(txj));

            const common = {
                id: json.id,
                timestamp: json.timestamp,
                height: json.height,
                previousBlock: milestone.idFullSha256 ? "0".repeat(64) : "0",
                numberOfTransactions: json.numberOfTransactions,
                totalAmount: BigNumber.make(json.totalAmount),
                totalFee: BigNumber.make(json.totalFee),
                reward: BigNumber.make(json.reward),
                payloadLength: json.payloadLength,
                payloadHash: json.payloadHash,
                generatorPublicKey: json.generatorPublicKey,
                blockSignature: json.blockSignature,
                transactions,
            };

            if (version === 0) {
                return { version, ...common };
            }

            return { version, ...common, previousBlockVotes: [] };
        } catch (cause) {
            throw new CryptoError("Cannot create genesis block.", { cause });
        }
    }
}
