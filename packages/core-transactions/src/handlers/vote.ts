import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { ITransactionData, Transaction, TransactionConstructor, VoteTransaction } from "@arkecosystem/crypto";
import { AlreadyVotedError, NoVoteError, UnvoteMismatchError, VotedForNonDelegateError } from "../errors";
import { TransactionHandler } from "./transaction";

export class VoteTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return VoteTransaction;
    }

    public canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        const { data } = transaction;
        const vote = data.asset.votes[0];
        if (vote.startsWith("+")) {
            if (wallet.vote) {
                throw new AlreadyVotedError();
            }
        } else {
            if (!wallet.vote) {
                throw new NoVoteError();
            } else if (wallet.vote !== vote.slice(1)) {
                throw new UnvoteMismatchError();
            }
        }

        if (walletManager) {
            if (!walletManager.isDelegate(vote.slice(1))) {
                throw new VotedForNonDelegateError(vote);
            }
        }

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        const vote = data.asset.votes[0];
        if (vote.startsWith("+")) {
            wallet.vote = vote.slice(1);
        } else {
            wallet.vote = null;
        }
    }

    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        const vote = data.asset.votes[0];
        if (vote.startsWith("+")) {
            wallet.vote = null;
        } else {
            wallet.vote = vote.slice(1);
        }
    }

    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {
        const vote = transaction.data.asset.votes[0];

        emitter.emit(vote.startsWith("+") ? "wallet.vote" : "wallet.unvote", {
            delegate: vote,
            transaction: transaction.data,
        });
    }

    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.ITransactionGuard): boolean {
        return !this.typeFromSenderAlreadyInPool(data, guard);
    }
}
