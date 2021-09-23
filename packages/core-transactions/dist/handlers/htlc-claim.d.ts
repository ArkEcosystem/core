import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { IDynamicFeeContext } from "../interfaces";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";
export declare class HtlcClaimTransactionHandler extends TransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;
    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;
    walletAttributes(): ReadonlyArray<string>;
    bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void>;
    isActivated(): Promise<boolean>;
    dynamicFee(context: IDynamicFeeContext): Utils.BigNumber;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction, sender: State.IWallet, walletManager: State.IWalletManager): Promise<void>;
    canEnterTransactionPool(data: Interfaces.ITransactionData, pool: TransactionPool.IConnection, processor: TransactionPool.IProcessor): Promise<{
        type: string;
        message: string;
    } | null>;
    applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
}
