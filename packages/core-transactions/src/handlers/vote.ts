import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { AlreadyVotedError, NoVoteError, UnvoteMismatchError, VotedForNonDelegateError } from "../errors";
import { TransactionHandler } from "./transaction";

export class VoteTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.VoteTransaction;
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        databaseWalletManager: Database.IWalletManager,
    ): boolean {
        const { data }: Interfaces.ITransaction = transaction;
        const vote: string = data.asset.votes[0];

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

        if (!databaseWalletManager.isDelegate(vote.slice(1))) {
            throw new VotedForNonDelegateError(vote);
        }

        return super.canBeApplied(transaction, wallet, databaseWalletManager);
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

    protected applyToSender(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const sender: Database.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote: string = transaction.data.asset.votes[0];

        if (vote.startsWith("+")) {
            sender.vote = vote.slice(1);
        } else {
            sender.vote = undefined;
        }
    }

    protected revertForSender(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote: string = transaction.data.asset.votes[0];

        if (vote.startsWith("+")) {
            sender.vote = undefined;
        } else {
            sender.vote = vote.slice(1);
        }
    }

    protected applyToRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        return;
    }

    protected revertForRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        return;
    }
}
