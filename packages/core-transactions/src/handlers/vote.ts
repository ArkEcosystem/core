import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
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

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

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

        const vote: string = data.asset.votes[0];
        const walletVote: string = wallet.getAttribute("vote");

        const delegatePublicKey: string = vote.slice(1);
        const delegateWallet: State.IWallet = walletManager.findByPublicKey(delegatePublicKey);

        if (vote.startsWith("+")) {
            if (walletVote) {
                throw new AlreadyVotedError();
            }

            if (delegateWallet.hasAttribute("delegate.resigned")) {
                throw new VotedForResignedDelegateError(vote);
            }
        } else {
            if (!walletVote) {
                throw new NoVoteError();
            } else if (walletVote !== vote.slice(1)) {
                throw new UnvoteMismatchError();
            }
        }

        if (!delegateWallet.isDelegate()) {
            throw new VotedForNonDelegateError(vote);
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        const vote: string = transaction.data.asset.votes[0];

        emitter.emit(vote.startsWith("+") ? ApplicationEvents.WalletVote : ApplicationEvents.WalletUnvote, {
            delegate: vote,
            transaction: transaction.data,
        });
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string; message: string } | null> {
        return this.typeFromSenderAlreadyInPool(data, pool);
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote: string = transaction.data.asset.votes[0];

        if (vote.startsWith("+")) {
            sender.setAttribute("vote", vote.slice(1));
        } else {
            sender.forgetAttribute("vote");
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote: string = transaction.data.asset.votes[0];

        if (vote.startsWith("+")) {
            sender.forgetAttribute("vote");
        } else {
            sender.setAttribute("vote", vote.slice(1));
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}
}
