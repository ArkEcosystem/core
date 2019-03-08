import { Database } from "@arkecosystem/core-interfaces";
import { constants, models, Transaction } from "@arkecosystem/crypto";
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
    public canBeApplied(
        transaction: Transaction,
        wallet: models.Wallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        const { data } = transaction;
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

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Transaction, wallet: models.Wallet): void {
        wallet.multisignature = transaction.data.asset.multisignature;
    }

    public revert(transaction: Transaction, wallet: models.Wallet): void {
        wallet.multisignature = null;
    }
}
