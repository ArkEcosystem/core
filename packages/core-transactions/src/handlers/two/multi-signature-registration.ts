import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Identities, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import {
    InvalidMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
} from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

@Container.injectable()
export class MultiSignatureRegistrationTransactionHandler extends TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["multiSignature"];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.MultiSignatureRegistrationTransaction;
    }

    public async bootstrap(): Promise<void> {
        const criteria = {
            version: this.getConstructor().version,
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(transaction.asset?.multiSignature);

            const multiSignature: Contracts.State.WalletMultiSignatureAttributes = transaction.asset.multiSignature;
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                Identities.PublicKey.fromMultiSignatureAsset(multiSignature),
            );

            if (wallet.hasMultiSignature()) {
                throw new MultiSignatureAlreadyRegisteredError();
            }

            wallet.setAttribute("multiSignature", multiSignature);
            this.walletRepository.index(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(data.asset?.multiSignature);

        const { publicKeys, min } = data.asset.multiSignature;
        if (min < 1 || min > publicKeys.length || min > 16) {
            throw new MultiSignatureMinimumKeysError();
        }

        AppUtils.assert.defined<string[]>(data.signatures);

        if (publicKeys.length !== data.signatures.length) {
            throw new MultiSignatureKeyCountMismatchError();
        }

        AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(data.asset.multiSignature);

        const multiSigPublicKey: string = Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature);
        const recipientWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(multiSigPublicKey);

        if (recipientWallet.hasMultiSignature()) {
            throw new MultiSignatureAlreadyRegisteredError();
        }

        if (!this.verifySignatures(wallet, data, data.asset.multiSignature)) {
            throw new InvalidMultiSignatureError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(transaction.data.asset?.multiSignature);

        const hasSender: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .has();

        if (hasSender) {
            throw new Contracts.TransactionPool.PoolError(
                `Sender ${transaction.data.senderPublicKey} already has a transaction of type '${Enums.TransactionType.MultiSignature}' in the pool`,
                "ERR_PENDING",
            );
        }

        const address = Identities.Address.fromMultiSignatureAsset(transaction.data.asset.multiSignature);
        const hasAddress: boolean = this.poolQuery
            .getAll()
            .whereKind(transaction)
            .wherePredicate(
                (t) =>
                    Identities.Address.fromMultiSignatureAsset(
                        t.data.asset!.multiSignature as Interfaces.IMultiSignatureAsset,
                    ) === address,
            )
            .has();

        if (hasAddress) {
            throw new Contracts.TransactionPool.PoolError(
                `MultiSignatureRegistration for address ${address} already in the pool`,
                "ERR_PENDING",
            );
        }
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);
        // Nothing else to do for the sender since the recipient wallet
        // is made into a multi sig wallet.
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(data.asset?.multiSignature);

        const recipientWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
            Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature),
        );

        recipientWallet.setAttribute("multiSignature", data.asset.multiSignature);
    }

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(data.asset?.multiSignature);

        const recipientWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
            Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature),
        );

        recipientWallet.forgetAttribute("multiSignature");
    }
}
