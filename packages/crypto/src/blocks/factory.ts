import { Hash } from "../crypto";
import { HashAlgorithms } from "../crypto/hash-algorithms";
import { CryptoError, VerificationAggregateError } from "../errors";
import {
    IBlock,
    IBlockData,
    IBlockHeader,
    IBlockHeaderData,
    IBlockSignedSection,
    IGenesisBlockJson,
    IKeyPair,
    INewBlockData,
} from "../interfaces";
import { configManager } from "../managers";
import { TransactionFactory } from "../transactions";
import { BigNumber } from "../utils";
import { Serializer } from "./serializer";
import { Verifier } from "./verifier";

export class BlockFactory {
    public static createHeader(data: IBlockHeaderData): IBlockHeader {
        try {
            const id = Serializer.getId(data);
            const header = { ...data, id };

            const errors = VerificationAggregateError.aggregate([
                () => Verifier.verifyVersion(header),
                () => Verifier.verifyPreviousBlock(header),
                () => Verifier.verifyNumberOfTransactions(header),
                () => Verifier.verifyReward(header),
                () => Verifier.verifyPayloadLength(header),
                () => Verifier.verifyPreviousBlockVotes(header),
                () => Verifier.verifyBlockSignature(header),
            ]);

            if (errors.length !== 0) {
                throw new VerificationAggregateError(errors);
            }

            return header;
        } catch (cause) {
            throw new CryptoError(`Cannot create header (height=${data.height}).`, { cause });
        }
    }

    public static createBlock(data: IBlockData): IBlock {
        try {
            const id = Serializer.getId(data);
            const transactions = data.transactions.map((t) => TransactionFactory.fromBytesUnsafe(t.serialized));
            const block = { ...data, id, transactions };

            const errors = VerificationAggregateError.aggregate([
                () => Verifier.verifyVersion(block),
                () => Verifier.verifyPreviousBlock(block),
                () => Verifier.verifyNumberOfTransactions(block),
                () => Verifier.verifyTotalAmount(block),
                () => Verifier.verifyTotalFee(block),
                () => Verifier.verifyReward(block),
                () => Verifier.verifyPayloadLength(block),
                () => Verifier.verifyPayloadHash(block),
                () => Verifier.verifyPreviousBlockVotes(block),
                () => Verifier.verifyBlockSignature(block),
                () => Verifier.verifyTransactions(block),
                () => Verifier.verifySize(block),
            ]);

            if (errors.length !== 0) {
                throw new VerificationAggregateError(errors);
            }

            return block;
        } catch (cause) {
            throw new CryptoError(`Cannot create block (height=${data.height}) from data.`, { cause });
        }
    }

    public static createGenesisBlock(json: IGenesisBlockJson): IBlock {
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
                return { ...common, version };
            }

            return { ...common, version, previousBlockVotes: [] };
        } catch (cause) {
            throw new CryptoError("Cannot create genesis block.", { cause });
        }
    }

    public static createNewBlock(keys: IKeyPair, data: INewBlockData): IBlock {
        try {
            const { version, timestamp, height, previousBlock, transactions } = data;
            const numberOfTransactions = transactions.length;
            const totalAmount = transactions.reduce((sum, tx) => sum.plus(tx.data.amount), BigNumber.ZERO);
            const totalFee = transactions.reduce((sum, tx) => sum.plus(tx.data.fee), BigNumber.ZERO);
            const reward = BigNumber.make(configManager.getMilestone(height).reward);
            const payloadLength = numberOfTransactions * 32;
            const payloadHashBuffers = transactions.map((tx) => Buffer.from(tx.id!, "hex"));
            const payloadHash = HashAlgorithms.sha256(payloadHashBuffers).toString("hex");
            const generatorPublicKey = keys.publicKey;

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
                transactions,
            };

            let signedSection: IBlockSignedSection;

            switch (version) {
                case 0:
                    signedSection = { ...common, version: 0 as const };
                    break;
                case 1:
                    signedSection = { ...common, previousBlockVotes: data.previousBlockVotes, version: 1 as const };
                    break;
            }

            const signedSectionHash = Serializer.getSignedSectionHash(signedSection);
            const blockSignature = Hash.signECDSA(signedSectionHash, keys);
            const id = Serializer.getId({ ...signedSection, blockSignature });
            const block = { ...signedSection, blockSignature, id, transactions };

            const errors = VerificationAggregateError.aggregate([
                () => Verifier.verifyVersion(block),
                () => Verifier.verifyPreviousBlock(block),
                () => Verifier.verifyNumberOfTransactions(block),
                () => Verifier.verifyPreviousBlockVotes(block),
                () => Verifier.verifyTransactions(block),
                () => Verifier.verifySize(block),
            ]);

            if (errors.length !== 0) {
                throw new VerificationAggregateError(errors);
            }

            return block;
        } catch (cause) {
            throw new CryptoError(`Cannot create new block (height=${data.height}).`, { cause });
        }
    }
}
