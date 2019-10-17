import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, Logger, State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Utils } from "@arkecosystem/crypto";

export class StateBuilder {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    constructor(
        private readonly connection: Database.IConnection,
        private readonly walletManager: State.IWalletManager,
    ) {}

    public async run(): Promise<void> {
        const transactionHandlers: Handlers.TransactionHandler[] = Handlers.Registry.getAll();
        const steps = transactionHandlers.length + 3;

        this.logger.info(`State Generation - Step 1 of ${steps}: Block Rewards`);
        await this.buildBlockRewards();

        this.logger.info(`State Generation - Step 2 of ${steps}: Fees & Nonces`);
        await this.buildSentTransactions();

        const capitalize = (key: string) => key[0].toUpperCase() + key.slice(1);
        for (let i = 0; i < transactionHandlers.length; i++) {
            const transactionHandler = transactionHandlers[i];
            this.logger.info(
                `State Generation - Step ${3 + i} of ${steps}: ${capitalize(transactionHandler.getConstructor().key)}`,
            );

            await transactionHandler.bootstrap(this.connection, this.walletManager);
        }

        this.logger.info(`State Generation - Step ${steps} of ${steps}: Vote Balances & Delegate Ranking`);
        this.walletManager.buildVoteBalances();
        this.walletManager.buildDelegateRanking();

        this.logger.info(
            `State Generation complete! Wallets in memory: ${Object.keys(this.walletManager.allByAddress()).length}`,
        );
        this.logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.allByUsername()).length}`);

        this.verifyWalletsConsistency();

        this.emitter.emit(ApplicationEvents.StateBuilderFinished);
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

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.nonce = Utils.BigNumber.make(transaction.nonce);
            wallet.balance = wallet.balance.minus(transaction.amount).minus(transaction.fee);
        }
    }

    private verifyWalletsConsistency(): void {
        const genesisPublicKeys: Record<string, true> = app
            .getConfig()
            .get("genesisBlock.transactions")
            .reduce((acc, curr) => Object.assign(acc, { [curr.senderPublicKey]: true }), {});

        for (const wallet of this.walletManager.allByAddress()) {
            if (wallet.balance.isLessThan(0) && !genesisPublicKeys[wallet.publicKey]) {
                // Senders of whitelisted transactions that result in a negative balance,
                // also need to be special treated during bootstrap. Therefore, specific
                // senderPublicKey/nonce pairs are allowed to be negative.
                // Example:
                //          https://explorer.ark.io/transaction/608c7aeba0895da4517496590896eb325a0b5d367e1b186b1c07d7651a568b9e
                //          Results in a negative balance (-2 ARK) from height 93478 to 187315
                const negativeBalanceExceptions: Record<string, Record<string, string>> = app
                    .getConfig()
                    .get("exceptions.negativeBalances", {});
                const negativeBalances: Record<string, string> = negativeBalanceExceptions[wallet.publicKey] || {};
                if (!wallet.balance.isEqualTo(negativeBalances[wallet.nonce.toString()] || 0)) {
                    this.logger.warn(`Wallet '${wallet.address}' has a negative balance of '${wallet.balance}'`);
                    throw new Error("Non-genesis wallet with negative balance.");
                }
            }

            const voteBalance: Utils.BigNumber = wallet.getAttribute("delegate.voteBalance");
            if (voteBalance && voteBalance.isLessThan(0)) {
                this.logger.warn(`Wallet ${wallet.address} has a negative vote balance of '${voteBalance}'`);

                throw new Error("Wallet with negative vote balance.");
            }
        }
    }
}
