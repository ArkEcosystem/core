import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";
export declare class TransferTransactionHandler extends TransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;
    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;
    walletAttributes(): ReadonlyArray<string>;
    bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void>;
    isActivated(): Promise<boolean>;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction, sender: State.IWallet, walletManager: State.IWalletManager): Promise<void>;
    hasVendorField(): boolean;
    canEnterTransactionPool(data: Interfaces.ITransactionData, pool: TransactionPool.IConnection, processor: TransactionPool.IProcessor): Promise<{
        type: string;
        message: string;
    } | null>;
    applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
}
