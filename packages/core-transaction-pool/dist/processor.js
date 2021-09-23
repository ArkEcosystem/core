"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const pluralize_1 = __importDefault(require("pluralize"));
const dynamic_fee_1 = require("./dynamic-fee");
const utils_1 = require("./utils");
/**
 * @TODO: this class has too many responsibilities at the moment.
 * Its sole responsibility should be to validate transactions and return them.
 */
class Processor {
    constructor(pool) {
        this.pool = pool;
        this.transactions = [];
        this.excess = [];
        this.accept = new Map();
        this.broadcast = new Map();
        this.invalid = new Map();
        this.errors = {};
    }
    async validate(transactions) {
        this.cacheTransactions(transactions);
        if (this.transactions.length > 0) {
            await this.filterAndTransformTransactions(this.transactions);
            await this.removeForgedTransactions();
            await this.addTransactionsToPool();
            this.printStats();
        }
        return {
            accept: Array.from(this.accept.keys()),
            broadcast: Array.from(this.broadcast.keys()),
            invalid: Array.from(this.invalid.keys()),
            excess: this.excess,
            errors: Object.keys(this.errors).length > 0 ? this.errors : undefined,
        };
    }
    getTransactions() {
        return this.transactions;
    }
    getBroadcastTransactions() {
        return Array.from(this.broadcast.values());
    }
    getErrors() {
        return this.errors;
    }
    pushError(transaction, type, message) {
        if (!this.errors[transaction.id]) {
            this.errors[transaction.id] = [];
        }
        this.errors[transaction.id].push({ type, message });
        this.invalid.set(transaction.id, transaction);
    }
    cacheTransactions(transactions) {
        const { added, notAdded } = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .cacheTransactions(transactions);
        this.transactions = added;
        for (const transaction of notAdded) {
            if (!this.errors[transaction.id]) {
                this.pushError(transaction, "ERR_DUPLICATE", "Already in cache.");
            }
        }
    }
    async removeForgedTransactions() {
        const forgedIdsSet = await core_container_1.app
            .resolvePlugin("database")
            .getForgedTransactionsIds([...new Set([...this.accept.keys(), ...this.broadcast.keys()])]);
        for (const id of forgedIdsSet) {
            this.pushError(this.accept.get(id).data, "ERR_FORGED", "Already forged.");
            this.accept.delete(id);
            this.broadcast.delete(id);
        }
    }
    async filterAndTransformTransactions(transactions) {
        const maxTransactionBytes = utils_1.getMaxTransactionBytes();
        for (const transaction of transactions) {
            const exists = await this.pool.has(transaction.id);
            if (exists) {
                this.pushError(transaction, "ERR_DUPLICATE", `Duplicate transaction ${transaction.id}`);
            }
            else if (await this.pool.hasExceededMaxTransactions(transaction.senderPublicKey)) {
                this.excess.push(transaction.id);
            }
            else if (await this.validateTransaction(transaction)) {
                try {
                    const receivedId = transaction.id;
                    const transactionInstance = crypto_1.Transactions.TransactionFactory.fromData(transaction);
                    if (transactionInstance.serialized.byteLength > maxTransactionBytes) {
                        return this.pushError(transaction, "ERR_TOO_LARGE", `Transaction ${transaction.id} is larger than ${maxTransactionBytes} bytes.`);
                    }
                    const handler = await core_transactions_1.Handlers.Registry.get(transactionInstance.type, transactionInstance.typeGroup);
                    if (await handler.verify(transactionInstance, this.pool.walletManager)) {
                        try {
                            const dynamicFee = await dynamic_fee_1.dynamicFeeMatcher(transactionInstance);
                            if (!dynamicFee.enterPool && !dynamicFee.broadcast) {
                                this.pushError(transaction, "ERR_LOW_FEE", "The fee is too low to broadcast and accept the transaction");
                            }
                            else {
                                if (dynamicFee.enterPool) {
                                    this.accept.set(transactionInstance.data.id, transactionInstance);
                                }
                                if (dynamicFee.broadcast) {
                                    this.broadcast.set(transactionInstance.data.id, transactionInstance);
                                }
                            }
                        }
                        catch (error) {
                            this.pushError(transaction, "ERR_APPLY", error.message);
                        }
                    }
                    else {
                        transaction.id = receivedId;
                        this.pushError(transaction, "ERR_BAD_DATA", "Transaction didn't pass the verification process.");
                    }
                }
                catch (error) {
                    if (error instanceof crypto_1.Errors.TransactionSchemaError) {
                        this.pushError(transaction, "ERR_TRANSACTION_SCHEMA", error.message);
                    }
                    else {
                        this.pushError(transaction, "ERR_UNKNOWN", error.message);
                    }
                }
            }
        }
    }
    async validateTransaction(transaction) {
        const now = crypto_1.Crypto.Slots.getTime();
        if (transaction.timestamp > now + 3600) {
            const secondsInFuture = transaction.timestamp - now;
            this.pushError(transaction, "ERR_FROM_FUTURE", `Transaction ${transaction.id} is ${secondsInFuture} seconds in the future`);
            return false;
        }
        const lastHeight = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastHeight();
        const expirationContext = {
            blockTime: crypto_1.Managers.configManager.getMilestone(lastHeight).blocktime,
            currentHeight: lastHeight,
            now: crypto_1.Crypto.Slots.getTime(),
            maxTransactionAge: core_container_1.app.resolveOptions("transaction-pool").maxTransactionAge,
        };
        const expiration = core_utils_1.expirationCalculator.calculateTransactionExpiration(transaction, expirationContext);
        if (expiration !== null && expiration <= lastHeight + 1) {
            this.pushError(transaction, "ERR_EXPIRED", `Transaction ${transaction.id} is expired since ${lastHeight - expiration} blocks.`);
            return false;
        }
        if (transaction.network && transaction.network !== crypto_1.Managers.configManager.get("network.pubKeyHash")) {
            this.pushError(transaction, "ERR_WRONG_NETWORK", `Transaction network '${transaction.network}' does not match '${crypto_1.Managers.configManager.get("pubKeyHash")}'`);
            return false;
        }
        try {
            // @TODO: this leaks private members, refactor this
            const handler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
            const err = await handler.canEnterTransactionPool(transaction, this.pool, this);
            if (err !== null) {
                this.pushError(transaction, err.type, err.message);
                return false;
            }
            return true;
        }
        catch (error) {
            if (error instanceof core_transactions_1.Errors.InvalidTransactionTypeError) {
                this.pushError(transaction, "ERR_UNSUPPORTED", `Invalidating transaction of unsupported type '${crypto_1.Enums.TransactionType[transaction.type]}'`);
            }
            else {
                this.pushError(transaction, "ERR_UNKNOWN", error.message);
            }
        }
        return false;
    }
    async addTransactionsToPool() {
        const { notAdded } = await this.pool.addTransactions(Array.from(this.accept.values()));
        for (const item of notAdded) {
            this.accept.delete(item.transaction.id);
            if (item.type !== "ERR_POOL_FULL") {
                this.broadcast.delete(item.transaction.id);
            }
            this.pushError(item.transaction.data, item.type, item.message);
        }
    }
    printStats() {
        const stats = ["accept", "broadcast", "excess", "invalid"]
            .map(prop => `${prop}: ${this[prop] instanceof Array ? this[prop].length : this[prop].size}`)
            .join(" ");
        if (Object.keys(this.errors).length > 0) {
            core_container_1.app.resolvePlugin("logger").debug(JSON.stringify(this.errors));
        }
        core_container_1.app.resolvePlugin("logger").info(`Received ${pluralize_1.default("transaction", this.transactions.length, true)} (${stats}).`);
    }
}
exports.Processor = Processor;
//# sourceMappingURL=processor.js.map