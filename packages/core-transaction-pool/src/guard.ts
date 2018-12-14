import { app } from "@arkecosystem/core-container";
import { configManager, constants, models, slots } from "@arkecosystem/crypto";
import pluralize from "pluralize";

const { TRANSACTION_TYPES } = constants;
const { Transaction } = models;

import { dynamicFeeMatcher } from "./utils/dynamicfee-matcher";
import { isRecipientOnActiveNetwork } from "./utils/is-on-active-network";

export class TransactionGuard {
    public transactions: any[];
    public excess: any[];
    public accept: { [key: string]: any };
    public broadcast: { [key: string]: any };
    public invalid: { [key: string]: any };
    public errors: any;
    private pool: any;

    /**
     * Create a new transaction guard instance.
     * @param  {TransactionPoolInterface} pool
     * @return {void}
     */
    constructor(pool) {
        this.pool = pool;

        this.transactions = [];
        this.excess = [];
        this.accept = new Map();
        this.broadcast = new Map();
        this.invalid = new Map();
        this.errors = {};
    }

    /**
     * Validate the specified transactions and accepted transactions to the pool.
     * @param  {Array} transactions
     * @return Object {
     *   accept: array of transaction ids that qualify for entering the pool
     *   broadcast: array of of transaction ids that qualify for broadcasting
     *   invalid: array of invalid transaction ids
     *   excess: array of transaction ids that exceed sender's quota in the pool
     *   errors: Object with
     *     keys=transaction id (for each element in invalid[]),
     *     value=[ { type, message }, ... ]
     * }
     */
    public async validate(transactionsJson) {
        this.pool.loggedAllowedSenders = [];

        // Cache transactions
        this.transactions = this.__cacheTransactions(transactionsJson);

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
     * @return {Array}
     */
    public __cacheTransactions(transactions) {
        const { added, notAdded } = app.resolve("state").cacheTransactions(transactions);

        notAdded.forEach(transaction => {
            if (!this.errors[transaction.id]) {
                this.__pushError(transaction, "ERR_DUPLICATE", "Already in cache.");
            }
        });

        return added;
    }

    /**
     * Get broadcast transactions.
     * @return {Array}
     */
    public getBroadcastTransactions() {
        return Array.from(this.broadcast.values());
    }

    /**
     * Transforms and filters incoming transactions.
     * It skips:
     * - transactions already in the pool
     * - transactions from blocked senders
     * - transactions from the future
     * - dynamic fee mismatch
     * - transactions based on type specific restrictions
     * - not valid crypto transactions
     * @param  {Array} transactions
     * @return {void}
     */
    public __filterAndTransformTransactions(transactions) {
        transactions.forEach(transaction => {
            const exists = this.pool.transactionExists(transaction.id);

            if (exists) {
                this.__pushError(transaction, "ERR_DUPLICATE", `Duplicate transaction ${transaction.id}`);
            } else if (this.pool.isSenderBlocked(transaction.senderPublicKey)) {
                this.__pushError(
                    transaction,
                    "ERR_SENDER_BLOCKED",
                    `Transaction ${transaction.id} rejected. Sender ${transaction.senderPublicKey} is blocked.`,
                );
            } else if (this.pool.hasExceededMaxTransactions(transaction)) {
                this.excess.push(transaction.id);
            } else if (this.__validateTransaction(transaction)) {
                try {
                    const trx = new Transaction(transaction);
                    if (trx.verified) {
                        const dynamicFee = dynamicFeeMatcher(trx);
                        if (dynamicFee.enterPool) {
                            this.accept.set(trx.id, trx);
                        } else {
                            this.__pushError(transaction, "ERR_LOW_FEE", "Too low fee to be accepted in the pool");
                        }

                        if (dynamicFee.broadcast) {
                            this.broadcast.set(trx.id, trx);
                        } else {
                            this.__pushError(transaction, "ERR_LOW_FEE", "Too low fee for broadcast");
                        }
                    } else {
                        this.__pushError(
                            transaction,
                            "ERR_BAD_DATA",
                            "Transaction didn't pass the verification process.",
                        );
                    }
                } catch (error) {
                    this.__pushError(transaction, "ERR_UNKNOWN", error.message);
                }
            }
        });
    }

    /**
     * Determines valid transactions by checking rules, according to:
     * - transaction timestamp
     * - wallet balance
     * - transaction type specifics:
     *    - if recipient is on the same network
     *    - if sender already has another transaction of the same type, for types that
     *    - only allow one transaction at a time in the pool (e.g. vote)
     */
    public __validateTransaction(transaction) {
        const now = slots.getTime();
        if (transaction.timestamp > now + 3600) {
            const secondsInFuture = transaction.timestamp - now;
            this.__pushError(
                transaction,
                "ERR_FROM_FUTURE",
                `Transaction ${transaction.id} is ${secondsInFuture} seconds in the future`,
            );
            return false;
        }

        const errors = [];
        if (!this.pool.walletManager.canApply(transaction, errors)) {
            this.__pushError(transaction, "ERR_APPLY", JSON.stringify(errors));
            return false;
        }

        switch (transaction.type) {
            case TRANSACTION_TYPES.TRANSFER:
                if (!isRecipientOnActiveNetwork(transaction)) {
                    this.__pushError(
                        transaction,
                        "ERR_INVALID_RECIPIENT",
                        `Recipient ${transaction.recipientId} is not on the same network: ${configManager.get(
                            "pubKeyHash",
                        )}`,
                    );
                    return false;
                }
                break;
            case TRANSACTION_TYPES.SECOND_SIGNATURE:
            case TRANSACTION_TYPES.DELEGATE_REGISTRATION:
            case TRANSACTION_TYPES.VOTE:
                if (this.pool.senderHasTransactionsOfType(transaction.senderPublicKey, transaction.type)) {
                    this.__pushError(
                        transaction,
                        "ERR_PENDING",
                        `Sender ${transaction.senderPublicKey} already has a transaction of type ` +
                            `'${TRANSACTION_TYPES.toString(transaction.type)}' in the pool`,
                    );
                    return false;
                }
                break;
            case TRANSACTION_TYPES.MULTI_SIGNATURE:
            case TRANSACTION_TYPES.IPFS:
            case TRANSACTION_TYPES.TIMELOCK_TRANSFER:
            case TRANSACTION_TYPES.MULTI_PAYMENT:
            case TRANSACTION_TYPES.DELEGATE_RESIGNATION:
            default:
                this.__pushError(
                    transaction,
                    "ERR_UNSUPPORTED",
                    "Invalidating transaction of unsupported type " +
                        `'${TRANSACTION_TYPES.toString(transaction.type)}'`,
                );
                return false;
        }

        return true;
    }

    /**
     * Remove already forged transactions.
     * @return {void}
     */
    public async __removeForgedTransactions() {
        const database = app.resolvePlugin("database");

        const forgedIdsSet = await database.getForgedTransactionsIds([
            ...new Set([...this.accept.keys(), ...this.broadcast.keys()]),
        ]);

        app.resolve("state").removeCachedTransactionIds(forgedIdsSet);

        forgedIdsSet.forEach(id => {
            this.__pushError(this.accept.get(id), "ERR_FORGED", "Already forged.");

            this.accept.delete(id);
            this.broadcast.delete(id);
        });
    }

    /**
     * Add accepted transactions to the pool and filter rejected ones.
     * @return {void}
     */
    public __addTransactionsToPool() {
        // Add transactions to the transaction pool
        const { added, notAdded } = this.pool.addTransactions(Array.from(this.accept.values()));

        // Exclude transactions which were refused from the pool
        notAdded.forEach(item => {
            this.accept.delete(item.transaction.id);

            // The transaction should still be broadcasted if the pool is full
            if (item.type !== "ERR_POOL_FULL") {
                this.broadcast.delete(item.transaction.id);
            }

            this.__pushError(item.transaction, item.type, item.message);
        });
    }

    /**
     * Adds a transaction to the errors object. The transaction id is mapped to an
     * array of errors. There may be multiple errors associated with a transaction in
     * which case __pushError is called multiple times.
     * @param {Transaction} transaction
     * @param {String} type
     * @param {String} message
     * @return {void}
     */
    public __pushError(transaction, type, message) {
        if (!this.errors[transaction.id]) {
            this.errors[transaction.id] = [];
        }

        this.errors[transaction.id].push({ type, message });

        this.invalid.set(transaction.id, transaction);
    }

    /**
     * Print compact transaction stats.
     * @return {void}
     */
    public __printStats() {
        const properties = ["accept", "broadcast", "excess", "invalid"];
        const stats = properties
            .map(prop => `${prop}: ${this[prop] instanceof Array ? this[prop].length : this[prop].size}`)
            .join(" ");

        app.resolvePlugin("logger").info(
            `Received ${pluralize("transaction", this.transactions.length, true)} (${stats}).`,
        );
    }
}
