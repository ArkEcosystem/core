import { app } from "@arkecosystem/core-container";
import { Database, Logger, State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Interfaces, Managers, Utils } from "@arkecosystem/crypto";

export class StateBuilder {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    constructor(
        private readonly connection: Database.IConnection,
        private readonly walletManager: State.IWalletManager,
    ) {}

    public async run(): Promise<void> {
        const transactionHandlers: Handlers.TransactionHandler[] = Handlers.Registry.all();
        let steps = transactionHandlers.length + 1;

        // FIXME: skip state generation of new tx types unless we are on testnet (until develop is on 2.6)
        const aip11 =
            Managers.configManager.getMilestone().aip11 && Managers.configManager.get("network.name") === "testnet";
        if (!aip11) {
            steps -= 4;
        }

        this.logger.info(`State Generation - Step 1 of ${steps}: Block Rewards`);
        await this.buildBlockRewards();

        this.logger.info(`State Generation - Step 2 of ${steps}: Fees & Nonces`);
        await this.buildSentTransactions();

        for (let i = 0; i < (aip11 ? transactionHandlers.length : 4); i++) {
            const transactionHandler = transactionHandlers[i];
            const transactionName = transactionHandler.constructor.name.replace("TransactionHandler", "");

            this.logger.info(`State Generation - Step ${3 + i} of ${steps}: ${transactionName}`);

            await transactionHandler.bootstrap(this.connection, this.walletManager);
        }

        this.logger.info(
            `State Generation complete! Wallets in memory: ${Object.keys(this.walletManager.allByAddress()).length}`,
        );
        this.logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.allByUsername()).length}`);

        this.verifyWalletsConsistency();
    }

    private async buildBlockRewards(): Promise<void> {
        const blocks = await this.connection.blocksRepository.getBlockRewards();

        for (const block of blocks) {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.balance = wallet.balance.plus(block.reward);
        }
    }

    private async buildSentTransactions(): Promise<void> {
        const transactions = await this.connection.transactionsRepository.getSentTransactions();
        const { HtlcLock, HtlcClaim, HtlcRefund } = Enums.TransactionTypes;

        for (const transaction of transactions) {
            if ([HtlcLock, HtlcClaim, HtlcRefund].includes(transaction.type)) {
                continue; // specific htlc behavior even for sent transactions (handled in htlc lock bootstrap function)
            }

            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.balance = wallet.balance.minus(transaction.amount).minus(transaction.fee);
            wallet.nonce = Utils.BigNumber.make(transaction.nonce);
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
