import { Bignum } from "@arkecosystem/crypto";
import { sortBy } from "@arkecosystem/utils";

import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import { queries } from "./queries";
import { QueryExecutor } from "./sql/query-executor";

const logger = app.resolvePlugin<Logger.ILogger>("logger");
const config = app.getConfig();

const genesisWallets = config.get("genesisBlock.transactions").map(tx => tx.senderId);

export class IntegrityVerifier {
    constructor(private readonly query: QueryExecutor, private readonly walletManager: Database.IWalletManager) {}

    /**
     * Perform the State & Integrity Verification.
     * @return {Boolean}
     */
    public async run() {
        logger.info("Integrity Verification - Step 1 of 8: Received Transactions");
        await this.buildReceivedTransactions();

        logger.info("Integrity Verification - Step 2 of 8: Block Rewards");
        await this.buildBlockRewards();

        logger.info("Integrity Verification - Step 3 of 8: Last Forged Blocks");
        await this.buildLastForgedBlocks();

        logger.info("Integrity Verification - Step 4 of 8: Sent Transactions");
        await this.buildSentTransactions();

        logger.info("Integrity Verification - Step 5 of 8: Second Signatures");
        await this.buildSecondSignatures();

        logger.info("Integrity Verification - Step 6 of 8: Votes");
        await this.buildVotes();

        logger.info("Integrity Verification - Step 7 of 8: Delegates");
        await this.buildDelegates();

        logger.info("Integrity Verification - Step 8 of 8: MultiSignatures");
        await this.buildMultisignatures();

        logger.info(`Integrity verified! Wallets in memory: ${Object.keys(this.walletManager.allByAddress()).length}`);
        logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.allByUsername()).length}`);

        return this.verifyWalletsConsistency();
    }

    /**
     * Load and apply received transactions to wallets.
     * @return {void}
     */
    private async buildReceivedTransactions() {
        const transactions = await this.query.many(queries.integrityVerifier.receivedTransactions);

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
    private async buildBlockRewards() {
        const blocks = await this.query.many(queries.integrityVerifier.blockRewards);

        for (const block of blocks) {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.balance = wallet.balance.plus(block.reward);
        }
    }

    /**
     * Load and apply last forged blocks to wallets.
     * @return {void}
     */
    private async buildLastForgedBlocks() {
        const blocks = await this.query.many(queries.integrityVerifier.lastForgedBlocks);

        for (const block of blocks) {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.lastBlock = block;
        }
    }

    /**
     * Load and apply sent transactions to wallets.
     * @return {void}
     */
    private async buildSentTransactions() {
        const transactions = await this.query.many(queries.integrityVerifier.sentTransactions);

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
    private isGenesis(wallet) {
        return genesisWallets.includes(wallet.address);
    }

    /**
     * Load and apply second signature transactions to wallets.
     * @return {void}
     */
    private async buildSecondSignatures() {
        const transactions = await this.query.manyOrNone(queries.integrityVerifier.secondSignatures);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.secondPublicKey = transaction.asset.signature.publicKey;
        }
    }

    /**
     * Load and apply votes to wallets.
     * @return {void}
     */
    private async buildVotes() {
        const transactions = await this.query.manyOrNone(queries.integrityVerifier.votes);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);

            if (!wallet.voted) {
                const vote = transaction.asset.votes[0];

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
    private async buildDelegates() {
        // Register...
        const transactions = await this.query.manyOrNone(queries.integrityVerifier.delegates);

        transactions.forEach(transaction => {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.username = transaction.asset.delegate.username;
            this.walletManager.reindex(wallet);
        });

        // Forged Blocks...
        const forgedBlocks = await this.query.manyOrNone(queries.integrityVerifier.delegatesForgedBlocks);
        forgedBlocks.forEach(block => {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.forgedFees = wallet.forgedFees.plus(block.totalFees);
            wallet.forgedRewards = wallet.forgedRewards.plus(block.totalRewards);
            wallet.producedBlocks = +block.totalProduced;
        });

        const delegateWallets = this.walletManager
            .allByUsername()
            .sort((a: Database.IWallet, b: Database.IWallet) => b.voteBalance.comparedTo(a.voteBalance));

        sortBy(delegateWallets, "publicKey").forEach((delegate, i) => {
            const wallet = this.walletManager.findByPublicKey(delegate.publicKey);
            // @TODO: unknown property 'rate' being access on Wallet class
            (wallet as any).rate = i + 1;
            this.walletManager.reindex(wallet);
        });
    }

    /**
     * Load and apply multisignatures to wallets.
     * @return {void}
     */
    private async buildMultisignatures() {
        const transactions = await this.query.manyOrNone(queries.integrityVerifier.multiSignatures);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);

            if (!wallet.multisignature) {
                wallet.multisignature = transaction.asset.multisignature;
            }
        }
    }

    /**
     * Verify the consistency of the wallets table by comparing all records against
     * the in memory wallets.
     * NOTE: This is faster than rebuilding the entire table from scratch each time.
     * @returns {Boolean}
     */
    private async verifyWalletsConsistency() {
        let detectedInconsistency = false;

        for (const wallet of this.walletManager.allByAddress()) {
            if (wallet.balance.isLessThan(0) && !this.isGenesis(wallet)) {
                detectedInconsistency = true;
                logger.warn(`Wallet '${wallet.address}' has a negative balance of '${wallet.balance}'`);
                break;
            }

            if (wallet.voteBalance.isLessThan(0)) {
                detectedInconsistency = true;
                logger.warn(`Wallet ${wallet.address} has a negative vote balance of '${wallet.voteBalance}'`);
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
