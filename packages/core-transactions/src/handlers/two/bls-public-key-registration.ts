import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { MempoolIndexes } from "../../enums";
import {
    BlsPublicKeyAlreadyExists,
    BlsPublicKeyIsMissing,
    BlsPublicKeyMismatch,
    BlsPublicKeyNonDelegateError,
    WalletAlreadyResignedError,
} from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

@Container.injectable()
export class BlsPublicKeyRegistrationTransactionHandler extends TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolMempoolIndexRegistry)
    private readonly mempoolIndexRegistry!: Contracts.TransactionPool.MempoolIndexRegistry;

    @Container.inject(Container.Identifiers.TransactionHistoryService)
    @Container.tagged("connection", "default")
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["blsPublicKey"];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.BlsPublicKeyRegistrationTransaction;
    }

    public async bootstrap(): Promise<void> {
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<Interfaces.IBlsPublicKeyAsset>(transaction.asset?.blsPublicKey);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            // Remove old BLS public key if it exists
            if (transaction.asset.blsPublicKey.oldBlsPublicKey) {
                this.walletRepository.forgetOnIndex(
                    Contracts.State.WalletIndexes.BlsPublicKeys,
                    transaction.asset.blsPublicKey.oldBlsPublicKey,
                );
            }

            // Set new BLS public key
            wallet.setAttribute("blsPublicKey", transaction.asset.blsPublicKey.newBlsPublicKey);
            this.walletRepository.setOnIndex(
                Contracts.State.WalletIndexes.BlsPublicKeys,
                transaction.asset.blsPublicKey.newBlsPublicKey,
                wallet,
            );
        }
    }

    public async isActivated(): Promise<boolean> {
        // TODO: Add custom logic
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        AppUtils.assert.defined<Interfaces.IBlsPublicKeyAsset>(data.asset?.blsPublicKey);
        AppUtils.assert.defined<string>(data.senderPublicKey);

        if (this.mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKey).has(data.asset.blsPublicKey.newBlsPublicKey)) {
            throw new Contracts.TransactionPool.PoolError(
                `BLS Public Key "${data.asset.blsPublicKey.newBlsPublicKey}" already in the pool`,
                "ERR_PENDING",
            );
        }
    }

    public async getInvalidPoolTransactions(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]> {
        AppUtils.assert.defined<Interfaces.IBlsPublicKeyAsset>(transaction.data.asset?.blsPublicKey);

        const blsPublicKeyIndex = this.mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKey);

        return blsPublicKeyIndex.has(transaction.data.asset.blsPublicKey.newBlsPublicKey)
            ? [blsPublicKeyIndex.get(transaction.data.asset.blsPublicKey.newBlsPublicKey)]
            : [];
    }

    public async onPoolEnter(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<Interfaces.IBlsPublicKeyAsset>(transaction.data.asset?.blsPublicKey);

        this.mempoolIndexRegistry
            .get(MempoolIndexes.BlsPublicKey)
            .set(transaction.data.asset.blsPublicKey.newBlsPublicKey, transaction);
    }

    public async onPoolLeave(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<Interfaces.IBlsPublicKeyAsset>(transaction.data.asset?.blsPublicKey);

        this.mempoolIndexRegistry
            .get(MempoolIndexes.BlsPublicKey)
            .forget(transaction.data.asset.blsPublicKey.newBlsPublicKey);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        if (Utils.isException(transaction.data)) {
            return;
        }

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<Interfaces.IBlsPublicKeyAsset>(transaction.data.asset?.blsPublicKey);

        if (!wallet.isDelegate()) {
            throw new BlsPublicKeyNonDelegateError();
        }

        if (wallet.hasAttribute("delegate.resigned")) {
            throw new WalletAlreadyResignedError();
        }

        // Check if old BLS public key matches delegate's BLS public key
        if (transaction.data.asset.blsPublicKey.oldBlsPublicKey) {
            if (!wallet.hasAttribute("blsPublicKey")) {
                throw new BlsPublicKeyIsMissing();
            }

            if (transaction.data.asset.blsPublicKey.oldBlsPublicKey !== wallet.getAttribute("blsPublicKey")) {
                throw new BlsPublicKeyMismatch();
            }
        } else {
            if (wallet.hasAttribute("blsPublicKey")) {
                throw new BlsPublicKeyMismatch();
            }
        }

        // Prevent duplicate BLS public key registration
        if (
            this.walletRepository.hasByIndex(
                Contracts.State.WalletIndexes.BlsPublicKeys,
                transaction.data.asset.blsPublicKey.newBlsPublicKey,
            )
        ) {
            throw new BlsPublicKeyAlreadyExists();
        }

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        AppUtils.assert.defined<Interfaces.IBlsPublicKeyAsset>(transaction.data.asset?.blsPublicKey);

        // Remove old BLS public key if it exists
        if (transaction.data.asset.blsPublicKey.oldBlsPublicKey) {
            this.walletRepository.forgetOnIndex(
                Contracts.State.WalletIndexes.BlsPublicKeys,
                transaction.data.asset.blsPublicKey.oldBlsPublicKey,
            );
        }

        // Set new BLS public key
        sender.setAttribute("blsPublicKey", transaction.data.asset.blsPublicKey.newBlsPublicKey);
        this.walletRepository.setOnIndex(
            Contracts.State.WalletIndexes.BlsPublicKeys,
            transaction.data.asset.blsPublicKey.newBlsPublicKey,
            sender,
        );
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<Interfaces.IBlsPublicKeyAsset>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        AppUtils.assert.defined<Interfaces.ITransactionAsset>(transaction.data.asset?.blsPublicKey);

        sender.forgetAttribute("blsPublicKey");
        this.walletRepository.forgetOnIndex(
            Contracts.State.WalletIndexes.BlsPublicKeys,
            transaction.data.asset.blsPublicKey.newBlsPublicKey,
        );

        // Set back old BLS public key if exists
        if (transaction.data.asset.blsPublicKey.oldBlsPublicKey) {
            sender.setAttribute("blsPublicKey", transaction.data.asset.blsPublicKey.oldBlsPublicKey);

            this.walletRepository.setOnIndex(
                Contracts.State.WalletIndexes.BlsPublicKeys,
                transaction.data.asset.blsPublicKey.oldBlsPublicKey,
                sender,
            );
        }
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}
