import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { MempoolIndexes } from "../../enums";
import {
    BlsPublicKeyAlreadyExists,
    BlsPublicKeyNonDelegateError,
    NotSupportedForMultiSignatureWalletError,
    NotSupportedForSecondSignatureWalletError,
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
            AppUtils.assert.defined<string>(transaction.asset?.blsPublicKey);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            wallet.setAttribute("blsPublicKey", transaction.asset.blsPublicKey);
            this.walletRepository.index(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        AppUtils.assert.defined<string>(data.asset?.blsPublicKey);
        AppUtils.assert.defined<string>(data.senderPublicKey);

        if (this.mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKeys).has(data.asset.blsPublicKey)) {
            throw new Contracts.TransactionPool.PoolError(
                `BLS Public Key "${data.asset.blsPublicKey}" already in the pool`,
                "ERR_PENDING",
            );
        }
    }

    public async getInvalidPoolTransactions(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]> {
        AppUtils.assert.defined<string>(transaction.data.asset?.blsPublicKey);

        const blsPublicKeyIndex = this.mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKeys);

        return blsPublicKeyIndex.has(transaction.data.asset.blsPublicKey)
            ? [blsPublicKeyIndex.get(transaction.data.asset.blsPublicKey)]
            : [];
    }

    public async onPoolEnter(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.asset?.blsPublicKey);

        this.mempoolIndexRegistry
            .get(MempoolIndexes.BlsPublicKeys)
            .set(transaction.data.asset.blsPublicKey, transaction);
    }

    public async onPoolLeave(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.asset?.blsPublicKey);

        this.mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKeys).forget(transaction.data.asset.blsPublicKey);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        if (Utils.isException(transaction.data)) {
            return;
        }

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(transaction.data.asset?.blsPublicKey);

        if (wallet.hasMultiSignature()) {
            throw new NotSupportedForMultiSignatureWalletError();
        }

        if (wallet.hasSecondSignature()) {
            throw new NotSupportedForSecondSignatureWalletError();
        }

        if (!wallet.isDelegate()) {
            throw new BlsPublicKeyNonDelegateError();
        }

        if (
            this.walletRepository.hasByIndex(
                Contracts.State.WalletIndexes.BlsPublicKeys,
                transaction.data.asset.blsPublicKey,
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

        AppUtils.assert.defined<string>(transaction.data.asset?.blsPublicKey);

        sender.setAttribute("blsPublicKey", transaction.data.asset.blsPublicKey);

        this.walletRepository.index(sender);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        AppUtils.assert.defined<Interfaces.ITransactionAsset>(transaction.data.asset?.blsPublicKey);

        sender.forgetAttribute("blsPublicKey");

        this.walletRepository.index(sender);
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}
