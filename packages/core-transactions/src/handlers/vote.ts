import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
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

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
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

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
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
        const delegateWallet: State.IWallet = databaseWalletManager.findByPublicKey(delegatePublicKey);

        if (!delegateWallet.isDelegate()) {
            throw new VotedForNonDelegateError(vote);
        }

        if (delegateWallet.hasAttribute("delegate.resigned")) {
            throw new VotedForResignedDelegateError(vote);
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        const vote: string = transaction.data.asset.votes[0];

        emitter.emit(vote.startsWith("+") ? "wallet.vote" : "wallet.unvote", {
            delegate: vote,
            transaction: transaction.data,
        });
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            return false;
        }

        return true;
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote: string = transaction.data.asset.votes[0];

        if (vote.startsWith("+")) {
            sender.setAttribute("vote", vote.slice(1));
        } else {
            sender.forgetAttribute("vote");
        }
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote: string = transaction.data.asset.votes[0];

        if (vote.startsWith("+")) {
            sender.forgetAttribute("vote");
        } else {
            sender.setAttribute("vote", vote.slice(1));
        }
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
