import { Bignum, models } from "@arkecosystem/crypto";
const { Transaction } = models;

import { app } from "@arkecosystem/core-kernel";
import { PostgresConnection } from "./connection";
import { queries } from "./queries";
import { QueryExecutor } from "./sql/query-executor";

const config = app.getConfig();

const genesisWallets = config.get("genesisBlock.transactions").map(tx => tx.senderId);

export class SPV {
    private models: any;
    private walletManager: any;
    private query: QueryExecutor;
    private activeDelegates: [];

    constructor(connectionInterface: PostgresConnection) {
        this.models = connectionInterface.models;
        this.walletManager = connectionInterface.walletManager;
        this.query = connectionInterface.query;
    }

    /**
     * Perform the SPV (Simple Payment Verification).
     * @param  {Number} height
     * @return {void}
     */
    public async build(height) {
        this.activeDelegates = config.getMilestone(height).activeDelegates;

        app.logger.printTracker("SPV", 1, 8, "Received Transactions");
        await this.__buildReceivedTransactions();

        app.logger.printTracker("SPV", 2, 8, "Block Rewards");
        await this.__buildBlockRewards();

        app.logger.printTracker("SPV", 3, 8, "Last Forged Blocks");
        await this.__buildLastForgedBlocks();

        app.logger.printTracker("SPV", 4, 8, "Sent Transactions");
        await this.__buildSentTransactions();

        app.logger.printTracker("SPV", 5, 8, "Second Signatures");
        await this.__buildSecondSignatures();

        app.logger.printTracker("SPV", 6, 8, "Votes");
        await this.__buildVotes();

        app.logger.printTracker("SPV", 7, 8, "Delegates");
        await this.__buildDelegates();

        app.logger.printTracker("SPV", 8, 8, "MultiSignatures");
        await this.__buildMultisignatures();

        app.logger.stopTracker("SPV", 8, 8);
        app.logger.info(`SPV rebuild finished, wallets in memory: ${Object.keys(this.walletManager.byAddress).length}`);
        app.logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.byUsername).length}`);

        return this.__verifyWalletsConsistency();
    }

    /**
     * Load and apply received transactions to wallets.
     * @return {void}
     */
    public async __buildReceivedTransactions() {
        const transactions = await this.query.many(queries.spv.receivedTransactions);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByAddress(transaction.recipientId);

            wallet
                ? (wallet.balance = new Bignum(transaction.amount))
                : app.logger.warn(`Lost cold wallet: ${transaction.recipientId} ${transaction.amount}`);
        }
    }

    /**
     * Load and apply block rewards to wallets.
     * @return {void}
     */
    public async __buildBlockRewards() {
        const blocks = await this.query.many(queries.spv.blockRewards);

        for (const block of blocks) {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.balance = wallet.balance.plus(block.reward);
        }
    }

    /**
     * Load and apply last forged blocks to wallets.
     * @return {void}
     */
    public async __buildLastForgedBlocks() {
        const blocks = await this.query.many(queries.spv.lastForgedBlocks);

        for (const block of blocks) {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.lastBlock = block;
        }
    }

    /**
     * Load and apply sent transactions to wallets.
     * @return {void}
     */
    public async __buildSentTransactions() {
        const transactions = await this.query.many(queries.spv.sentTransactions);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.balance = wallet.balance.minus(transaction.amount).minus(transaction.fee);

            if (wallet.balance.isLessThan(0) && !this.isGenesis(wallet)) {
                app.logger.warn(`Negative balance: ${wallet}`);
            }
        }
    }

    /**
     * Used to determine if a wallet is a Genesis wallet.
     * @return {Boolean}
     */
    public isGenesis(wallet) {
        return genesisWallets.includes(wallet.address);
    }

    /**
     * Load and apply second signature transactions to wallets.
     * @return {void}
     */
    public async __buildSecondSignatures() {
        const transactions = await this.query.manyOrNone(queries.spv.secondSignatures);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.secondPublicKey = Transaction.deserialize(
                transaction.serialized.toString("hex"),
            ).asset.signature.publicKey;
        }
    }

    /**
     * Load and apply votes to wallets.
     * @return {void}
     */
    public async __buildVotes() {
        const transactions = await this.query.manyOrNone(queries.spv.votes);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);

            if (!wallet.voted) {
                const vote = Transaction.deserialize(transaction.serialized.toString("hex")).asset.votes[0];

                if (vote.startsWith("+")) {
                    wallet.vote = vote.slice(1);
                }

                // NOTE: The "voted" property is only used within this loop to avoid an issue
                // that results in not properly applying "unvote" transactions as the "vote" property
                // would be empty in that case and return a false result.
                wallet.voted = true;
            }
        }

        this.walletManager.buildVoteBalances();
    }

    /**
     * Load and apply delegate usernames to wallets.
     * @return {void}
     */
    public async __buildDelegates() {
        // Register...
        const transactions = await this.query.manyOrNone(queries.spv.delegates);

        transactions.forEach(transaction => {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.username = Transaction.deserialize(transaction.serialized.toString("hex")).asset.delegate.username;
            this.walletManager.reindex(wallet);
        });

        // Forged Blocks...
        const forgedBlocks = await this.query.manyOrNone(queries.spv.delegatesForgedBlocks);
        forgedBlocks.forEach(block => {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.forgedFees = wallet.forgedFees.plus(block.totalFees);
            wallet.forgedRewards = wallet.forgedRewards.plus(block.totalRewards);
            wallet.producedBlocks = +block.totalProduced;
        });

        // NOTE: This is highly NOT reliable, however the number of missed blocks
        // is NOT used for the consensus
        const delegates = await this.query.manyOrNone(queries.spv.delegatesRanks);
        delegates.forEach((delegate, i) => {
            const wallet = this.walletManager.findByPublicKey(delegate.publicKey);
            wallet.missedBlocks = +delegate.missedBlocks;
            wallet.rate = i + 1;
            this.walletManager.reindex(wallet);
        });
    }

    /**
     * Load and apply multisignatures to wallets.
     * @return {void}
     */
    public async __buildMultisignatures() {
        const transactions = await this.query.manyOrNone(queries.spv.multiSignatures);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);

            if (!wallet.multisignature) {
                wallet.multisignature = Transaction.deserialize(
                    transaction.serialized.toString("hex"),
                ).asset.multisignature;
            }
        }
    }

    /**
     * Verify the consistency of the wallets table by comparing all records against
     * the in memory wallets.
     * NOTE: This is faster than rebuilding the entire table from scratch each time.
     * @returns {Boolean}
     */
    public async __verifyWalletsConsistency() {
        const dbWallets = await this.query.manyOrNone(queries.wallets.all);
        const inMemoryWallets = this.walletManager.allByPublicKey();

        let detectedInconsistency = false;
        if (dbWallets.length !== inMemoryWallets.length) {
            detectedInconsistency = true;
        } else {
            for (const dbWallet of dbWallets) {
                if (dbWallet.balance < 0 && !this.isGenesis(dbWallet)) {
                    detectedInconsistency = true;
                    app.logger.warn(`Wallet '${dbWallet.address}' has a negative balance of '${dbWallet.balance}'`);
                    break;
                }

                if (dbWallet.voteBalance < 0) {
                    detectedInconsistency = true;
                    app.logger.warn(
                        `Wallet ${dbWallet.address} has a negative vote balance of '${dbWallet.voteBalance}'`,
                    );
                    break;
                }

                const inMemoryWallet = this.walletManager.findByPublicKey(dbWallet.publicKey);

                if (
                    !inMemoryWallet.balance.isEqualTo(dbWallet.balance) ||
                    !inMemoryWallet.voteBalance.isEqualTo(dbWallet.voteBalance) ||
                    dbWallet.username !== inMemoryWallet.username
                ) {
                    detectedInconsistency = true;
                    break;
                }
            }
        }

        // Remove dirty flags when no inconsistency has been found
        if (!detectedInconsistency) {
            this.walletManager.clear();
        }

        return !detectedInconsistency;
    }
}
