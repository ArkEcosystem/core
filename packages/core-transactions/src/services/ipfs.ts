import { constants, ITransactionData, models } from "@arkecosystem/crypto";
import { TransactionService } from "./transaction";

export class IpfsTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.Ipfs;
    }

    public canBeApplied(data: Readonly<ITransactionData>, wallet: models.Wallet): boolean {
        return super.canBeApplied(data, wallet);
    }

    public apply(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        return;
    }

    public revert(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        return;
    }
}
