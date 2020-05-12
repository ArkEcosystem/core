import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

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

    public getConstructor(): Transactions.TransactionConstructor<BlockInterfaces.IBlockData> {
        return Transactions.One.TransferTransaction;
    }

    public async bootstrap(): Promise<void> {}

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

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        Utils.assert.defined<string>(transaction.data.recipientId);
        const recipientId: string = transaction.data.recipientId;

        if (!isRecipientOnActiveNetwork(recipientId, this.cryptoManager)) {
            const network: string = this.cryptoManager.NetworkConfigManager.get<string>("network.pubKeyHash");
            throw new Contracts.TransactionPool.PoolError(
                `Recipient ${recipientId} is not on the same network: ${network} `,
                "ERR_INVALID_RECIPIENT",
                transaction,
            );
        }
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
