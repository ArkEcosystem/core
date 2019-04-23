import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    configManager,
    constants,
    ITransactionData,
    Transaction,
    TransactionConstructor,
    TransferTransaction,
} from "@arkecosystem/crypto";
import { isRecipientOnActiveNetwork } from "../utils";
import { TransactionHandler } from "./transaction";

const { TransactionTypes } = constants;

export class TransferTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return TransferTransaction;
    }

    public canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        return;
    }

    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        return;
    }

    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        if (this.secondSignatureRegistrationFromSenderAlreadyInPool(data, guard)) {
            return false;
        }

        if (!isRecipientOnActiveNetwork(data)) {
            guard.pushError(
                data,
                "ERR_INVALID_RECIPIENT",
                `Recipient ${data.recipientId} is not on the same network: ${configManager.get("pubKeyHash")}`,
            );
            return false;
        }

        return true;
    }
}
