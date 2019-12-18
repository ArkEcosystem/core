import { app } from "@arkecosystem/core-container";
import { Database, Logger, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Errors, Handlers } from "@arkecosystem/core-transactions";
import { expirationCalculator } from "@arkecosystem/core-utils";
import { Crypto, Enums, Errors as CryptoErrors, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { dynamicFeeMatcher } from "./dynamic-fee";
import { IDynamicFeeMatch, ITransactionsCached, ITransactionsProcessed } from "./interfaces";
import { getMaxTransactionBytes } from "./utils";

/**
 * @TODO: this class has too many responsibilities at the moment.
 * Its sole responsibility should be to validate transactions and return them.
 */
export class Processor implements TransactionPool.IProcessor {
    private transactions: Interfaces.ITransactionData[] = [];
    private readonly excess: string[] = [];
    private readonly accept: Map<string, Interfaces.ITransaction> = new Map();
    private readonly broadcast: Map<string, Interfaces.ITransaction> = new Map();
    private readonly invalid: Map<string, Interfaces.ITransactionData> = new Map();
    private readonly errors: { [key: string]: TransactionPool.ITransactionErrorResponse[] } = {};

    constructor(private readonly pool: TransactionPool.IConnection) {}

    public async validate(transactions: Interfaces.ITransactionData[]): Promise<TransactionPool.IProcessorResult> {
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

    public getTransactions(): Interfaces.ITransactionData[] {
        return this.transactions;
    }

    public getBroadcastTransactions(): Interfaces.ITransaction[] {
        return Array.from(this.broadcast.values());
    }

    public getErrors(): { [key: string]: TransactionPool.ITransactionErrorResponse[] } {
        return this.errors;
    }

    public pushError(transaction: Interfaces.ITransactionData, type: string, message: string): void {
        if (!this.errors[transaction.id]) {
            this.errors[transaction.id] = [];
        }

        this.errors[transaction.id].push({ type, message });

        this.invalid.set(transaction.id, transaction);
    }

    private cacheTransactions(transactions: Interfaces.ITransactionData[]): void {
        const { added, notAdded }: ITransactionsCached = app
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .cacheTransactions(transactions);

        this.transactions = added;

        for (const transaction of notAdded) {
            if (!this.errors[transaction.id]) {
                this.pushError(transaction, "ERR_DUPLICATE", "Already in cache.");
            }
        }
    }

    private async removeForgedTransactions(): Promise<void> {
        const forgedIdsSet: string[] = await app
            .resolvePlugin<Database.IDatabaseService>("database")
            .getForgedTransactionsIds([...new Set([...this.accept.keys(), ...this.broadcast.keys()])]);

        for (const id of forgedIdsSet) {
            this.pushError(this.accept.get(id).data, "ERR_FORGED", "Already forged.");

            this.accept.delete(id);
            this.broadcast.delete(id);
        }
    }

    private async filterAndTransformTransactions(transactions: Interfaces.ITransactionData[]): Promise<void> {
        const maxTransactionBytes: number = getMaxTransactionBytes();

        for (const transaction of transactions) {
            const exists: boolean = await this.pool.has(transaction.id);

            if (exists) {
                this.pushError(transaction, "ERR_DUPLICATE", `Duplicate transaction ${transaction.id}`);
            } else if (await this.pool.hasExceededMaxTransactions(transaction.senderPublicKey)) {
                this.excess.push(transaction.id);
            } else if (await this.validateTransaction(transaction)) {
                try {
                    const receivedId: string = transaction.id;
                    const transactionInstance: Interfaces.ITransaction = Transactions.TransactionFactory.fromData(
                        transaction,
                    );
                    if (transactionInstance.serialized.byteLength > maxTransactionBytes) {
                        return this.pushError(
                            transaction,
                            "ERR_TOO_LARGE",
                            `Transaction ${transaction.id} is larger than ${maxTransactionBytes} bytes.`,
                        );
                    }

                    const handler: Handlers.TransactionHandler = await Handlers.Registry.get(
                        transactionInstance.type,
                        transactionInstance.typeGroup,
                    );
                    if (await handler.verify(transactionInstance, this.pool.walletManager)) {
                        try {
                            const dynamicFee: IDynamicFeeMatch = await dynamicFeeMatcher(transactionInstance);
                            if (!dynamicFee.enterPool && !dynamicFee.broadcast) {
                                this.pushError(
                                    transaction,
                                    "ERR_LOW_FEE",
                                    "The fee is too low to broadcast and accept the transaction",
                                );
                            } else {
                                if (dynamicFee.enterPool) {
                                    this.accept.set(transactionInstance.data.id, transactionInstance);
                                }

                                if (dynamicFee.broadcast) {
                                    this.broadcast.set(transactionInstance.data.id, transactionInstance);
                                }
                            }
                        } catch (error) {
                            this.pushError(transaction, "ERR_APPLY", error.message);
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
                    if (error instanceof CryptoErrors.TransactionSchemaError) {
                        this.pushError(transaction, "ERR_TRANSACTION_SCHEMA", error.message);
                    } else {
                        this.pushError(transaction, "ERR_UNKNOWN", error.message);
                    }
                }
            }
        }
    }

    private async validateTransaction(transaction: Interfaces.ITransactionData): Promise<boolean> {
        const now: number = Crypto.Slots.getTime();

        if (transaction.timestamp > now + 3600) {
            const secondsInFuture: number = transaction.timestamp - now;

            this.pushError(
                transaction,
                "ERR_FROM_FUTURE",
                `Transaction ${transaction.id} is ${secondsInFuture} seconds in the future`,
            );

            return false;
        }

        const lastHeight: number = app
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .getLastHeight();

        const expirationContext = {
            blockTime: Managers.configManager.getMilestone(lastHeight).blocktime,
            currentHeight: lastHeight,
            now: Crypto.Slots.getTime(),
            maxTransactionAge: app.resolveOptions("transaction-pool").maxTransactionAge,
        };

        const expiration: number = expirationCalculator.calculateTransactionExpiration(transaction, expirationContext);

        if (expiration !== null && expiration <= lastHeight + 1) {
            this.pushError(
                transaction,
                "ERR_EXPIRED",
                `Transaction ${transaction.id} is expired since ${lastHeight - expiration} blocks.`,
            );

            return false;
        }

        if (transaction.network && transaction.network !== Managers.configManager.get("network.pubKeyHash")) {
            this.pushError(
                transaction,
                "ERR_WRONG_NETWORK",
                `Transaction network '${transaction.network}' does not match '${Managers.configManager.get(
                    "pubKeyHash",
                )}'`,
            );

            return false;
        }

        try {
            // @TODO: this leaks private members, refactor this
            const handler: Handlers.TransactionHandler = await Handlers.Registry.get(
                transaction.type,
                transaction.typeGroup,
            );
            const err = await handler.canEnterTransactionPool(transaction, this.pool, this);
            if (err !== null) {
                this.pushError(transaction, err.type, err.message);
                return false;
            }
            return true;
        } catch (error) {
            if (error instanceof Errors.InvalidTransactionTypeError) {
                this.pushError(
                    transaction,
                    "ERR_UNSUPPORTED",
                    `Invalidating transaction of unsupported type '${Enums.TransactionType[transaction.type]}'`,
                );
            } else {
                this.pushError(transaction, "ERR_UNKNOWN", error.message);
            }
        }

        return false;
    }

    private async addTransactionsToPool(): Promise<void> {
        const { notAdded }: ITransactionsProcessed = await this.pool.addTransactions(Array.from(this.accept.values()));

        for (const item of notAdded) {
            this.accept.delete(item.transaction.id);

            if (item.type !== "ERR_POOL_FULL") {
                this.broadcast.delete(item.transaction.id);
            }

            this.pushError(item.transaction.data, item.type, item.message);
        }
    }

    private printStats(): void {
        const stats: string = ["accept", "broadcast", "excess", "invalid"]
            .map(prop => `${prop}: ${this[prop] instanceof Array ? this[prop].length : this[prop].size}`)
            .join(" ");

        if (Object.keys(this.errors).length > 0) {
            app.resolvePlugin<Logger.ILogger>("logger").debug(JSON.stringify(this.errors));
        }

        app.resolvePlugin<Logger.ILogger>("logger").info(
            `Received ${pluralize("transaction", this.transactions.length, true)} (${stats}).`,
        );
    }
}
