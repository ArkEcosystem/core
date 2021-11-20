import { uniq } from "@arkecosystem/utils";
import { isEqual } from "lodash";

import { Hash, HashAlgorithms } from "../crypto";
import { CryptoError, VerificationAggregateError, VerificationError } from "../errors";
import { IBlockData, IBlockHeader, IBlockHeaderData, ITransaction } from "../interfaces";
import { configManager } from "../managers";
import { BigNumber } from "../utils";
import { Serializer } from "./serializer";

type BlocksTransactions = {
    [id: string]: string[] | undefined;
};

export class Verifier {
    public static verifyHeader(header: IBlockHeaderData): void {
        const errors = VerificationAggregateError.aggregate([
            () => this.verifyVersion(header),
            () => this.verifyPreviousBlock(header),
            () => this.verifyNumberOfTransactions(header),
            () => this.verifyReward(header),
            () => this.verifyPayloadLength(header),
            () => this.verifyPreviousBlockVotes(header),
        ]);

        if (errors.length !== 0) {
            throw new VerificationAggregateError(errors);
        }
    }

    public static verifyData(data: IBlockData): void {
        const errors = VerificationAggregateError.aggregate([
            () => this.verifyVersion(data),
            () => this.verifyPreviousBlock(data),
            () => this.verifyNumberOfTransactions(data),
            () => this.verifyReward(data),
            () => this.verifyPayloadLength(data),
            () => this.verifyPreviousBlockVotes(data),
            () => this.verifyTransactionsLength(data),
            () => this.verifySize(data),
        ]);

        if (errors.length !== 0) {
            throw new VerificationAggregateError(errors);
        }
    }

    public static verifyBlock(header: IBlockHeader, transactions: readonly ITransaction[]): void {
        const data = { ...header, transactions: transactions.map((t) => t.serialized) };

        const errors = VerificationAggregateError.aggregate([
            () => this.verifyTransactionsLength(data),
            () => this.verifySize(data),
            () => this.verifyTotalAmount(header, transactions),
            () => this.verifyTotalFee(header, transactions),
            () => this.verifyPayloadHash(header, transactions),
            ...transactions.map((_, sequence) => () => this.verifyTransactionsItem(header, transactions, sequence)),
        ]);

        if (errors.length !== 0) {
            throw new VerificationAggregateError(errors);
        }
    }

    public static verifyTransactionsItem(
        header: IBlockHeaderData,
        transactions: readonly ITransaction[],
        sequence: number,
    ): void {
        const errors = VerificationAggregateError.aggregate([
            () => this.verifyTransactionsItemUniqueness(transactions, sequence),
            () => this.verifyTransactionsItemVersion(header, transactions, sequence),
            () => this.verifyTransactionsItemTimestamp(header, transactions, sequence),
            () => this.verifyTransactionsItemExpiration(header, transactions, sequence),
        ]);

        if (errors.length !== 0) {
            const transaction = transactions[sequence];
            const msg = `Invalid transaction (sequence=${sequence}; id=${transaction.id}).`;
            throw new VerificationAggregateError(errors, msg);
        }
    }

    public static verifyVersion(header: IBlockHeaderData): void {
        const milestone = configManager.getMilestone(header.height);

        if (header.version !== milestone.block.version) {
            throw new VerificationError(`Invalid version: ${header.version} (expected: ${milestone.version}).`);
        }
    }

    public static verifyPreviousBlock(header: IBlockHeaderData): void {
        const previousMilestone = configManager.getMilestone(header.height - 1);

        try {
            if (previousMilestone.block.idFullSha256) {
                if (Buffer.from(header.previousBlock, "hex").length !== 32) {
                    throw new CryptoError("Invalid length.");
                }
            } else {
                BigInt.asUintN(64, BigInt(header.previousBlock));
            }
        } catch (cause) {
            throw new VerificationError("Invalid previous block.", { cause });
        }
    }

    public static verifyNumberOfTransactions(header: IBlockHeaderData): void {
        const milestone = configManager.getMilestone(header.height);

        if (header.numberOfTransactions > milestone.block.maxTransactions) {
            const msg = `Invalid number of transactions: ${header.numberOfTransactions} (max: ${milestone.block.maxTransactions}).`;
            throw new VerificationError(msg);
        }
    }

    public static verifyTotalAmount(header: IBlockHeaderData, transactions: readonly ITransaction[]): void {
        const totalAmount = transactions.reduce((sum, tx) => sum.plus(tx.data.amount), BigNumber.ZERO);

        if (header.totalAmount.isEqualTo(totalAmount) === false) {
            throw new VerificationError("Invalid total amount.");
        }
    }

    public static verifyTotalFee(header: IBlockHeaderData, transactions: readonly ITransaction[]): void {
        const totalFee = transactions.reduce((sum, tx) => sum.plus(tx.data.fee), BigNumber.ZERO);

        if (header.totalFee.isEqualTo(totalFee) === false) {
            throw new VerificationError("Invalid total fee.");
        }
    }

    public static verifyReward(header: IBlockHeaderData): void {
        const milestone = configManager.getMilestone(header.height);

        if (header.reward.isEqualTo(milestone.reward) === false) {
            throw new VerificationError(`Invalid reward: ${header.reward} (expected: ${milestone.reward}).`);
        }
    }

    public static verifyPayloadLength(header: IBlockHeaderData): void {
        if (header.payloadLength !== header.numberOfTransactions * 32) {
            throw new VerificationError(`Invalid payload length.`);
        }
    }

    public static verifyPayloadHash(header: IBlockHeader, transactions: readonly ITransaction[]): void {
        const ids = transactions.filter((tx) => tx.id).map((tx) => tx.id!);
        const buffers = ids.map((id) => Buffer.from(id, "hex"));
        const payloadHash = HashAlgorithms.sha256(buffers).toString("hex");

        if (header.payloadHash !== payloadHash) {
            const blocksTransactions = configManager.get<BlocksTransactions>("exceptions.blocksTransactions") ?? {};

            if (isEqual(ids, blocksTransactions[header.id]) === false) {
                throw new VerificationError("Invalid payload hash.");
            }
        }
    }

    public static verifyPreviousBlockVotes(header: IBlockHeaderData): void {
        if (header.version === 0) return;

        const voteIndexes = header.previousBlockVotes.map((v) => v.index);
        const uniqIndexes = uniq(voteIndexes);

        if (voteIndexes.length !== uniqIndexes.length) {
            throw new VerificationError("Duplicate votes.");
        }
    }

    public static verifyBlockSignature(header: IBlockHeaderData): void {
        if (!Hash.verifyECDSA(Serializer.getSignedHash(header), header.blockSignature, header.generatorPublicKey)) {
            throw new VerificationError("Invalid signature.");
        }
    }

    public static verifyTransactionsLength(data: IBlockData): void {
        if (data.transactions.length !== data.numberOfTransactions) {
            throw new VerificationError("Invalid transactions count.");
        }
    }

    public static verifySize(data: IBlockData): void {
        const milestone = configManager.getMilestone(data.height);
        const size = Serializer.getSize(data);

        if (size > milestone.block.maxPayload) {
            throw new VerificationError(`Invalid size: ${size} (max: ${milestone.block.maxPayload}).`);
        }
    }

    public static verifyTransactionsItemUniqueness(transactions: readonly ITransaction[], sequence: number): void {
        const transaction = transactions[sequence];
        const ids = transactions.map((t) => t.id);

        if (!transaction.id) {
            throw new Error("No id."); // deliberate
        }

        if (ids.indexOf(transaction.id) !== sequence) {
            throw new VerificationError("Duplicate.");
        }
    }

    public static verifyTransactionsItemVersion(
        header: IBlockHeaderData,
        transactions: readonly ITransaction[],
        sequence: number,
    ): void {
        const transaction = transactions[sequence];
        const milestone = configManager.getMilestone(header.height); // header.height - 1?

        if (milestone.aip11 && transaction.data.version === 1) {
            throw new VerificationError("Invalid aip11 version.");
        }
    }

    public static verifyTransactionsItemTimestamp(
        header: IBlockHeaderData,
        transactions: readonly ITransaction[],
        sequence: number,
    ): void {
        const transaction = transactions[sequence];
        const milestone = configManager.getMilestone(header.height);

        if (transaction.data.version !== 1) return;
        if (milestone.block.acceptExpiredTransactionTimestamps) return;

        if (transaction.data.timestamp > header.timestamp + 3600) {
            const msg = `Future timestamp: ${transaction.data.timestamp} (max: ${header.timestamp + 3600}).`;
            throw new VerificationError(msg);
        }

        if (transaction.data.timestamp < header.timestamp - 21600) {
            const msg = `Expired timestamp: ${transaction.data.timestamp} (min: ${header.timestamp - 21600}).`;
            throw new VerificationError(msg);
        }
    }

    public static verifyTransactionsItemExpiration(
        header: IBlockHeaderData,
        transactions: readonly ITransaction[],
        sequence: number,
    ): void {
        const transaction = transactions[sequence];
        const milestone = configManager.getMilestone(header.height);

        if (!transaction.data.expiration) return;
        if (milestone.ignoreExpiredTransactions) return;

        if (transaction.data.expiration <= header.height) {
            const msg = `Expired height: ${transaction.data.expiration} (min: ${header.height}).`;
            throw new VerificationError(msg);
        }
    }
}
