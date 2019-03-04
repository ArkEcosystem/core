import { TransactionPool } from "@arkecosystem/core-interfaces";
import { configManager, constants, ITransactionData, models, Transaction } from "@arkecosystem/crypto";
import { isRecipientOnActiveNetwork } from "../utils";
import { TransactionService } from "./transaction";

export class TransferTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.Transfer;
    }

    public canBeApplied(transaction: Transaction, wallet: models.Wallet): boolean {
        return super.canBeApplied(transaction, wallet);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public apply(transaction: Transaction, wallet: models.Wallet): void {
        return;
    }

    public revert(transaction: Transaction, wallet: models.Wallet): void {
        return;
    }

    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.ITransactionGuard): boolean {
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
