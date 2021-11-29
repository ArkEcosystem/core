import { isEqual, uniq } from "@arkecosystem/utils";

import { Hash, HashAlgorithms } from "../crypto";
import { CryptoError, VerificationAggregateError, VerificationError } from "../errors";
import { IBlock, IBlockHeader } from "../interfaces";
import { configManager } from "../managers";
import { BigNumber } from "../utils";
import { Serializer } from "./serializer";

export class Verifier {
    public static verifyVersion(header: IBlockHeader): void {
        const milestone = configManager.getMilestone(header.height);

        if (header.version !== milestone.block.version) {
            throw new VerificationError(`Invalid version: ${header.version} (expected: ${milestone.version}).`);
        }
    }

    public static verifyPreviousBlock(header: IBlockHeader): void {
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

    public static verifyNumberOfTransactions(header: IBlockHeader): void {
        const milestone = configManager.getMilestone(header.height);

        if (header.numberOfTransactions > milestone.block.maxTransactions) {
            const msg = `Invalid number of transactions: ${header.numberOfTransactions} (max: ${milestone.block.maxTransactions}).`;
            throw new VerificationError(msg);
        }
    }

    public static verifyTotalAmount(block: IBlock): void {
        const totalAmount = block.transactions.reduce((sum, tx) => sum.plus(tx.data.amount), BigNumber.ZERO);

        if (block.totalAmount.isEqualTo(totalAmount) === false) {
            throw new VerificationError("Invalid total amount.");
        }
    }

    public static verifyTotalFee(block: IBlock): void {
        const totalFee = block.transactions.reduce((sum, tx) => sum.plus(tx.data.fee), BigNumber.ZERO);

        if (block.totalFee.isEqualTo(totalFee) === false) {
            throw new VerificationError("Invalid total fee.");
        }
    }

    public static verifyReward(header: IBlockHeader): void {
        const milestone = configManager.getMilestone(header.height);

        if (header.reward.isEqualTo(milestone.reward) === false) {
            throw new VerificationError(`Invalid reward: ${header.reward} (expected: ${milestone.reward}).`);
        }
    }

    public static verifyPayloadLength(header: IBlockHeader): void {
        if (header.payloadLength !== header.numberOfTransactions * 32) {
            throw new VerificationError(`Invalid payload length.`);
        }
    }

    public static verifyPayloadHash(block: IBlock): void {
        const ids = block.transactions.filter((tx) => tx.id).map((tx) => tx.id!);
        const buffers = ids.map((id) => Buffer.from(id, "hex"));
        const payloadHash = HashAlgorithms.sha256(buffers).toString("hex");

        if (block.payloadHash !== payloadHash) {
            const blocksTransactions = configManager.get("exceptions.blocksTransactions") ?? {};

            if (isEqual(ids, blocksTransactions[block.id]) === false) {
                throw new VerificationError("Invalid payload hash.");
            }
        }
    }

    public static verifyPreviousBlockVotes(header: IBlockHeader): void {
        if (header.version === 0) return;

        const voteIndexes = header.previousBlockVotes.map((v) => v.index);
        const uniqIndexes = uniq(voteIndexes);

        if (voteIndexes.length !== uniqIndexes.length) {
            throw new VerificationError("Duplicate votes.");
        }
    }

    public static verifyBlockSignature(header: IBlockHeader): void {
        const hash = Serializer.getSignedSectionHash(header);
        const signature = header.blockSignature;
        const key = header.generatorPublicKey;

        if (Hash.verifyECDSA(hash, signature, key) === false) {
            throw new VerificationError("Invalid signature.");
        }
    }

    public static verifyTransactions(block: IBlock): void {
        const errors = VerificationAggregateError.aggregate(
            block.transactions.map((_, sequence) => {
                return () => this.verifyTransaction(block, sequence);
            }),
        );

        if (block.transactions.length !== block.numberOfTransactions) {
            errors.push(new VerificationError("Invalid transactions count."));
        }

        if (errors.length !== 0) {
            throw new VerificationAggregateError(errors);
        }
    }

    public static verifyTransaction(block: IBlock, sequence: number): void {
        const errors = VerificationAggregateError.aggregate([
            () => this.verifyTransactionUniqueness(block, sequence),
            () => this.verifyTransactionVersion(block, sequence),
            () => this.verifyTransactionTimestamp(block, sequence),
            () => this.verifyTransactionExpiration(block, sequence),
        ]);

        if (errors.length !== 0) {
            const transaction = block.transactions[sequence];
            const msg = `Invalid transaction (sequence=${sequence}; id=${transaction.id}).`;
            throw new VerificationAggregateError(errors, msg);
        }
    }

    public static verifyTransactionUniqueness(block: IBlock, sequence: number): void {
        const transaction = block.transactions[sequence];
        const ids = block.transactions.map((t) => t.id);

        if (!transaction.id) {
            throw new Error(); // deliberate
        }

        if (ids.indexOf(transaction.id) !== sequence) {
            throw new VerificationError("Duplicate.");
        }
    }

    public static verifyTransactionVersion(block: IBlock, sequence: number): void {
        const transaction = block.transactions[sequence];
        const milestone = configManager.getMilestone(block.height - 1); // milestone is enabled after block apply

        if (milestone.aip11 && transaction.data.version === 1) {
            throw new VerificationError("Invalid version (aip11).");
        }
    }

    public static verifyTransactionTimestamp(block: IBlock, sequence: number): void {
        const transaction = block.transactions[sequence];
        const milestone = configManager.getMilestone(block.height);

        if (transaction.data.version !== 1) return;
        if (milestone.block.acceptExpiredTransactionTimestamps) return;

        if (transaction.data.timestamp > block.timestamp + 3600) {
            const msg = `Future timestamp: ${transaction.data.timestamp} (max: ${block.timestamp + 3600}).`;
            throw new VerificationError(msg);
        }

        if (transaction.data.timestamp < block.timestamp - 21600) {
            const msg = `Expired timestamp: ${transaction.data.timestamp} (min: ${block.timestamp - 21600}).`;
            throw new VerificationError(msg);
        }
    }

    public static verifyTransactionExpiration(block: IBlock, sequence: number): void {
        const transaction = block.transactions[sequence];
        const milestone = configManager.getMilestone(block.height);

        if (!transaction.data.expiration) return;
        if (milestone.ignoreExpiredTransactions) return;

        if (transaction.data.expiration <= block.height) {
            const msg = `Expired height: ${transaction.data.expiration} (min: ${block.height}).`;
            throw new VerificationError(msg);
        }
    }

    public static verifySize(block: IBlock): void {
        const milestone = configManager.getMilestone(block.height);
        const size = Serializer.getSize(block);

        if (size > milestone.block.maxPayload) {
            throw new VerificationError(`Invalid size: ${size} (max: ${milestone.block.maxPayload}).`);
        }
    }
}
