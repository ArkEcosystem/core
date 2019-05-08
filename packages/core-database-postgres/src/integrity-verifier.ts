import { app } from "@arkecosystem/core-container";
import { Logger, State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { queries } from "./queries";
import { QueryExecutor } from "./sql/query-executor";

export class IntegrityVerifier {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    constructor(private readonly query: QueryExecutor, private readonly walletManager: State.IWalletManager) {}

    public async run(): Promise<void> {
        this.logger.info("State Generation - Step 1 of 9: Received Transactions");
        await this.buildReceivedTransactions();

        this.logger.info("State Generation - Step 2 of 9: Block Rewards");
        await this.buildBlockRewards();

        this.logger.info("State Generation - Step 3 of 9: Last Forged Blocks");
        await this.buildLastForgedBlocks();

        this.logger.info("State Generation - Step 4 of 9: Sent Transactions");
        await this.buildSentTransactions();

        const transactionHandlers: Handlers.TransactionHandler[] = Handlers.Registry.all();
        for (const transactionHandler of transactionHandlers) {
            this.logger.info(
                `State Generation - Step ${4 + (transactionHandlers.indexOf(transactionHandler) + 1)} of ${4 +
                    transactionHandlers.length}: ${transactionHandler.getConstructor.name}`,
            );

            const { type } = transactionHandler.getConstructor();
            const transactions = await this.query.manyOrNone(queries.integrityVerifier.assetsByType, { type });

            transactionHandler.bootstrap(transactions, this.walletManager);
        }

        this.logger.info(
            `State Generation complete! Wallets in memory: ${Object.keys(this.walletManager.allByAddress()).length}`,
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

    private isGenesis(wallet: State.IWallet): boolean {
        return app
            .getConfig()
            .get("genesisBlock.transactions")
            .map((tx: Interfaces.ITransactionData) => tx.senderPublicKey)
            .includes(wallet.publicKey);
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
