import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { TransactionHandlerConstructor } from "./handlers/transaction";

export interface TransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;

    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;

    walletAttributes(): ReadonlyArray<string>;

    bootstrap(connection: Contracts.Database.Connection, walletManager: Contracts.State.WalletManager): Promise<void>;

    isActivated(): Promise<boolean>;

    verify(transaction: Interfaces.ITransaction, walletManager: Contracts.State.WalletManager): Promise<boolean>;

    dynamicFee(transaction: Interfaces.ITransaction, addonBytes: number, satoshiPerByte: number): Utils.BigNumber;

    throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletManager: Contracts.State.WalletManager,
    ): Promise<void>;
    apply(transaction: Interfaces.ITransaction, walletManager: Contracts.State.WalletManager): Promise<void>;
    revert(transaction: Interfaces.ITransaction, walletManager: Contracts.State.WalletManager): Promise<void>;

    canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean>;

    emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void;
}
