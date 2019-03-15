import { Database } from "@arkecosystem/core-interfaces";
import { MultiSignatureRegistrationTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import {
    InvalidMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
} from "../errors";
import { TransactionHandler } from "./transaction";

export class MultiSignatureTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return MultiSignatureRegistrationTransaction;
    }

    // TODO: AIP18
    public canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
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

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.multisignature = transaction.data.asset.multisignature;
    }

    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.multisignature = null;
    }
}
