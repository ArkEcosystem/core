import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { sortBy } from "@arkecosystem/utils";
import { queries } from "./queries";
import { QueryExecutor } from "./sql/query-executor";

export class IntegrityVerifier {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    constructor(private readonly query: QueryExecutor, private readonly walletManager: Database.IWalletManager) {}

    public async run(): Promise<boolean> {
        this.logger.info("Integrity Verification - Step 1 of 8: Received Transactions");
        await this.buildReceivedTransactions();

        this.logger.info("Integrity Verification - Step 2 of 8: Block Rewards");
        await this.buildBlockRewards();

        this.logger.info("Integrity Verification - Step 3 of 8: Last Forged Blocks");
        await this.buildLastForgedBlocks();

        this.logger.info("Integrity Verification - Step 4 of 8: Sent Transactions");
        await this.buildSentTransactions();

        this.logger.info("Integrity Verification - Step 5 of 8: Second Signatures");
        await this.buildSecondSignatures();

        this.logger.info("Integrity Verification - Step 6 of 8: Votes");
        await this.buildVotes();

        this.logger.info("Integrity Verification - Step 7 of 8: Delegates");
        await this.buildDelegates();

        this.logger.info("Integrity Verification - Step 8 of 8: MultiSignatures");
        await this.buildMultisignatures();

        this.logger.info(
            `Integrity verified! Wallets in memory: ${Object.keys(this.walletManager.allByAddress()).length}`,
        );
        this.logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.allByUsername()).length}`);

        return this.verifyWalletsConsistency();
    }

    private async buildReceivedTransactions(): Promise<void> {
        const transactions = await this.query.many(queries.integrityVerifier.receivedTransactions);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByAddress(transaction.recipientId);

            wallet
                ? (wallet.balance = Utils.BigNumber.make(transaction.amount))
                : this.logger.warn(`Lost cold wallet: ${transaction.recipientId} ${transaction.amount}`);
        }
    }

    private async buildBlockRewards(): Promise<void> {
        const blocks = await this.query.many(queries.integrityVerifier.blockRewards);

        for (const block of blocks) {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.balance = wallet.balance.plus(block.reward);
        }
    }

    private async buildLastForgedBlocks(): Promise<void> {
        const blocks = await this.query.many(queries.integrityVerifier.lastForgedBlocks);

        for (const block of blocks) {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.lastBlock = block;
        }
    }

    private async buildSentTransactions(): Promise<void> {
        const transactions = await this.query.many(queries.integrityVerifier.sentTransactions);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.balance = wallet.balance.minus(transaction.amount).minus(transaction.fee);

            if (wallet.balance.isLessThan(0) && !this.isGenesis(wallet)) {
                this.logger.warn(`Negative balance: ${wallet}`);
            }
        }
    }

    private isGenesis(wallet): boolean {
        return app
            .getConfig()
            .get("genesisBlock.transactions")
            .map(tx => tx.senderId)
            .includes(wallet.address);
    }

    private async buildSecondSignatures() {
        const transactions = await this.query.manyOrNone(queries.integrityVerifier.secondSignatures);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.secondPublicKey = transaction.asset.signature.publicKey;
        }
    }

    private async buildVotes(): Promise<void> {
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

    private async buildDelegates(): Promise<void> {
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

        const delegateWallets: Database.IWallet[] = this.walletManager
            .allByUsername()
            .sort((a: Database.IWallet, b: Database.IWallet) => b.voteBalance.comparedTo(a.voteBalance));

        sortBy(delegateWallets, "publicKey").forEach((delegate, i) => {
            const wallet = this.walletManager.findByPublicKey(delegate.publicKey);
            wallet.rate = i + 1;
            this.walletManager.reindex(wallet);
        });
    }

    private async buildMultisignatures(): Promise<void> {
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
    private async verifyWalletsConsistency(): Promise<boolean> {
        let detectedInconsistency = false;

        for (const wallet of this.walletManager.allByAddress()) {
            if (wallet.balance.isLessThan(0) && !this.isGenesis(wallet)) {
                detectedInconsistency = true;
                this.logger.warn(`Wallet '${wallet.address}' has a negative balance of '${wallet.balance}'`);
                break;
            }

            if (wallet.voteBalance.isLessThan(0)) {
                detectedInconsistency = true;
                this.logger.warn(`Wallet ${wallet.address} has a negative vote balance of '${wallet.voteBalance}'`);
                break;
            }
        }

        return !detectedInconsistency;
    }
}
