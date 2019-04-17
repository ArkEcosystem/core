import { Database } from "@arkecosystem/core-interfaces";
import { Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import {
    InvalidMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
} from "../errors";
import { TransactionHandler } from "./transaction";

export class MultiSignatureTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.MultiSignatureRegistrationTransaction;
    }

    // TODO: only pass walletManager and let tx fetch wallet itself
    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        const { data } = transaction;
        if (Utils.isException(data)) {
            return true;
        }

        const { publicKeys, min } = data.asset.multiSignature;
        if (min < 1 || min > publicKeys.length) {
            throw new MultiSignatureMinimumKeysError();
        }

        if (publicKeys.length !== data.signature.length / 130) {
            throw new MultiSignatureKeyCountMismatchError();
        }

        const multiSigAddress = Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature);

        const recipientWallet = walletManager.findByAddress(multiSigAddress);
        if (recipientWallet.multisignature) {
            throw new MultiSignatureAlreadyRegisteredError();
        }

        if (!wallet.verifySignatures(data, data.asset.multiSignature)) {
            throw new InvalidMultiSignatureError();
        }

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public applyToSender(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.version === 1) {
            super.applyToSender(transaction, wallet);
        } else if (
            // Only the balance of the sender is updated. The recipient wallet
            // is made into a multi sig wallet.
            data.senderPublicKey === wallet.publicKey ||
            Identities.Address.fromPublicKey(data.senderPublicKey) === wallet.address
        ) {
            wallet.balance = wallet.balance.minus(data.amount).minus(data.fee);
        }
    }

    public applyToRecipient(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.version === 2) {
            wallet.multisignature = transaction.data.asset.multiSignature;
        }
    }

    public revertForSender(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.version === 1) {
            super.revertForSender(transaction, wallet);
        } else if (
            data.senderPublicKey === wallet.publicKey ||
            Identities.Address.fromPublicKey(data.senderPublicKey) === wallet.address
        ) {
            wallet.balance = wallet.balance.plus(data.amount).plus(data.fee);
        }
    }

    public revertForRecipient(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.version === 2) {
            wallet.multisignature = null;
        }
    }

    public apply(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        wallet.multisignature = transaction.data.asset.multiSignature;
    }

    public revert(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        wallet.multisignature = null;
    }
}
