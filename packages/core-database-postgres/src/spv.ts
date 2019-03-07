import { Bignum, Transaction } from "@arkecosystem/crypto";
import { orderBy } from "@arkecosystem/utils";

import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import { queries } from "./queries";
import { QueryExecutor } from "./sql/query-executor";

const logger = app.resolvePlugin<Logger.ILogger>("logger");
const config = app.getConfig();

const genesisWallets = config.get("genesisBlock.transactions").map(tx => tx.senderId);

export class SPV {
    constructor(private query: QueryExecutor, private walletManager: Database.IWalletManager) {}

    /**
     * Perform the SPV (Simple Payment Verification).
     * @param  {Number} height
     * @return {void}
     */
    public async build(height) {
        logger.info("SPV Step 1 of 8: Received Transactions");
        await this.__buildReceivedTransactions();

        logger.info("SPV Step 2 of 8: Block Rewards");
        await this.__buildBlockRewards();

        logger.info("SPV Step 3 of 8: Last Forged Blocks");
        await this.__buildLastForgedBlocks();

        logger.info("SPV Step 4 of 8: Sent Transactions");
        await this.__buildSentTransactions();

        logger.info("SPV Step 5 of 8: Second Signatures");
        await this.__buildSecondSignatures();

        logger.info("SPV Step 6 of 8: Votes");
        await this.__buildVotes();

        logger.info("SPV Step 7 of 8: Delegates");
        await this.__buildDelegates();

        logger.info("SPV Step 8 of 8: MultiSignatures");
        await this.__buildMultisignatures();

        logger.info(
            `SPV rebuild finished, wallets in memory: ${Object.keys(this.walletManager.allByAddress()).length}`,
        );
        logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.allByUsername()).length}`);

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
                : logger.warn(`Lost cold wallet: ${transaction.recipientId} ${transaction.amount}`);
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
                logger.warn(`Negative balance: ${wallet}`);
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
            const { data } = Transaction.fromBytes(transaction.serialized);
            wallet.secondPublicKey = data.asset.signature.publicKey;
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
                const { data } = Transaction.fromBytes(transaction.serialized);
                const vote = data.asset.votes[0];

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
            const { data } = Transaction.fromBytes(transaction.serialized);
            wallet.username = data.asset.delegate.username;
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
        const delegates = orderBy(this.walletManager.allByUsername(), ["voteBalance", "publicKey"], ["desc", "asc"]);
        delegates.forEach((delegate, i) => {
            const wallet = this.walletManager.findByPublicKey(delegate.publicKey);
            wallet.missedBlocks = +delegate.missedBlocks;
            // TODO: unknown property 'rate' being access on Wallet class
            (wallet as any).rate = i + 1;
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
                const { data } = Transaction.fromBytes(transaction.serialized);
                wallet.multisignature = data.asset.multisignature;
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
        let detectedInconsistency = false;

        for (const inMemoryWallet of this.walletManager.allByPublicKey()) {
            if (inMemoryWallet.balance.isLessThan(0) && !this.isGenesis(inMemoryWallet)) {
                detectedInconsistency = true;
                logger.warn(`Wallet '${inMemoryWallet.address}' has a negative balance of '${inMemoryWallet.balance}'`);
                break;
            }

            if (inMemoryWallet.voteBalance.isLessThan(0)) {
                detectedInconsistency = true;
                logger.warn(
                    `Wallet ${inMemoryWallet.address} has a negative vote balance of '${inMemoryWallet.voteBalance}'`,
                );
                break;
            }
        }

        // Remove dirty flags when no inconsistency has been found
        if (!detectedInconsistency) {
            this.walletManager.clear();
        }

        return !detectedInconsistency;
    }
}
