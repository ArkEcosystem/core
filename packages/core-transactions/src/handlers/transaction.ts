import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";

import {
    ColdWalletError,
    InsufficientBalanceError,
    InvalidMultiSignaturesError,
    InvalidSecondSignatureError,
    LegacyMultiSignatureError,
    LegacyMultiSignatureRegistrationError,
    MissingMultiSignatureOnSenderError,
    SenderWalletMismatchError,
    UnexpectedNonceError,
    UnexpectedSecondSignatureError,
    UnsupportedMultiSignatureTransactionError,
} from "../errors";

// todo: revisit the implementation, container usage and arguments after core-database rework
@Container.injectable()
export abstract class TransactionHandler {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    protected readonly blockRepository!: Repositories.BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionRepository)
    protected readonly transactionRepository!: Repositories.TransactionRepository;

    @Container.inject(Container.Identifiers.WalletRepository)
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.LogService)
    protected readonly logger!: Contracts.Kernel.Logger;

    public async verify(transaction: Interfaces.ITransaction): Promise<boolean> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
            transaction.data.senderPublicKey,
        );

        if (senderWallet.hasMultiSignature()) {
            transaction.isVerified = this.verifySignatures(senderWallet, transaction.data);
        }

        return transaction.isVerified;
    }

    public dynamicFee({
        addonBytes,
        satoshiPerByte,
        transaction,
    }: Contracts.Shared.DynamicFeeContext): Utils.BigNumber {
        addonBytes = addonBytes || 0;

        if (satoshiPerByte <= 0) {
            satoshiPerByte = 1;
        }

        const transactionSizeInBytes: number = Math.round(transaction.serialized.length / 2);
        return Utils.BigNumber.make(addonBytes + transactionSizeInBytes).times(satoshiPerByte);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        const senderWallet: Contracts.State.Wallet = this.walletRepository.findByAddress(sender.getAddress());

        AppUtils.assert.defined<string>(sender.getPublicKey());

        if (!this.walletRepository.hasByPublicKey(sender.getPublicKey()!) && senderWallet.getBalance().isZero()) {
            throw new ColdWalletError();
        }

        return this.performGenericWalletChecks(transaction, sender);
    }

    public async apply(transaction: Interfaces.ITransaction): Promise<void> {
        await this.applyToSender(transaction);
        await this.applyToRecipient(transaction);
    }

    public async revert(transaction: Interfaces.ITransaction): Promise<void> {
        await this.revertForSender(transaction);
        await this.revertForRecipient(transaction);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            this.logger.warning(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }

        await this.throwIfCannotBeApplied(transaction, sender);

        // TODO: extract version specific code
        if (data.version && data.version > 1) {
            this.verifyTransactionNonceApply(sender, transaction);

            AppUtils.assert.defined<AppUtils.BigNumber>(data.nonce);

            sender.setNonce(data.nonce);
        } else {
            sender.increaseNonce();
        }

        const newBalance: Utils.BigNumber = sender.getBalance().minus(data.amount).minus(data.fee);

        assert(Utils.isException(transaction.data) || !newBalance.isNegative());

        // negativeBalanceExceptions check is never executed, because performGenericWalletChecks already checks balance
        // if (process.env.CORE_ENV === "test") {
        //     assert(Utils.isException(transaction.data.id) || !newBalance.isNegative());
        // } else {
        //     if (newBalance.isNegative()) {
        //         const negativeBalanceExceptions: Record<string, Record<string, string>> =
        //             Managers.configManager.get("exceptions.negativeBalances") || {};
        //
        //         AppUtils.assert.defined<string>(sender.publicKey);
        //
        //         const negativeBalances: Record<string, string> = negativeBalanceExceptions[sender.publicKey] || {};
        //
        //         if (!newBalance.isEqualTo(negativeBalances[sender.nonce.toString()] || 0)) {
        //             throw new InsufficientBalanceError();
        //         }
        //     }
        // }

        sender.setBalance(newBalance);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const data: Interfaces.ITransactionData = transaction.data;

        sender.increaseBalance(data.amount.plus(data.fee));

        // TODO: extract version specific code
        this.verifyTransactionNonceRevert(sender, transaction);

        sender.decreaseNonce();
    }

    /**
     * Database Service
     */
    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {}

    /**
     * Transaction Pool logic
     */
    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {}

    /**
     * @param {Contracts.State.Wallet} wallet
     * @param {Interfaces.ITransactionData} transaction
     * @param {Interfaces.IMultiSignatureAsset} [multiSignature]
     * @returns {boolean}
     * @memberof TransactionHandler
     */
    public verifySignatures(
        wallet: Contracts.State.Wallet,
        transaction: Interfaces.ITransactionData,
        multiSignature?: Interfaces.IMultiSignatureAsset,
    ): boolean {
        return Transactions.Verifier.verifySignatures(
            transaction,
            multiSignature || wallet.getAttribute("multiSignature"),
        );
    }

    protected async performGenericWalletChecks(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            return;
        }

        this.verifyTransactionNonceApply(sender, transaction);

        if (sender.getBalance().minus(data.amount).minus(data.fee).isNegative()) {
            throw new InsufficientBalanceError();
        }

        if (data.senderPublicKey !== sender.getPublicKey()) {
            throw new SenderWalletMismatchError();
        }

        if (sender.hasSecondSignature()) {
            AppUtils.assert.defined<string>(data.senderPublicKey);

            // Ensure the database wallet already has a 2nd signature, in case we checked a pool wallet.
            const dbSender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(data.senderPublicKey);

            if (!dbSender.hasSecondSignature()) {
                throw new UnexpectedSecondSignatureError();
            }

            if (!Transactions.Verifier.verifySecondSignature(data, dbSender.getAttribute("secondPublicKey"))) {
                throw new InvalidSecondSignatureError();
            }
        } else if (data.secondSignature || data.signSignature) {
            const isException =
                Managers.configManager.get("network.name") === "devnet" &&
                Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField;
            if (!isException) {
                throw new UnexpectedSecondSignatureError();
            }
        }

        // Prevent legacy multi signatures from being used
        const isMultiSignatureRegistration: boolean =
            transaction.type === Enums.TransactionType.MultiSignature &&
            transaction.typeGroup === Enums.TransactionTypeGroup.Core;
        if (isMultiSignatureRegistration && !Managers.configManager.getMilestone().aip11) {
            throw new LegacyMultiSignatureRegistrationError();
        }

        if (sender.hasMultiSignature()) {
            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

            // Ensure the database wallet already has a multi signature, in case we checked a pool wallet.
            const dbSender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                transaction.data.senderPublicKey,
            );

            if (!dbSender.hasMultiSignature()) {
                throw new MissingMultiSignatureOnSenderError();
            }

            if (dbSender.hasAttribute("multiSignature.legacy")) {
                throw new LegacyMultiSignatureError();
            }

            if (!this.verifySignatures(dbSender, data, dbSender.getAttribute("multiSignature"))) {
                throw new InvalidMultiSignaturesError();
            }
        } else if (transaction.data.signatures && !isMultiSignatureRegistration) {
            throw new UnsupportedMultiSignatureTransactionError();
        }
    }

    /**
     * Verify that the transaction's nonce is the wallet nonce plus one, so that the
     * transaction can be applied to the wallet. Throw an exception if it is not.
     *
     * @param {Interfaces.ITransaction} transaction
     * @memberof Wallet
     */
    protected verifyTransactionNonceApply(wallet: Contracts.State.Wallet, transaction: Interfaces.ITransaction): void {
        const version: number = transaction.data.version || 1;
        const nonce: AppUtils.BigNumber = transaction.data.nonce || AppUtils.BigNumber.ZERO;

        if (version > 1 && !wallet.getNonce().plus(1).isEqualTo(nonce)) {
            throw new UnexpectedNonceError(nonce, wallet, false);
        }
    }

    /**
     * Verify that the transaction's nonce is the same as the wallet nonce, so that the
     * transaction can be reverted from the wallet. Throw an exception if it is not.
     *
     * @param wallet
     * @param {Interfaces.ITransaction} transaction
     * @memberof Wallet
     */
    protected verifyTransactionNonceRevert(wallet: Contracts.State.Wallet, transaction: Interfaces.ITransaction): void {
        const version: number = transaction.data.version || 1;
        const nonce: AppUtils.BigNumber = transaction.data.nonce || AppUtils.BigNumber.ZERO;

        if (version > 1 && !wallet.getNonce().isEqualTo(nonce)) {
            throw new UnexpectedNonceError(nonce, wallet, true);
        }
    }

    public abstract getConstructor(): Transactions.TransactionConstructor;

    public abstract dependencies(): ReadonlyArray<TransactionHandlerConstructor>;

    public abstract walletAttributes(): ReadonlyArray<string>;

    public abstract isActivated(): Promise<boolean>;

    /**
     * Wallet logic
     */

    public abstract bootstrap(): Promise<void>;

    public abstract applyToRecipient(transaction: Interfaces.ITransaction): Promise<void>;

    public abstract revertForRecipient(transaction: Interfaces.ITransaction): Promise<void>;
}

export type TransactionHandlerConstructor = new () => TransactionHandler;
