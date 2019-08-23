import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import {
    AlreadyVotedError,
    NoVoteError,
    UnvoteMismatchError,
    VotedForNonDelegateError,
    VotedForResignedDelegateError,
} from "../errors";
import { DelegateRegistrationTransactionHandler } from "./delegate-registration";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

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
        connection: Contracts.Database.IConnection,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);

        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const vote = transaction.asset.votes[0];
            const walletVote: string = wallet.getAttribute("vote");

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

        walletManager.buildVoteBalances();
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.IWallet,
        databaseWalletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;
        const vote: string = data.asset.votes[0];
        const walletVote: string = wallet.getAttribute("vote");

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
        const delegateWallet: Contracts.State.IWallet = databaseWalletManager.findByPublicKey(delegatePublicKey);

        if (!delegateWallet.isDelegate()) {
            throw new VotedForNonDelegateError(vote);
        }

        if (delegateWallet.hasAttribute("delegate.resigned")) {
            throw new VotedForResignedDelegateError(vote);
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.IEventDispatcher): void {
        const vote: string = transaction.data.asset.votes[0];

        emitter.dispatch(vote.startsWith("+") ? "wallet.vote" : "wallet.unvote", {
            delegate: vote,
            transaction: transaction.data,
        });
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.IConnection,
        processor: Contracts.TransactionPool.IProcessor,
    ): Promise<boolean> {
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const sender: Contracts.State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote: string = transaction.data.asset.votes[0];

        if (vote.startsWith("+")) {
            sender.setAttribute("vote", vote.slice(1));
        } else {
            sender.forgetAttribute("vote");
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const sender: Contracts.State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote: string = transaction.data.asset.votes[0];

        if (vote.startsWith("+")) {
            sender.forgetAttribute("vote");
        } else {
            sender.setAttribute("vote", vote.slice(1));
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}
}
