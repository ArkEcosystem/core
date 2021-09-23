/// <reference types="node" />
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { MagistrateTransactionHandler } from "./magistrate-handler";
export declare class BridgechainUpdateTransactionHandler extends MagistrateTransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;
    dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor>;
    walletAttributes(): ReadonlyArray<string>;
    bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void>;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction, wallet: State.IWallet, walletManager: State.IWalletManager): Promise<void>;
    emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void;
    canEnterTransactionPool(data: Interfaces.ITransactionData, pool: TransactionPool.IConnection, processor: TransactionPool.IProcessor): Promise<{
        type: string;
        message: string;
    } | null>;
    applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
}
