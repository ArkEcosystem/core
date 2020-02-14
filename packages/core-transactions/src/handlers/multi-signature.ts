import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import {
    InvalidMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
} from "../errors";
import { TransactionReader } from "../transaction-reader";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

export class MultiSignatureTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.MultiSignatureRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["multiSignature"];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                let wallet: State.IWallet;
                let multiSignature: State.IWalletMultiSignatureAttributes;

                if (transaction.version === 1) {
                    multiSignature = transaction.asset.multisignature || transaction.asset.multiSignatureLegacy;
                    wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                    multiSignature.legacy = true;
                } else {
                    multiSignature = transaction.asset.multiSignature;
                    wallet = walletManager.findByPublicKey(
                        Identities.PublicKey.fromMultiSignatureAsset(multiSignature),
                    );
                }
                if (wallet.hasMultiSignature()) {
                    throw new MultiSignatureAlreadyRegisteredError();
                }

                wallet.setAttribute("multiSignature", multiSignature);
                walletManager.reindex(wallet);
            }
        }
    }

    // Technically, we only enable `MultiSignatureRegistration` when the `aip11` milestone is active,
    // but since there are no versioned transaction types yet we have to do it differently, to not break
    // existing legacy multi signatures. TODO: becomes obsolete with 3.0
    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
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

        const multiSigPublicKey: string = Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature);
        const recipientWallet: State.IWallet = walletManager.findByPublicKey(multiSigPublicKey);

        if (recipientWallet.hasMultiSignature()) {
            throw new MultiSignatureAlreadyRegisteredError();
        }

        if (!wallet.verifySignatures(data, data.asset.multiSignature)) {
            throw new InvalidMultiSignatureError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string; message: string } | null> {
        return this.typeFromSenderAlreadyInPool(data, pool);
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        // Create the multi sig wallet
        if (transaction.data.version >= 2) {
            walletManager
                .findByPublicKey(Identities.PublicKey.fromMultiSignatureAsset(transaction.data.asset.multiSignature))
                .setAttribute("multiSignature", transaction.data.asset.multiSignature);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        // Nothing else to do for the sender since the recipient wallet
        // is made into a multi sig wallet.
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        if (data.version >= 2) {
            const recipientWallet: State.IWallet = walletManager.findByPublicKey(
                Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature),
            );
            recipientWallet.setAttribute("multiSignature", transaction.data.asset.multiSignature);
        }
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        if (data.version >= 2) {
            const recipientWallet: State.IWallet = walletManager.findByPublicKey(
                Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature),
            );

            recipientWallet.forgetAttribute("multiSignature");
        }
    }
}
