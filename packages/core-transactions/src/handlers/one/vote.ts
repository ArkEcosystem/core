import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Transactions } from "@arkecosystem/crypto";

import {
    AlreadyVotedError,
    NoVoteError,
    UnvoteMismatchError,
    VotedForNonDelegateError,
    VotedForResignedDelegateError,
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

    public async bootstrap(): Promise<void> {
        return;
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        Utils.assert.defined<string[]>(transaction.data.asset?.votes);

        const vote: string = transaction.data.asset.votes[0];
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        let walletVote: string | undefined;

        const delegatePublicKey: string = vote.slice(1);
        const delegateWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(delegatePublicKey);

        if (wallet.hasAttribute("vote")) {
            walletVote = wallet.getAttribute("vote");
        }

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

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        Utils.assert.defined<string[]>(transaction.data.asset?.votes);

        const vote: string = transaction.data.asset.votes[0];

        emitter.dispatch(vote.startsWith("+") ? "wallet.vote" : "wallet.unvote", {
            delegate: vote,
            transaction: transaction.data,
        });
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
                transaction,
            );
        }
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        Utils.assert.defined<string[]>(transaction.data.asset?.votes);

        const vote: string = transaction.data.asset.votes[0];

        if (vote.startsWith("+")) {
            sender.setAttribute("vote", vote.slice(1));
        } else {
            sender.forgetAttribute("vote");
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        Utils.assert.defined<Interfaces.ITransactionAsset>(transaction.data.asset?.votes);

        const vote: string = transaction.data.asset.votes[0];

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
