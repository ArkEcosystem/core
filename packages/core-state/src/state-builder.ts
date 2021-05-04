import { Repositories } from "@arkecosystem/core-database";
import { Application, Container, Contracts, Enums, Services, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";

// todo: review the implementation
@Container.injectable()
export class StateBuilder {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    private blockRepository!: Repositories.BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionRepository)
    private transactionRepository!: Repositories.TransactionRepository;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.DposState)
    @Container.tagged("state", "blockchain")
    private dposState!: Contracts.State.DposState;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private events!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.LogService)
    private logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.ConfigRepository)
    private readonly configRepository!: Services.Config.ConfigRepository;

    public async run(): Promise<void> {
        this.events = this.app.get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService);

        const registeredHandlers = this.app
            .getTagged<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry, "state", "blockchain")
            .getRegisteredHandlers();
        const steps = registeredHandlers.length + 3;

        try {
            this.logger.info(`State Generation - Step 1 of ${steps}: Block Rewards`);
            await this.buildBlockRewards();

            this.logger.info(`State Generation - Step 2 of ${steps}: Fees & Nonces`);
            await this.buildSentTransactions();

            const capitalize = (key: string) => key[0].toUpperCase() + key.slice(1);
            for (let i = 0; i < registeredHandlers.length; i++) {
                const handler = registeredHandlers[i];
                const ctorKey: string | undefined = handler.getConstructor().key;
                const version = handler.getConstructor().version;
                AppUtils.assert.defined<string>(ctorKey);

                this.logger.info(`State Generation - Step ${3 + i} of ${steps}: ${capitalize(ctorKey)} v${version}`);
                await handler.bootstrap();
            }

            this.logger.info(`State Generation - Step ${steps} of ${steps}: Vote Balances & Delegate Ranking`);
            this.dposState.buildVoteBalances();
            this.dposState.buildDelegateRanking();

            this.logger.info(
                `Number of registered delegates: ${Object.keys(
                    this.walletRepository.allByUsername(),
                ).length.toLocaleString()}`,
            );

            this.verifyWalletsConsistency();

            this.events.dispatch(Enums.StateEvent.BuilderFinished);
        } catch (ex) {
            this.logger.error(ex.stack);
        }
    }

    private async buildBlockRewards(): Promise<void> {
        const blocks = await this.blockRepository.getBlockRewards();

        for (const block of blocks) {
            const wallet = this.walletRepository.findByPublicKey(block.generatorPublicKey);
            wallet.increaseBalance(Utils.BigNumber.make(block.rewards));
        }
    }

    private async buildSentTransactions(): Promise<void> {
        const transactions = await this.transactionRepository.getSentTransactions();

        for (const transaction of transactions) {
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            wallet.setNonce(Utils.BigNumber.make(transaction.nonce));
            wallet.decreaseBalance(Utils.BigNumber.make(transaction.amount).plus(transaction.fee));
        }
    }

    private verifyWalletsConsistency(): void {
        const logNegativeBalance = (wallet, type, balance) =>
            this.logger.warning(`Wallet ${wallet.address} has a negative ${type} of '${balance}'`);

        const genesisPublicKeys: Record<string, true> = Managers.configManager
            .get("genesisBlock.transactions")
            .reduce((acc, curr) => Object.assign(acc, { [curr.senderPublicKey]: true }), {});

        for (const wallet of this.walletRepository.allByAddress()) {
            if (
                wallet.getBalance().isLessThan(0) &&
                (wallet.getPublicKey() === undefined || !genesisPublicKeys[wallet.getPublicKey()!])
            ) {
                // Senders of whitelisted transactions that result in a negative balance,
                // also need to be special treated during bootstrap. Therefore, specific
                // senderPublicKey/nonce pairs are allowed to be negative.
                // Example:
                //          https://explorer.ark.io/transaction/608c7aeba0895da4517496590896eb325a0b5d367e1b186b1c07d7651a568b9e
                //          Results in a negative balance (-2 ARK) from height 93478 to 187315
                const negativeBalanceExceptions: Record<string, Record<string, string>> = this.configRepository.get(
                    "crypto.exceptions.negativeBalances",
                    {},
                );

                const whitelistedNegativeBalances: Record<string, string> | undefined = wallet.getPublicKey()
                    ? negativeBalanceExceptions[wallet.getPublicKey()!]
                    : undefined;

                if (!whitelistedNegativeBalances) {
                    logNegativeBalance(wallet, "balance", wallet.getBalance());
                    throw new Error("Non-genesis wallet with negative balance.");
                }

                const allowedNegativeBalance = wallet
                    .getBalance()
                    .isEqualTo(whitelistedNegativeBalances[wallet.getNonce().toString()]);

                if (!allowedNegativeBalance) {
                    logNegativeBalance(wallet, "balance", wallet.getBalance());
                    throw new Error("Non-genesis wallet with negative balance.");
                }
            }

            if (wallet.hasAttribute("delegate.voteBalance")) {
                const voteBalance: Utils.BigNumber = wallet.getAttribute("delegate.voteBalance");

                if (voteBalance.isLessThan(0)) {
                    logNegativeBalance(wallet, "vote balance", voteBalance);
                    throw new Error("Wallet with negative vote balance.");
                }
            }
        }
    }
}
