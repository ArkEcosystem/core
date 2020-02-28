import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { InsufficientBalanceError } from "../../errors";
import { TransactionReader } from "../../transaction-reader";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

@Container.injectable()
export class MultiPaymentTransactionHandler extends TransactionHandler {
    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.MultiPaymentTransaction;
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            for (const payment of transaction.asset.payments!) {
                const recipient: Contracts.State.Wallet = this.walletRepository.findByAddress(payment.recipientId);
                recipient.balance = recipient.balance.plus(payment.amount);
                sender.balance = sender.balance.minus(payment.amount);
            }
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
        AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

        const payments: Interfaces.IMultiPaymentItem[] = transaction.data.asset.payments;
        const totalPaymentsAmount = payments.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO);

        if (
            wallet.balance
                .minus(totalPaymentsAmount)
                .minus(transaction.data.fee)
                .isNegative()
        ) {
            throw new InsufficientBalanceError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

        const totalPaymentsAmount = transaction.data.asset.payments.reduce(
            (a, p) => a.plus(p.amount),
            Utils.BigNumber.ZERO,
        );

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        sender.balance = sender.balance.minus(totalPaymentsAmount);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

        const totalPaymentsAmount = transaction.data.asset.payments.reduce(
            (a, p) => a.plus(p.amount),
            Utils.BigNumber.ZERO,
        );

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        sender.balance = sender.balance.plus(totalPaymentsAmount);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

        for (const payment of transaction.data.asset.payments) {
            const recipient: Contracts.State.Wallet = walletRepository.findByAddress(payment.recipientId);

            recipient.balance = recipient.balance.plus(payment.amount);
        }
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

        for (const payment of transaction.data.asset.payments) {
            const recipient: Contracts.State.Wallet = walletRepository.findByAddress(payment.recipientId);

            recipient.balance = recipient.balance.minus(payment.amount);
        }
    }
}
