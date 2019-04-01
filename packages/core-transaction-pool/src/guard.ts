import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, Logger, TransactionPool } from "@arkecosystem/core-interfaces";
import { errors, TransactionHandlerRegistry } from "@arkecosystem/core-transactions";
import {
    configManager,
    constants,
    errors as cryptoErrors,
    ITransactionData,
    slots,
    Transaction,
} from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { dynamicFeeMatcher } from "./dynamic-fee";

export class TransactionGuard implements TransactionPool.IGuard {
    public transactions: ITransactionData[] = [];
    public excess: string[] = [];
    public accept: Map<string, Transaction> = new Map();
    public broadcast: Map<string, Transaction> = new Map();
    public invalid: Map<string, ITransactionData> = new Map();
    public errors: { [key: string]: TransactionPool.ITransactionErrorResponse[] } = {};

    constructor(public pool: TransactionPool.IConnection) {}

    public async validate(transactions: ITransactionData[]): Promise<TransactionPool.IValidationResult> {
        this.pool.loggedAllowedSenders = [];

        // Cache transactions
        this.transactions = this.__cacheTransactions(transactions);

        if (this.transactions.length > 0) {
            // Filter transactions and create Transaction instances from accepted ones
            this.__filterAndTransformTransactions(this.transactions);

            // Remove already forged tx... Not optimal here
            await this.__removeForgedTransactions();

            // Add transactions to the pool
            this.__addTransactionsToPool();

            this.__printStats();
        }

        return {
            accept: Array.from(this.accept.keys()),
            broadcast: Array.from(this.broadcast.keys()),
            invalid: Array.from(this.invalid.keys()),
            excess: this.excess,
            errors: Object.keys(this.errors).length > 0 ? this.errors : null,
        };
    }

    /**
     * Cache the given transactions and return which got added. Already cached
     * transactions are not returned.
     */
    public __cacheTransactions(transactions: ITransactionData[]) {
        const { added, notAdded } = app.resolve<Blockchain.IStateStorage>("state").cacheTransactions(transactions);

        notAdded.forEach(transaction => {
            if (!this.errors[transaction.id]) {
                this.pushError(transaction, "ERR_DUPLICATE", "Already in cache.");
            }
        });

        return added;
    }

    /**
     * Get broadcast transactions.
     */
    public getBroadcastTransactions(): Transaction[] {
        return Array.from(this.broadcast.values());
    }

    /**
     * Transforms and filters incoming transactions.
     * It skips:
     * - transactions already in the pool
     * - transactions from blocked senders
     * - transactions that are too large
     * - transactions from the future
     * - dynamic fee mismatch
     * - transactions based on type specific restrictions
     * - not valid crypto transactions
     */
    public __filterAndTransformTransactions(transactions: ITransactionData[]): void {
        transactions.forEach(transaction => {
            const exists = this.pool.transactionExists(transaction.id);

            if (exists) {
                this.pushError(transaction, "ERR_DUPLICATE", `Duplicate transaction ${transaction.id}`);
            } else if (this.pool.isSenderBlocked(transaction.senderPublicKey)) {
                this.pushError(
                    transaction,
                    "ERR_SENDER_BLOCKED",
                    `Transaction ${transaction.id} rejected. Sender ${transaction.senderPublicKey} is blocked.`,
                );
            } else if (JSON.stringify(transaction).length > this.pool.options.maxTransactionBytes) {
                this.pushError(
                    transaction,
                    "ERR_TOO_LARGE",
                    `Transaction ${transaction.id} is larger than ${this.pool.options.maxTransactionBytes} bytes.`,
                );
            } else if (this.pool.hasExceededMaxTransactions(transaction)) {
                this.excess.push(transaction.id);
            } else if (this.__validateTransaction(transaction)) {
                try {
                    const receivedId = transaction.id;
                    const trx = Transaction.fromData(transaction);
                    if (trx.verified) {
                        const applyErrors = [];
                        if (this.pool.walletManager.canApply(trx, applyErrors)) {
                            const dynamicFee = dynamicFeeMatcher(trx);
                            if (!dynamicFee.enterPool && !dynamicFee.broadcast) {
                                this.pushError(
                                    transaction,
                                    "ERR_LOW_FEE",
                                    "The fee is too low to broadcast and accept the transaction",
                                );
                            } else {
                                if (dynamicFee.enterPool) {
                                    this.accept.set(trx.data.id, trx);
                                }

                                if (dynamicFee.broadcast) {
                                    this.broadcast.set(trx.data.id, trx);
                                }
                            }
                        } else {
                            this.pushError(transaction, "ERR_APPLY", JSON.stringify(applyErrors));
                        }
                    } else {
                        transaction.id = receivedId;
                        this.pushError(
                            transaction,
                            "ERR_BAD_DATA",
                            "Transaction didn't pass the verification process.",
                        );
                    }
                } catch (error) {
                    if (error instanceof cryptoErrors.TransactionSchemaError) {
                        this.pushError(transaction, "ERR_TRANSACTION_SCHEMA", error.message);
                    } else {
                        this.pushError(transaction, "ERR_UNKNOWN", error.message);
                    }
                }
            }
        });
    }

    /**
     * Determines valid transactions by checking rules, according to:
     * - transaction timestamp
     * - wallet balance
     * - network if set
     * - transaction type specifics:
     *    - if recipient is on the same network
     *    - if sender already has another transaction of the same type, for types that
     *    - only allow one transaction at a time in the pool (e.g. vote)
     */
    public __validateTransaction(transaction: ITransactionData): boolean {
        const now = slots.getTime();
        if (transaction.timestamp > now + 3600) {
            const secondsInFuture = transaction.timestamp - now;
            this.pushError(
                transaction,
                "ERR_FROM_FUTURE",
                `Transaction ${transaction.id} is ${secondsInFuture} seconds in the future`,
            );
            return false;
        }

        if (transaction.network && transaction.network !== configManager.get("pubKeyHash")) {
            this.pushError(
                transaction,
                "ERR_WRONG_NETWORK",
                `Transaction network '${transaction.network}' does not match '${configManager.get("pubKeyHash")}'`,
            );
            return false;
        }

        const { type } = transaction;
        try {
            const handler = TransactionHandlerRegistry.get(type);
            return handler.canEnterTransactionPool(transaction, this);
        } catch (error) {
            if (error instanceof errors.InvalidTransactionTypeError) {
                this.pushError(
                    transaction,
                    "ERR_UNSUPPORTED",
                    `Invalidating transaction of unsupported type '${constants.TransactionTypes[type]}'`,
                );
            } else {
                this.pushError(transaction, "ERR_UNKNOWN", error.message);
            }
        }

        return false;
    }

    /**
     * Remove already forged transactions.
     */
    public async __removeForgedTransactions() {
        const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

        const forgedIdsSet = await databaseService.getForgedTransactionsIds([
            ...new Set([...this.accept.keys(), ...this.broadcast.keys()]),
        ]);

        app.resolve("state").removeCachedTransactionIds(forgedIdsSet);

        forgedIdsSet.forEach(id => {
            this.pushError(this.accept.get(id).data, "ERR_FORGED", "Already forged.");

            this.accept.delete(id);
            this.broadcast.delete(id);
        });
    }

    /**
     * Add accepted transactions to the pool and filter rejected ones.
     */
    public __addTransactionsToPool() {
        // Add transactions to the transaction pool
        const { notAdded } = this.pool.addTransactions(Array.from(this.accept.values()));

        // Exclude transactions which were refused from the pool
        notAdded.forEach(item => {
            this.accept.delete(item.transaction.id);

            // The transaction should still be broadcasted if the pool is full
            if (item.type !== "ERR_POOL_FULL") {
                this.broadcast.delete(item.transaction.id);
            }

            this.pushError(item.transaction.data, item.type, item.message);
        });
    }

    /**
     * Adds a transaction to the errors object. The transaction id is mapped to an
     * array of errors. There may be multiple errors associated with a transaction in
     * which case pushError is called multiple times.
     */
    public pushError(transaction: ITransactionData, type: string, message: string) {
        if (!this.errors[transaction.id]) {
            this.errors[transaction.id] = [];
        }

        this.errors[transaction.id].push({ type, message });

        this.invalid.set(transaction.id, transaction);
    }

    /**
     * Print compact transaction stats.
     */
    public __printStats() {
        const properties = ["accept", "broadcast", "excess", "invalid"];
        const stats = properties
            .map(prop => `${prop}: ${this[prop] instanceof Array ? this[prop].length : this[prop].size}`)
            .join(" ");

        app.resolvePlugin<Logger.ILogger>("logger").info(
            `Received ${pluralize("transaction", this.transactions.length, true)} (${stats}).`,
        );
    }
}
