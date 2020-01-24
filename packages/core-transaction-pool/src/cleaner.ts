import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Enums as AppEnums, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Memory } from "./memory";
import { PoolWalletRepository } from "./pool-wallet-repository";
import { Storage } from "./storage";
import { Synchronizer } from "./synchronizer";
import { Handlers } from "@arkecosystem/core-transactions";

/**
 * @export
 * @class Cleaner
 */
@Container.injectable()
export class Cleaner {
    /**
     * @private
     * @type {Contracts.Kernel.Logger}
     * @memberof Cleaner
     */
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    /**
     * @private
     * @type {Contracts.Kernel.EventDispatcher}
     * @memberof Cleaner
     */
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    /**
     * @private
     * @type {Repositories.TransactionRepository}
     * @memberof Cleaner
     */
    @Container.inject(Container.Identifiers.TransactionRepository)
    private readonly transactionRepository!: Repositories.TransactionRepository;

    /**
     * @private
     * @type {Memory}
     * @memberof Cleaner
     */
    @Container.inject(Container.Identifiers.TransactionPoolMemory)
    private readonly memory!: Memory;

    /**
     * @private
     * @type {Storage}
     * @memberof Cleaner
     */
    @Container.inject(Container.Identifiers.TransactionPoolStorage)
    private readonly storage!: Storage;

    /**
     * @private
     * @type {Synchronizer}
     * @memberof Cleaner
     */
    @Container.inject(Container.Identifiers.TransactionPoolSynchronizer)
    private readonly synchronizer!: Synchronizer;

    /**
     * @private
     * @type {PoolWalletRepository}
     * @memberof Cleaner
     */
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "pool")
    private readonly poolWalletRepository!: PoolWalletRepository;

    /**
     * @private
     * @type {Handlers.Registry}
     * @memberof Cleaner
     */
    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "blockchain")
    private readonly blockchainHandlerRegistry!: Handlers.Registry;

    /**
     * @memberof Cleaner
     */
    public flush(): void {
        this.memory.flush();

        this.storage.deleteAll();
    }

    /**
     * @param {Interfaces.ITransaction} transaction
     * @memberof Cleaner
     */
    public removeTransaction(transaction: Interfaces.ITransaction): void {
        AppUtils.assert.defined<string>(transaction.id);

        this.removeTransactionById(transaction.id, transaction.data.senderPublicKey);
    }

    /**
     * @param {string} id
     * @param {string} [senderPublicKey]
     * @memberof Cleaner
     */
    public removeTransactionById(id: string, senderPublicKey?: string): void {
        this.memory.forget(id, senderPublicKey);

        this.synchronizer.syncToPersistentStorageIfNecessary();

        this.emitter.dispatch(AppEnums.TransactionEvent.RemovedFromPool, id);
    }

    /**
     * @param {string[]} ids
     * @memberof Cleaner
     */
    public removeTransactionsById(ids: string[]): void {
        for (const id of ids) {
            this.removeTransactionById(id);
        }
    }

    /**
     * @param {string} senderPublicKey
     * @memberof Cleaner
     */
    public removeTransactionsForSender(senderPublicKey: string): void {
        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            AppUtils.assert.defined<string>(transaction.id);

            this.removeTransactionById(transaction.id);
        }
    }

    /**
     * @param {Interfaces.ITransaction[]} transactions
     * @returns {Promise<string[]>}
     * @memberof Cleaner
     */
    public async removeForgedTransactions(transactions: Interfaces.ITransaction[]): Promise<string[]> {
        const forgedIds: string[] = await this.transactionRepository.getForgedTransactionsIds(
            transactions.map(({ id }) => {
                AppUtils.assert.defined<string>(id);

                return id;
            }),
        );

        this.removeTransactionsById(forgedIds);
        return forgedIds;
    }

    /**
     * @param {string} senderPublicKey
     * @memberof Cleaner
     */
    public purgeByPublicKey(senderPublicKey: string): void {
        this.logger.debug(`Purging sender: ${senderPublicKey} from pool wallet manager`);

        this.removeTransactionsForSender(senderPublicKey);

        this.poolWalletRepository.forget(senderPublicKey);
    }

    /**
     * @returns {Promise<void>}
     * @memberof Cleaner
     */
    public async purgeInvalidTransactions(): Promise<void> {
        return this.purgeTransactions(AppEnums.TransactionEvent.RemovedFromPool, this.memory.getInvalid());
    }

    /**
     * @returns {Promise<void>}
     * @memberof Cleaner
     */
    public async purgeExpired(): Promise<void> {
        return this.purgeTransactions(AppEnums.TransactionEvent.Expired, this.memory.getExpired());
    }

    /**
     * Remove all provided transactions plus any transactions from the same senders with higher nonces. @private
     * @param {string} event
     * @param {Interfaces.ITransaction[]} transactions
     * @returns {Promise<void>}
     * @memberof Cleaner
     */
    private async purgeTransactions(event: string, transactions: Interfaces.ITransaction[]): Promise<void> {
        const purge = async (transaction: Interfaces.ITransaction) => {
            this.emitter.dispatch(event, transaction.data);

            const handler = await this.blockchainHandlerRegistry.getActivatedHandlerForData(transaction.data);
            await handler.revertForSender(transaction, this.poolWalletRepository);

            AppUtils.assert.defined<Interfaces.ITransaction>(transaction.id);

            this.memory.forget(transaction.id, transaction.data.senderPublicKey);

            this.synchronizer.syncToPersistentStorageIfNecessary();
        };

        const lowestNonceBySender = {};
        for (const transaction of transactions) {
            if (transaction.data.version === 1) {
                await purge(transaction);
                continue;
            }

            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

            const senderPublicKey: string = transaction.data.senderPublicKey;

            if (lowestNonceBySender[senderPublicKey] === undefined) {
                lowestNonceBySender[senderPublicKey] = transaction.data.nonce;
            } else if (lowestNonceBySender[senderPublicKey].isGreaterThan(transaction.data.nonce)) {
                lowestNonceBySender[senderPublicKey] = transaction.data.nonce;
            }
        }

        // Revert all transactions that have bigger or equal nonces than the ones in
        // lowestNonceBySender in order from bigger nonce to smaller nonce.

        for (const senderPublicKey of Object.keys(lowestNonceBySender)) {
            const allTxFromSender = Array.from(this.memory.getBySender(senderPublicKey));
            allTxFromSender.sort((a, b) => {
                AppUtils.assert.defined<AppUtils.BigNumber>(a.data.nonce);
                AppUtils.assert.defined<AppUtils.BigNumber>(b.data.nonce);

                if (a.data.nonce.isGreaterThan(b.data.nonce)) {
                    return -1;
                }

                if (a.data.nonce.isLessThan(b.data.nonce)) {
                    return 1;
                }

                return 0;
            });

            for (const transaction of allTxFromSender) {
                await purge(transaction);

                AppUtils.assert.defined<AppUtils.BigNumber>(transaction.data.nonce);
                AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

                const nonce: AppUtils.BigNumber = transaction.data.nonce;
                const senderPublicKey: string = transaction.data.senderPublicKey;

                if (nonce.isEqualTo(lowestNonceBySender[senderPublicKey])) {
                    break;
                }
            }
        }
    }
}
