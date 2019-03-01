import { constants, ITransactionData, models } from "@arkecosystem/crypto";
import {
    InvalidMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
} from "../errors";
import { TransactionService } from "./transaction";

export class MultiSignatureTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.MultiSignature;
    }

    // TODO: AIP18
    public canBeApplied(data: Readonly<ITransactionData>, wallet: models.Wallet): boolean {
        if (wallet.multisignature) {
            throw new MultiSignatureAlreadyRegisteredError();
        }

        const { keysgroup, min } = data.asset.multisignature;
        if (keysgroup.length < min) {
            throw new MultiSignatureMinimumKeysError();
        }

        if (keysgroup.length !== data.signatures.length) {
            throw new MultiSignatureKeyCountMismatchError();
        }

        if (!wallet.verifySignatures(data, data.asset.multisignature)) {
            throw new InvalidMultiSignatureError();
        }

        return super.canBeApplied(data, wallet);
    }

    public apply(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        wallet.multisignature = data.asset.multisignature;
    }

    public revert(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        wallet.multisignature = null;
    }
}
