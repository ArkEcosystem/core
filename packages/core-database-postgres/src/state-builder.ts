import { app, Container, Contracts, Enums } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";

// todo: review the implementation
export class StateBuilder {
    private readonly logger: Contracts.Kernel.Log.Logger = app.log;
    private readonly emitter: Contracts.Kernel.Events.EventDispatcher = app.get<
        Contracts.Kernel.Events.EventDispatcher
    >(Container.Identifiers.EventDispatcherService);

    constructor(
        private readonly connection: Contracts.Database.Connection,
        private readonly walletRepository: Contracts.State.WalletRepository,
        private readonly walletState,
    ) {}

    public async run(): Promise<void> {
        const transactionHandlers: Handlers.TransactionHandler[] = await app
            .get<any>("transactionHandlerRegistry")
            .getActivatedTransactions();
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

            await transactionHandler.bootstrap(this.connection, this.walletRepository);
        }

        this.logger.info(`State Generation - Step ${steps} of ${steps}: Vote Balances & Delegate Ranking`);
        this.walletState.buildVoteBalances();
        this.walletState.buildDelegateRanking();

        this.logger.info(
            `State Generation complete! Wallets in memory: ${Object.keys(this.walletRepository.allByAddress()).length}`,
        );
        this.logger.info(
            `Number of registered delegates: ${Object.keys(this.walletRepository.allByUsername()).length}`,
        );

        this.verifyWalletsConsistency();

        this.emitter.dispatch(Enums.Events.Internal.StateBuilderFinished);
    }

    private async buildBlockRewards(): Promise<void> {
        const blocks = await this.connection.blocksRepository.getBlockRewards();

        for (const block of blocks) {
            const wallet = this.walletRepository.findByPublicKey(block.generatorPublicKey);
            wallet.balance = wallet.balance.plus(block.reward);
        }
    }

    private async buildSentTransactions(): Promise<void> {
        const transactions = await this.connection.transactionsRepository.getSentTransactions();

        for (const transaction of transactions) {
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            wallet.nonce = Utils.BigNumber.make(transaction.nonce);
            wallet.balance = wallet.balance.minus(transaction.amount).minus(transaction.fee);
        }
    }

    private isGenesis(wallet: Contracts.State.Wallet): boolean {
        return Managers.configManager
            .get("genesisBlock.transactions")
            .map((tx: Interfaces.ITransactionData) => tx.senderPublicKey)
            .includes(wallet.publicKey);
    }

    private verifyWalletsConsistency(): void {
        for (const wallet of this.walletRepository.allByAddress()) {
            if (wallet.balance.isLessThan(0) && !this.isGenesis(wallet)) {
                this.logger.warning(`Wallet '${wallet.address}' has a negative balance of '${wallet.balance}'`);

                throw new Error("Non-genesis wallet with negative balance.");
            }

            const voteBalance: Utils.BigNumber = wallet.getAttribute("delegate.voteBalance");
            if (voteBalance && voteBalance.isLessThan(0)) {
                this.logger.warning(`Wallet ${wallet.address} has a negative vote balance of '${voteBalance}'`);

                throw new Error("Wallet with negative vote balance.");
            }
        }
    }
}
