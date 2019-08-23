import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { TransactionHandlerConstructor } from "./handlers/transaction";

export interface ITransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;

    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;

    walletAttributes(): ReadonlyArray<string>;

    bootstrap(connection: Contracts.Database.IConnection, walletManager: Contracts.State.IWalletManager): Promise<void>;

    isActivated(): Promise<boolean>;

    verify(transaction: Interfaces.ITransaction, walletManager: Contracts.State.IWalletManager): Promise<boolean>;

    dynamicFee(transaction: Interfaces.ITransaction, addonBytes: number, satoshiPerByte: number): Utils.BigNumber;

    throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.IWallet,
        databaseWalletManager: Contracts.State.IWalletManager,
    ): Promise<void>;
    apply(transaction: Interfaces.ITransaction, walletManager: Contracts.State.IWalletManager): Promise<void>;
    revert(transaction: Interfaces.ITransaction, walletManager: Contracts.State.IWalletManager): Promise<void>;

    canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.IConnection,
        processor: Contracts.TransactionPool.IProcessor,
    ): Promise<boolean>;

    emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.IEventDispatcher): void;
}
