import { Container, Contracts } from "@arkecosystem/core-kernel";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";
import { Transactions, Interfaces, Utils } from "@arkecosystem/crypto";
import { TransactionReader } from "../../transaction-reader";
import { Models } from "@arkecosystem/core-database";
import { MultiSignatureAlreadyRegisteredError, LegacyMultiSignatureError } from "../../errors";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
export class MultiSignatureRegistrationTransactionHandler extends TransactionHandler {
    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["multiSignature"];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.One.MultiSignatureRegistrationTransaction;
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const multiSignature: Contracts.State.WalletMultiSignatureAttributes = transaction.asset.multisignature || transaction.asset.multiSignatureLegacy;
            multiSignature.legacy = true;

            if (wallet.hasMultiSignature()) {
                throw new MultiSignatureAlreadyRegisteredError();
            }

            wallet.setAttribute("multiSignature", multiSignature);
            this.walletRepository.reindex(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return false;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        if (Utils.isException(data.id)) {
            return;
        }

        throw new LegacyMultiSignatureError();
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        return false;
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction, customWalletRepository?: Contracts.State.WalletRepository | undefined): Promise<void> {
        return;
    }

    public async revertForRecipient(transaction: Interfaces.ITransaction, customWalletRepository?: Contracts.State.WalletRepository | undefined): Promise<void> {
        return;
    }
}
