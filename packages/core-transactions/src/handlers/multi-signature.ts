import { State, TransactionPool } from "@arkecosystem/core-interfaces";
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

    public bootstrap(transactions: Interfaces.ITransactionData[], walletManager: State.IWalletManager): void {
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            if (!wallet.multisignature) {
                if (transaction.version === 1) {
                    wallet.multisignature = transaction.asset.multisignature || transaction.asset.multiSignatureLegacy;
                } else if (transaction.version === 2) {
                    wallet.multisignature = transaction.asset.multiSignature;
                } else {
                    throw new Error(`Invalid multi signature version ${transaction.version}`);
                }
            }
        }
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): boolean {
        const { data }: Interfaces.ITransaction = transaction;

        if (Utils.isException(data)) {
            return true;
        }

        const { publicKeys, min } = data.asset.multiSignature;
        if (min < 1 || min > publicKeys.length || min > 16) {
            throw new MultiSignatureMinimumKeysError();
        }

        if (publicKeys.length !== data.signatures.length) {
            throw new MultiSignatureKeyCountMismatchError();
        }

        const multiSigAddress = Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature);

        const recipientWallet = databaseWalletManager.findByAddress(multiSigAddress);
        if (recipientWallet.multisignature) {
            throw new MultiSignatureAlreadyRegisteredError();
        }

        if (!wallet.verifySignatures(data, data.asset.multiSignature)) {
            throw new InvalidMultiSignatureError();
        }

        return super.canBeApplied(transaction, wallet, databaseWalletManager);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            return false;
        }

        return true;
    }

    protected applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        // Nothing else to do for the sender since the recipient wallet
        // is made into a multi sig wallet.
    }

    protected revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);
        // Nothing else to do for the sender since the recipient wallet
        // is made into a multi sig wallet.
    }

    protected applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const { data }: Interfaces.ITransaction = transaction;

        if (data.version >= 2) {
            walletManager.findByAddress(
                Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature),
            ).multisignature = transaction.data.asset.multiSignature;
        }
    }

    protected revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const { data }: Interfaces.ITransaction = transaction;

        if (data.version >= 2) {
            walletManager.findByAddress(
                Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature),
            ).multisignature = undefined;
        }
    }
}
