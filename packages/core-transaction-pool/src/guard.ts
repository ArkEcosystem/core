import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app, Contracts } from "@arkecosystem/core-kernel";
import { configManager, constants, models, slots } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { TransactionPool } from "./connection";
import { dynamicFeeMatcher } from "./dynamic-fee";
import { isRecipientOnActiveNetwork } from "./utils/is-on-active-network";

const { TransactionTypes } = constants;
const { Transaction } = models;

export class TransactionGuard implements Contracts.TransactionPool.ITransactionGuard {
    public transactions: models.Transaction[] = [];
    public excess: string[] = [];
    public accept: Map<string, models.Transaction> = new Map();
    public broadcast: Map<string, models.Transaction> = new Map();
    public invalid: Map<string, models.Transaction> = new Map();
    public errors: { [key: string]: Contracts.TransactionPool.TransactionErrorDTO[] } = {};

    /**
     * Create a new transaction guard instance.
     * @param  {TransactionPoolInterface} pool
     * @return {void}
     */
    constructor(private pool: TransactionPool) {}

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
    public async validate(transactions: models.Transaction[]): Promise<Contracts.TransactionPool.ValidationResultDTO> {
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
    public getBroadcastTransactions(): models.Transaction[] {
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

                        if (!dynamicFee.enterPool && !dynamicFee.broadcast) {
                            this.__pushError(
                                transaction,
                                "ERR_LOW_FEE",
                                "The fee is too low to broadcast and accept the transaction",
                            );
                        } else {
                            if (dynamicFee.enterPool) {
                                this.accept.set(trx.id, trx);
                            }

                            if (dynamicFee.broadcast) {
                                this.broadcast.set(trx.id, trx);
                            }
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
     * - network if set
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

        if (transaction.network && transaction.network !== configManager.get("pubKeyHash")) {
            this.__pushError(
                transaction,
                "ERR_WRONG_NETWORK",
                `Transaction network '${transaction.network}' does not match '${configManager.get("pubKeyHash")}'`,
            );
            return false;
        }

        switch (transaction.type) {
            case TransactionTypes.Transfer:
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
            case TransactionTypes.SecondSignature:
            case TransactionTypes.DelegateRegistration:
            case TransactionTypes.Vote:
                if (this.pool.senderHasTransactionsOfType(transaction.senderPublicKey, transaction.type)) {
                    this.__pushError(
                        transaction,
                        "ERR_PENDING",
                        `Sender ${transaction.senderPublicKey} already has a transaction of type ` +
                            `'${TransactionTypes[transaction.type]}' in the pool`,
                    );
                    return false;
                }
                break;
            case TransactionTypes.MultiSignature:
            case TransactionTypes.Ipfs:
            case TransactionTypes.TimelockTransfer:
            case TransactionTypes.MultiPayment:
            case TransactionTypes.DelegateResignation:
            default:
                this.__pushError(
                    transaction,
                    "ERR_UNSUPPORTED",
                    "Invalidating transaction of unsupported type " + `'${TransactionTypes[transaction.type]}'`,
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
        const database = app.resolve<PostgresConnection>("database");

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

        app.logger.info(`Received ${pluralize("transaction", this.transactions.length, true)} (${stats}).`);
    }
}
