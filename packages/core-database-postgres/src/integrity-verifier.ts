import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { queries } from "./queries";
import { QueryExecutor } from "./sql/query-executor";

export class IntegrityVerifier {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    constructor(private readonly query: QueryExecutor, private readonly walletManager: Database.IWalletManager) {}

    public async run(): Promise<void> {
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
        await this.buildMultiSignatures();

        this.logger.info(
            `Integrity verified! Wallets in memory: ${Object.keys(this.walletManager.allByAddress()).length}`,
        );
        this.logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.allByUsername()).length}`);

        this.verifyWalletsConsistency();
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

    private isGenesis(wallet: Database.IWallet): boolean {
        return app
            .getConfig()
            .get("genesisBlock.transactions")
            .map((tx: Interfaces.ITransactionData) => tx.senderPublicKey)
            .includes(wallet.publicKey);
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

        this.walletManager.buildDelegateRanking(this.walletManager.allByUsername());
    }

    private async buildMultiSignatures(): Promise<void> {
        const transactions = await this.query.manyOrNone(queries.integrityVerifier.multiSignatures);

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            if (!wallet.multisignature) {
                if (transaction.version === 1) {
                    wallet.multisignature = transaction.asset.multisignature || transaction.asset.multiSignatureLegacy;
                } else if (transaction.version === 2) {
                    wallet.multisignature = transaction.asset.multiSignature;
                } else {
                    throw new Error(`Invalid multi signature version ${transaction.version}`);
                }
            }
        }
    }

    private verifyWalletsConsistency(): void {
        for (const wallet of this.walletManager.allByAddress()) {
            if (wallet.balance.isLessThan(0) && !this.isGenesis(wallet)) {
                this.logger.warn(`Wallet '${wallet.address}' has a negative balance of '${wallet.balance}'`);

                throw new Error("Non-genesis wallet with negative balance.");
            }

            if (wallet.voteBalance.isLessThan(0)) {
                this.logger.warn(`Wallet ${wallet.address} has a negative vote balance of '${wallet.voteBalance}'`);

                throw new Error("Wallet with negative vote balance.");
            }
        }
    }
}
