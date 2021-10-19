import { Container, Contracts, Utils, Enums as AppEnums } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Transactions, Managers } from "@arkecosystem/crypto";

import {
    AlreadyVotedError,
    NoVoteError,
    UnvoteMismatchError,
    VotedForNonDelegateError,
    VotedForResignedDelegateError,
    SwitchVoteDisabledError,
} from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";
import { DelegateRegistrationTransactionHandler } from "./delegate-registration";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
export class VoteTransactionHandler extends TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [DelegateRegistrationTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["vote"];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.One.VoteTransaction;
    }

    public async bootstrap(): Promise<void> {}

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        Utils.assert.defined<string[]>(transaction.data.asset?.votes);

        if (transaction.data.asset.votes.length > 1 && !Managers.configManager.getMilestone().aip37) {
            throw new SwitchVoteDisabledError();
        }

        let walletVote: string | undefined;
        if (wallet.hasAttribute("vote")) {
            walletVote = wallet.getAttribute("vote");
        }

        for (const vote of transaction.data.asset.votes) {
            const delegatePublicKey: string = vote.slice(1);
            const delegateWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(delegatePublicKey);

            if (vote.startsWith("+")) {
                if (walletVote) {
                    throw new AlreadyVotedError();
                }

                if (delegateWallet.hasAttribute("delegate.resigned")) {
                    throw new VotedForResignedDelegateError(vote);
                }

                walletVote = vote.slice(1);
            } else {
                if (!walletVote) {
                    throw new NoVoteError();
                } else if (walletVote !== vote.slice(1)) {
                    throw new UnvoteMismatchError();
                }

                walletVote = undefined;
            }

            if (!delegateWallet.isDelegate()) {
                throw new VotedForNonDelegateError(vote);
            }
        }

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        Utils.assert.defined<string[]>(transaction.data.asset?.votes);

        for (const vote of transaction.data.asset!.votes) {
            emitter.dispatch(vote.startsWith("+") ? AppEnums.VoteEvent.Vote : AppEnums.VoteEvent.Unvote, {
                delegate: vote,
                transaction: transaction.data,
            });
        }
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const hasSender: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .has();

        if (hasSender) {
            throw new Contracts.TransactionPool.PoolError(
                `Sender ${transaction.data.senderPublicKey} already has a transaction of type '${Enums.TransactionType.Vote}' in the pool`,
                "ERR_PENDING",
            );
        }
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        Utils.assert.defined<string[]>(transaction.data.asset?.votes);

        for (const vote of transaction.data.asset.votes) {
            if (vote.startsWith("+")) {
                sender.setAttribute("vote", vote.slice(1));
            } else {
                sender.forgetAttribute("vote");
            }
        }
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        Utils.assert.defined<Interfaces.ITransactionAsset>(transaction.data.asset?.votes);

        for (const vote of transaction.data.asset.votes.slice().reverse()) {
            if (vote.startsWith("+")) {
                sender.forgetAttribute("vote");
            } else {
                sender.setAttribute("vote", vote.slice(1));
            }
        }
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}
