import { constants, ITransactionData, models } from "@arkecosystem/crypto";
import { SecondSignatureAlreadyRegisteredError } from "../errors";
import { TransactionService } from "./transaction";

export class SecondSignatureTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.SecondSignature;
    }

    public canBeApplied(data: Readonly<ITransactionData>, wallet: models.Wallet): boolean {
        if (wallet.secondPublicKey) {
            throw new SecondSignatureAlreadyRegisteredError();
        }

        return super.canBeApplied(data, wallet);
    }

    public apply(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        wallet.secondPublicKey = data.asset.signature.publicKey;
    }

    public revert(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        wallet.secondPublicKey = null;
    }
}
