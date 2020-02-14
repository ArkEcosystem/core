import { Container, Contracts, Enums as AppEnums, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { strictEqual } from "assert";
import differenceWith from "lodash.differencewith";

import { Cleaner } from "./cleaner";
import { TransactionsProcessed } from "./interfaces";
import { PurgeInvalidTransactions } from "./listeners";
import { Memory } from "./memory";
import { PoolWalletRepository } from "./pool-wallet-repository";

// todo: review implementation and reduce the complexity of all methods as it is quite high
/**
 * @export
 * @class Connection
 * @implements {Contracts.TransactionPool.Connection}
 */
@Container.injectable()
export class Connection implements Contracts.TransactionPool.Connection {
    /**
     * @private
     * @type {Providers.PluginConfiguration}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    /**
     * @private
     * @type {PoolWalletRepository}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "pool")
    private readonly poolWalletRepository!: PoolWalletRepository;

    /**
     * @private
     * @type {Handlers.Registry}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "blockchain")
    private readonly blockchainHandlerRegistry!: Handlers.Registry;

    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    /**
     * @private
     * @type {Contracts.Kernel.Logger}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    /**
     * @private
     * @type {Contracts.Kernel.EventDispatcher}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    /**
     * @private
     * @type {Memory}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.TransactionPoolMemory)
    private readonly memory!: Memory;

    /**
     * @private
     * @type {Contracts.TransactionPool.Storage}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.TransactionPoolStorage)
    private readonly storage!: Contracts.TransactionPool.Storage;

    /**
     * @private
     * @type {Cleaner}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.TransactionPoolCleaner)
    private readonly cleaner!: Cleaner;

    /**
     * @private
     * @type {Contracts.State.TransactionValidatorFactory}
     * @memberof Connection
     */
    @Container.inject(Container.Identifiers.TransactionValidatorFactory)
    private readonly createTransactionValidator!: Contracts.State.TransactionValidatorFactory;

    private readonly loggedAllowedSenders: string[] = [];

    /**
     * @returns {Promise<this>}
     * @memberof Connection
     */
    public async boot(): Promise<this> {
        this.memory.flush();

        if (process.env.CORE_RESET_DATABASE) {
            this.storage.clear();
        }

        const transactionsFromDisk: Interfaces.ITransaction[] = this.storage.all();
        for (const transaction of transactionsFromDisk) {
            // ! isn't applied on top of pool wallet repository
            this.memory.remember(transaction);
        }

        // Remove from the pool invalid entries found in `transactionsFromDisk`.
        await this.validateTransactions(transactionsFromDisk);
        await this.cleaner.purgeExpired();

        this.emitter.listen(AppEnums.CryptoEvent.MilestoneChanged, this.app.resolve(PurgeInvalidTransactions));

        return this;
    }

    /**
     * @param {number} type
     * @param {number} [typeGroup]
     * @returns {Promise<Set<Interfaces.ITransaction>>}
     * @memberof Connection
     */
    public async getTransactionsByType(type: number, typeGroup?: number): Promise<Set<Interfaces.ITransaction>> {
        if (typeGroup === undefined) {
            typeGroup = Enums.TransactionTypeGroup.Core;
        }

        await this.cleaner.purgeExpired();

        return this.memory.getByType(type, typeGroup);
    }

    /**
     * @returns {Promise<number>}
     * @memberof Connection
     */
    public async getPoolSize(): Promise<number> {
        await this.cleaner.purgeExpired();

        return this.memory.count();
    }

    /**
     * @param {string} senderPublicKey
     * @returns {Promise<number>}
     * @memberof Connection
     */
    public async getSenderSize(senderPublicKey: string): Promise<number> {
        await this.cleaner.purgeExpired();

        return this.memory.getBySender(senderPublicKey).size;
    }

    /**
     * @param {Interfaces.ITransaction[]} transactions
     * @returns {Promise<TransactionsProcessed>}
     * @memberof Connection
     */
    public async addTransactions(transactions: Interfaces.ITransaction[]): Promise<TransactionsProcessed> {
        const added: Interfaces.ITransaction[] = [];
        const notAdded: Contracts.TransactionPool.AddTransactionResponse[] = [];

        for (const transaction of transactions) {
            const result: Contracts.TransactionPool.AddTransactionResponse = await this.addTransaction(transaction);

            result.message ? notAdded.push(result) : added.push(transaction);
        }

        if (added.length > 0) {
            this.emitter.dispatch(AppEnums.TransactionEvent.AddedToPool, added);
        }

        if (notAdded.length > 0) {
            this.emitter.dispatch(AppEnums.TransactionEvent.RejectedByPool, notAdded);
        }

        return { added, notAdded };
    }

    /**
     * @param {Interfaces.ITransaction} transaction
     * @memberof Connection
     */
    public removeTransaction(transaction: Interfaces.ITransaction): void {
        AppUtils.assert.defined<string>(transaction.id);

        this.removeTransactionById(transaction.id, transaction.data.senderPublicKey);
    }

    /**
     * @param {string} id
     * @param {string} [senderPublicKey]
     * @memberof Connection
     */
    public removeTransactionById(id: string, senderPublicKey?: string): void {
        this.memory.forget(id, senderPublicKey);
        this.storage.delete(id);
        this.emitter.dispatch(AppEnums.TransactionEvent.RemovedFromPool, id);
    }

    /**
     * @param {string[]} ids
     * @memberof Connection
     */
    public removeTransactionsById(ids: string[]): void {
        for (const id of ids) {
            this.removeTransactionById(id);
        }
    }

    /**
     * @param {string} id
     * @returns {(Promise<Interfaces.ITransaction | undefined>)}
     * @memberof Connection
     */
    public async getTransaction(id: string): Promise<Interfaces.ITransaction | undefined> {
        await this.cleaner.purgeExpired();
        return this.memory.getById(id);
    }

    /**
     * @param {number} start
     * @param {number} size
     * @param {number} [maxBytes]
     * @returns {Promise<Buffer[]>}
     * @memberof Connection
     */
    public async getTransactions(start: number, size: number): Promise<Interfaces.ITransaction[]> {
        await this.cleaner.purgeExpired();
        return this.memory.allSortedByFee().slice(start, size);
    }

    /**
     * todo: move this to a more appropriate place @param {string} senderPublicKey
     *
     * @returns {Promise<boolean>}
     * @memberof Connection
     */
    public async hasExceededMaxTransactions(senderPublicKey: string): Promise<boolean> {
        await this.cleaner.purgeExpired();

        if (this.configuration.getOptional<string[]>("allowedSenders", []).includes(senderPublicKey)) {
            if (!this.loggedAllowedSenders.includes(senderPublicKey)) {
                this.logger.debug(
                    `Transaction pool: allowing sender public key ${senderPublicKey} ` +
                        `(listed in options.allowedSenders), thus skipping throttling.`,
                );

                this.loggedAllowedSenders.push(senderPublicKey);
            }

            return false;
        }

        return (
            this.memory.getBySender(senderPublicKey).size >=
            this.configuration.getRequired<number>("maxTransactionsPerSender")
        );
    }

    /**
     * @param {string} transactionId
     * @returns {Promise<boolean>}
     * @memberof Connection
     */
    public async has(transactionId: string): Promise<boolean> {
        if (!this.memory.has(transactionId)) {
            return false;
        }

        await this.cleaner.purgeExpired();

        return this.memory.has(transactionId);
    }

    /**
     * @param {Interfaces.IBlock} block
     * @returns {Promise<void>}
     * @memberof Connection
     */
    public async acceptChainedBlock(block: Interfaces.IBlock): Promise<void> {
        for (const transaction of block.transactions) {
            const { data }: Interfaces.ITransaction = transaction;

            AppUtils.assert.defined<string>(data.id);

            const exists: boolean = await this.has(data.id);

            AppUtils.assert.defined<string>(data.senderPublicKey);

            const senderPublicKey: string = data.senderPublicKey;

            const transactionHandler = await this.blockchainHandlerRegistry.getActivatedHandlerForData(
                transaction.data,
            );

            const senderWallet: Contracts.State.Wallet = this.poolWalletRepository.findByPublicKey(senderPublicKey);

            let recipientWallet: Contracts.State.Wallet | undefined;

            if (data.recipientId && this.poolWalletRepository.hasByAddress(data.recipientId)) {
                recipientWallet = this.poolWalletRepository.findByAddress(data.recipientId);
            }

            if (recipientWallet) {
                await transactionHandler.applyToRecipient(transaction, this.poolWalletRepository);
            }

            if (exists) {
                this.removeTransaction(transaction);
            } else if (senderWallet) {
                try {
                    await transactionHandler.throwIfCannotBeApplied(transaction, senderWallet);
                    await transactionHandler.applyToSender(transaction, this.poolWalletRepository);
                } catch (error) {
                    this.poolWalletRepository.forget(senderPublicKey);

                    if (recipientWallet) {
                        recipientWallet.publicKey
                            ? this.poolWalletRepository.forget(recipientWallet.publicKey)
                            : this.poolWalletRepository.forgetByAddress(recipientWallet.address);
                    }

                    this.logger.error(
                        `[Pool] Cannot apply transaction ${transaction.id} when trying to accept ` +
                            `block ${block.data.id}: ${error.message}`,
                    );

                    continue;
                }
            }

            if (senderWallet && this.canBePurged(senderWallet) && (await this.getSenderSize(senderPublicKey)) === 0) {
                this.poolWalletRepository.forget(senderPublicKey);
            }
        }

        // if delegate in poll wallet manager - apply rewards and fees
        if (this.poolWalletRepository.hasByPublicKey(block.data.generatorPublicKey)) {
            const delegateWallet: Contracts.State.Wallet = this.poolWalletRepository.findByPublicKey(
                block.data.generatorPublicKey,
            );

            delegateWallet.balance = delegateWallet.balance.plus(block.data.reward.plus(block.data.totalFee));
        }

        this.app.get<any>(Container.Identifiers.StateStore).clearCachedTransactionIds();
    }

    public async buildWallets(): Promise<void> {
        this.poolWalletRepository.reset();
        const validator = this.createTransactionValidator();
        for (const transaction of this.memory.allSortedByFee().slice()) {
            try {
                await validator.validate(transaction);
            } catch (error) {
                this.removeTransactionById(transaction.id!);
                this.logger.error(
                    `[Pool] Removed ${transaction.id} before forging because it is no longer valid: ${error.message}`,
                );
                continue;
            }

            if (!transaction.data.senderPublicKey) {
                continue;
            }

            try {
                const senderWallet = this.poolWalletRepository.findByPublicKey(transaction.data.senderPublicKey);
                const transactionHandler = await this.blockchainHandlerRegistry.getActivatedHandlerForData(
                    transaction.data,
                );
                await transactionHandler.throwIfCannotBeApplied(transaction, senderWallet);
                await transactionHandler.applyToSender(transaction, this.poolWalletRepository);
            } catch (error) {
                this.logger.error(`BuildWallets from pool: ${error.message}`);
                this.cleaner.purgeByPublicKey(transaction.data.senderPublicKey);
            }
        }
        this.logger.info("Transaction Pool Manager build wallets complete");
    }

    /**
     * @param {string} senderPublicKey
     * @param {number} type
     * @param {number} [typeGroup]
     * @returns {Promise<boolean>}
     * @memberof Connection
     */
    public async senderHasTransactionsOfType(
        senderPublicKey: string,
        type: number,
        typeGroup?: number,
    ): Promise<boolean> {
        await this.cleaner.purgeExpired();

        if (typeGroup === undefined) {
            typeGroup = Enums.TransactionTypeGroup.Core;
        }

        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            const transactionGroup: number =
                transaction.typeGroup === undefined ? Enums.TransactionTypeGroup.Core : transaction.typeGroup;

            if (transaction.type === type && transactionGroup === typeGroup) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param {Interfaces.ITransaction[]} transactions
     * @returns {Promise<void>}
     * @memberof Connection
     */
    public async replay(transactions: Interfaces.ITransaction[]): Promise<void> {
        this.cleaner.flush();

        this.poolWalletRepository.reset();

        for (const transaction of transactions) {
            try {
                const transactionHandler = await this.blockchainHandlerRegistry.getActivatedHandlerForData(
                    transaction.data,
                );
                await transactionHandler.applyToSender(transaction, this.poolWalletRepository);
                await transactionHandler.applyToRecipient(transaction, this.poolWalletRepository);
                this.memory.remember(transaction);
            } catch (error) {
                this.logger.error(`[Pool] Transaction (${transaction.id}): ${error.message}`);
            }
        }
    }

    /**
     * @private
     * @param {Interfaces.ITransaction} transaction
     * @returns {Promise<Contracts.TransactionPool.AddTransactionResponse>}
     * @memberof Connection
     */
    private async addTransaction(
        transaction: Interfaces.ITransaction,
    ): Promise<Contracts.TransactionPool.AddTransactionResponse> {
        AppUtils.assert.defined<string>(transaction.id);

        if (await this.has(transaction.id)) {
            this.logger.debug(
                "Transaction pool: ignoring attempt to add a transaction that is already " +
                    `in the pool, id: ${transaction.id}`,
            );

            return { transaction, type: "ERR_ALREADY_IN_POOL", message: "Already in pool" };
        }

        const poolSize: number = this.memory.count();

        if (this.configuration.getRequired<number>("maxTransactionsInPool") <= poolSize) {
            // The pool can't accommodate more transactions. Either decline the newcomer or remove
            // an existing transaction from the pool in order to free up space.
            const all: Interfaces.ITransaction[] = this.memory.allSortedByFee();
            const lowest: Interfaces.ITransaction | undefined = all[all.length - 1];

            AppUtils.assert.defined<string>(lowest.id);

            const fee: Utils.BigNumber = transaction.data.fee;
            const lowestFee: Utils.BigNumber = lowest.data.fee;

            if (lowestFee.isLessThan(fee)) {
                const transactionHandler = await this.blockchainHandlerRegistry.getActivatedHandlerForData(lowest.data);
                await transactionHandler.revertForSender(lowest, this.poolWalletRepository);
                this.memory.forget(lowest.id, lowest.data.senderPublicKey);
                this.storage.delete(lowest.id);
            } else {
                return {
                    transaction,
                    type: "ERR_POOL_FULL",
                    message:
                        `Pool is full (has ${poolSize} transactions) and this transaction's fee ` +
                        `${fee.toFixed()} is not higher than the lowest fee already in pool ` +
                        `${lowestFee.toFixed()}`,
                };
            }
        }

        this.memory.remember(transaction);
        this.storage.add(transaction);

        try {
            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
            const senderWallet = this.poolWalletRepository.findByPublicKey(transaction.data.senderPublicKey);
            const transactionHandler = await this.blockchainHandlerRegistry.getActivatedHandlerForData(
                transaction.data,
            );
            await transactionHandler.throwIfCannotBeApplied(transaction, senderWallet);
            await transactionHandler.applyToSender(transaction, this.poolWalletRepository);
        } catch (error) {
            this.logger.error(`[Pool] ${error.message}`);

            AppUtils.assert.defined<string>(transaction.id);

            this.memory.forget(transaction.id);
            this.storage.delete(transaction.id);

            return { transaction, type: "ERR_APPLY", message: error.message };
        }

        return {};
    }

    /**
     * Validate the given transactions and return only the valid ones - a subset of the input.
     * The invalid ones are removed from the pool. @private
     * @param {Interfaces.ITransaction[]} transactions
     * @param {Wallets.TempWalletRepository} [walletRepository]
     * @returns {Promise<Interfaces.ITransaction[]>}
     * @memberof Connection
     */
    private async validateTransactions(transactions: Interfaces.ITransaction[]): Promise<Interfaces.ITransaction[]> {
        const validTransactions: Interfaces.ITransaction[] = [];
        const forgedIds: string[] = await this.cleaner.removeForgedTransactions(transactions);

        const unforgedTransactions: Interfaces.ITransaction[] = differenceWith(
            transactions,
            forgedIds,
            (t, forgedId) => t.id === forgedId,
        );

        const walletRepository = this.app.getTagged<Contracts.State.WalletRepository>(
            Container.Identifiers.WalletRepository,
            "state",
            "clone",
        );

        for (const transaction of unforgedTransactions) {
            try {
                const deserialized: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytes(
                    transaction.serialized,
                );

                strictEqual(transaction.id, deserialized.id);

                const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
                    transaction.data.senderPublicKey!,
                );

                let recipient: Contracts.State.Wallet | undefined;

                if (transaction.data.recipientId) {
                    recipient = walletRepository.findByAddress(transaction.data.recipientId);
                }

                const transactionHandler = await this.blockchainHandlerRegistry.getActivatedHandlerForData(
                    transaction.data,
                );
                await transactionHandler.applyToSender(transaction, walletRepository);
                if (recipient && sender.address !== recipient.address) {
                    await transactionHandler.applyToRecipient(transaction, walletRepository);
                }

                validTransactions.push(transaction);
            } catch (error) {
                console.error(error.stack);
                this.removeTransactionById(transaction.id!);

                this.logger.error(
                    `[Pool] Removed ${transaction.id} before forging because it is no longer valid: ${error.message}`,
                );
            }
        }

        return validTransactions;
    }

    /**
     * @private
     * @param {Contracts.State.Wallet} wallet
     * @returns {boolean}
     * @memberof Connection
     */
    private canBePurged(wallet: Contracts.State.Wallet): boolean {
        const attributes: object = wallet.getAttributes();

        const hasAttributes: boolean = !!attributes && Object.keys(attributes).length > 0;

        if (wallet.hasAttribute("htlc.lockedBalance")) {
            const lockedBalance: AppUtils.BigNumber = wallet.getAttribute("htlc.lockedBalance");

            if (!lockedBalance.isZero()) {
                return false;
            }
        }

        return wallet.balance.isZero() && !hasAttributes;
    }
}
