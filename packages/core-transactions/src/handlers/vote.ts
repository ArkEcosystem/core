import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import {
    AlreadyVotedError,
    NoVoteError,
    UnvoteMismatchError,
    VotedForNonDelegateError,
    VotedForResignedDelegateError,
} from "../errors";
import { TransactionReader } from "../transaction-reader";
import { DelegateRegistrationTransactionHandler } from "./delegate-registration";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
export class VoteTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.VoteTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [DelegateRegistrationTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["vote"];
    }

    public async bootstrap(
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);

                const vote: string = Utils.assert.defined<string[]>(transaction.asset.votes)[0];

                let walletVote: string | undefined;

                if (wallet.hasAttribute("vote")) {
                    walletVote = wallet.getAttribute("vote");
                }

                if (vote.startsWith("+")) {
                    if (walletVote) {
                        throw new AlreadyVotedError();
                    }
                    wallet.setAttribute("vote", vote.slice(1));
                } else {
                    if (!walletVote) {
                        throw new NoVoteError();
                    } else if (walletVote !== vote.slice(1)) {
                        throw new UnvoteMismatchError();
                    }
                    wallet.forgetAttribute("vote");
                }
            }
        }
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        const vote: string = Utils.assert.defined<string[]>(data.asset!.votes)[0];

        let walletVote: string | undefined;

        if (wallet.hasAttribute("vote")) {
            walletVote = wallet.getAttribute("vote");
        }

        if (vote.startsWith("+")) {
            if (walletVote) {
                throw new AlreadyVotedError();
            }
        } else {
            if (!walletVote) {
                throw new NoVoteError();
            } else if (walletVote !== vote.slice(1)) {
                throw new UnvoteMismatchError();
            }
        }

        const delegatePublicKey: string = vote.slice(1);
        const delegateWallet: Contracts.State.Wallet = databaseWalletRepository.findByPublicKey(delegatePublicKey);

        if (!delegateWallet.isDelegate()) {
            throw new VotedForNonDelegateError(vote);
        }

        if (delegateWallet.hasAttribute("delegate.resigned")) {
            throw new VotedForResignedDelegateError(vote);
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void {
        const vote: string = Utils.assert.defined<string[]>(transaction.data.asset!.votes)[0];

        emitter.dispatch(vote.startsWith("+") ? "wallet.vote" : "wallet.unvote", {
            delegate: vote,
            transaction: transaction.data,
        });
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
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
            Utils.assert.defined(transaction.data.senderPublicKey),
        );

        const vote: string = Utils.assert.defined<string[]>(transaction.data.asset!.votes)[0];

        if (vote.startsWith("+")) {
            sender.setAttribute("vote", vote.slice(1));
        } else {
            sender.forgetAttribute("vote");
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
            Utils.assert.defined(transaction.data.senderPublicKey),
        );

        const vote: string = Utils.assert.defined<string[]>(transaction.data.asset!.votes)[0];

        if (vote.startsWith("+")) {
            sender.forgetAttribute("vote");
        } else {
            sender.setAttribute("vote", vote.slice(1));
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {}
}
