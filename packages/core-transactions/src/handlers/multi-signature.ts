import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
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

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);

        for (const transaction of transactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            if (!wallet.hasMultiSignature()) {
                let multiSignature: State.IWalletMultiSignatureAttributes;
                if (transaction.version === 1) {
                    multiSignature = transaction.asset.multisignature || transaction.asset.multiSignatureLegacy;
                } else {
                    multiSignature = transaction.asset.multiSignature;
                }

                wallet.setAttribute("multiSignature", multiSignature);
            }
        }
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        const { data }: Interfaces.ITransaction = transaction;

        if (Utils.isException(data)) {
            return;
        }

        const { publicKeys, min } = data.asset.multiSignature;
        if (min < 1 || min > publicKeys.length || min > 16) {
            throw new MultiSignatureMinimumKeysError();
        }

        if (publicKeys.length !== data.signatures.length) {
            throw new MultiSignatureKeyCountMismatchError();
        }

        const multiSigAddress: string = Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature);
        const recipientWallet: State.IWallet = databaseWalletManager.findByAddress(multiSigAddress);

        if (recipientWallet.hasMultiSignature()) {
            throw new MultiSignatureAlreadyRegisteredError();
        }

        if (!wallet.verifySignatures(data, data.asset.multiSignature)) {
            throw new InvalidMultiSignatureError();
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
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

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        // Create the multi sig wallet
        if (transaction.data.version >= 2) {
            walletManager
                .findByAddress(Identities.Address.fromMultiSignatureAsset(transaction.data.asset.multiSignature))
                .setAttribute("multiSignature", transaction.data.asset.multiSignature);
        }
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);
        // Nothing else to do for the sender since the recipient wallet
        // is made into a multi sig wallet.
    }

    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const { data }: Interfaces.ITransaction = transaction;

        if (data.version >= 2) {
            const recipientWallet: State.IWallet = walletManager.findByAddress(
                Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature),
            );
            recipientWallet.setAttribute("multiSignature", transaction.data.asset.multiSignature);
        }
    }

    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const { data }: Interfaces.ITransaction = transaction;

        if (data.version >= 2) {
            const recipientWallet: State.IWallet = walletManager.findByAddress(
                Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature),
            );

            recipientWallet.forgetAttribute("multiSignature");
        }
    }
}
