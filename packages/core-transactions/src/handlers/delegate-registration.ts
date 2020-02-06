import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import {
    NotSupportedForMultiSignatureWalletError,
    WalletIsAlreadyDelegateError,
    WalletNotADelegateError,
    WalletUsernameAlreadyRegisteredError,
} from "../errors";
import { TransactionReader } from "../transaction-reader";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

const { TransactionType, TransactionTypeGroup } = Enums;

export class DelegateRegistrationTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.DelegateRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [
            "delegate",
            "delegate.lastBlock",
            "delegate.producedBlocks",
            "delegate.rank",
            "delegate.round",
            "delegate.username",
            "delegate.voteBalance",
            "delegate.forgedFees",
            "delegate.forgedRewards",
            "delegate.forgedTotal",
            "delegate.approval",
        ];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const forgedBlocks = await connection.blocksRepository.getDelegatesForgedBlocks();
        const lastForgedBlocks = await connection.blocksRepository.getLastForgedBlocks();

        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                wallet.setAttribute<State.IWalletDelegateAttributes>("delegate", {
                    username: transaction.asset.delegate.username,
                    voteBalance: Utils.BigNumber.ZERO,
                    forgedFees: Utils.BigNumber.ZERO,
                    forgedRewards: Utils.BigNumber.ZERO,
                    producedBlocks: 0,
                    rank: undefined,
                });

                walletManager.reindex(wallet);
            }
        }

        for (const block of forgedBlocks) {
            const wallet: State.IWallet = walletManager.findByPublicKey(block.generatorPublicKey);
            const delegate: State.IWalletDelegateAttributes = wallet.getAttribute("delegate");

            // Genesis wallet is empty
            if (!delegate) {
                continue;
            }

            delegate.forgedFees = delegate.forgedFees.plus(block.totalFees);
            delegate.forgedRewards = delegate.forgedRewards.plus(block.totalRewards);
            delegate.producedBlocks += +block.totalProduced;
        }

        for (const block of lastForgedBlocks) {
            const wallet = walletManager.findByPublicKey(block.generatorPublicKey);

            // Genesis wallet is empty
            if (!wallet.hasAttribute("delegate")) {
                continue;
            }

            wallet.setAttribute("delegate.lastBlock", block);
        }
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        const sender: State.IWallet = walletManager.findByPublicKey(data.senderPublicKey);
        if (sender.hasMultiSignature()) {
            throw new NotSupportedForMultiSignatureWalletError();
        }

        const { username }: { username: string } = data.asset.delegate;
        if (!username) {
            throw new WalletNotADelegateError();
        }

        if (wallet.isDelegate()) {
            throw new WalletIsAlreadyDelegateError();
        }

        if (walletManager.findByUsername(username)) {
            throw new WalletUsernameAlreadyRegisteredError(username);
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(ApplicationEvents.DelegateRegistered, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string; message: string } | null> {
        const err = await this.typeFromSenderAlreadyInPool(data, pool);
        if (err !== null) {
            return err;
        }

        const { username }: { username: string } = data.asset.delegate;
        const delegateRegistrationsSameNameInPayload = processor
            .getTransactions()
            .filter(
                transaction =>
                    transaction.type === TransactionType.DelegateRegistration &&
                    (transaction.typeGroup === undefined || transaction.typeGroup === TransactionTypeGroup.Core) &&
                    transaction.asset.delegate.username === username,
            );

        if (delegateRegistrationsSameNameInPayload.length > 1) {
            return {
                type: "ERR_CONFLICT",
                message: `Multiple delegate registrations for "${username}" in transaction payload`,
            };
        }

        const delegateRegistrationsInPool: Interfaces.ITransactionData[] = Array.from(
            await pool.getTransactionsByType(TransactionType.DelegateRegistration),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);

        const containsDelegateRegistrationForSameNameInPool: boolean = delegateRegistrationsInPool.some(
            transaction => transaction.asset.delegate.username === username,
        );
        if (containsDelegateRegistrationForSameNameInPool) {
            return {
                type: "ERR_PENDING",
                message: `Delegate registration for "${username}" already in the pool`,
            };
        }

        return null;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.setAttribute<State.IWalletDelegateAttributes>("delegate", {
            username: transaction.data.asset.delegate.username,
            voteBalance: Utils.BigNumber.ZERO,
            forgedFees: Utils.BigNumber.ZERO,
            forgedRewards: Utils.BigNumber.ZERO,
            producedBlocks: 0,
            round: 0,
        });

        walletManager.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const username: string = sender.getAttribute("delegate.username");

        walletManager.forgetByUsername(username);
        sender.forgetAttribute("delegate");
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
