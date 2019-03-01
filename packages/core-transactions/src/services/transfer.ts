import { constants, ITransactionData, models } from "@arkecosystem/crypto";
import { TransactionService } from "./transaction";

export class TransferTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.Transfer;
    }

    public canBeApplied(data: Readonly<ITransactionData>, wallet: models.Wallet): boolean {
        return super.canBeApplied(data, wallet);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public apply(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        return;
    }

    public revert(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        return;
    }
}
