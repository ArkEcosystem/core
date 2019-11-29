import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Identities, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import {
    InvalidMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
} from "../../errors";
import { TransactionReader } from "../../transaction-reader";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

@Container.injectable()
export class MultiSignatureRegistrationTransactionHandler extends TransactionHandler {
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
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const multiSignature: Contracts.State.WalletMultiSignatureAttributes = transaction.asset.multiSignature!;
            const wallet: Contracts.State.Wallet = this.walletRepository.findByAddress(
                Identities.Address.fromMultiSignatureAsset(multiSignature),
            );

            if (wallet.hasMultiSignature()) {
                throw new MultiSignatureAlreadyRegisteredError();
            }

            wallet.setAttribute("multiSignature", multiSignature);
            this.walletRepository.reindex(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
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

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(data.asset.multiSignature);

        const multiSigAddress: string = Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature);
        const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(multiSigAddress);

        if (recipientWallet.hasMultiSignature()) {
            throw new MultiSignatureAlreadyRegisteredError();
        }

        if (!this.verifySignatures(wallet, data, data.asset.multiSignature)) {
            throw new InvalidMultiSignatureError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, customWalletRepository);

        // Create the multi sig wallet
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;
        AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(transaction.data.asset?.multiSignature);

        walletRepository
            .findByAddress(Identities.Address.fromMultiSignatureAsset(transaction.data.asset.multiSignature))
            .setAttribute("multiSignature", transaction.data.asset.multiSignature);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);
        // Nothing else to do for the sender since the recipient wallet
        // is made into a multi sig wallet.
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(data.asset?.multiSignature);

        const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(
            Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature),
        );

        recipientWallet.setAttribute("multiSignature", data.asset.multiSignature);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<Interfaces.IMultiSignatureAsset>(data.asset?.multiSignature);

        const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(
            Identities.Address.fromMultiSignatureAsset(data.asset.multiSignature),
        );

        recipientWallet.forgetAttribute("multiSignature");
    }
}
