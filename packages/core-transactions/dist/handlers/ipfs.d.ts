import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";
export declare class IpfsTransactionHandler extends TransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;
    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;
    walletAttributes(): ReadonlyArray<string>;
    bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void>;
    isActivated(): Promise<boolean>;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction, wallet: State.IWallet, walletManager: State.IWalletManager): Promise<void>;
    canEnterTransactionPool(data: Interfaces.ITransactionData, pool: TransactionPool.IConnection, processor: TransactionPool.IProcessor): Promise<{
        type: string;
        message: string;
    } | null>;
    applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
}
