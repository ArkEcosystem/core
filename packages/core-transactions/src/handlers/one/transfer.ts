import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { isRecipientOnActiveNetwork } from "../../utils";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
export class TransferTransactionHandler extends TransactionHandler {
    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.One.TransferTransaction;
    }

    public async bootstrap(): Promise<void> {
        return;
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        return super.throwIfCannotBeApplied(transaction, sender, customWalletRepository);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        Utils.assert.defined<string>(data.recipientId);

        const recipientId: string = data.recipientId;

        if (!isRecipientOnActiveNetwork(recipientId)) {
            processor.pushError(
                data,
                "ERR_INVALID_RECIPIENT",
                `Recipient ${data.recipientId} is not on the same network: ${Managers.configManager.get(
                    "network.pubKeyHash",
                )}`,
            );
            return false;
        }

        return true;
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.recipientId);

        const recipient: Contracts.State.Wallet = walletRepository.findByAddress(transaction.data.recipientId);

        recipient.balance = recipient.balance.plus(transaction.data.amount);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.recipientId);

        const recipient: Contracts.State.Wallet = walletRepository.findByAddress(transaction.data.recipientId);

        recipient.balance = recipient.balance.minus(transaction.data.amount);
    }
}
