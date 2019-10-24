import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers, Interfaces as TransactionInterfaces } from "@arkecosystem/core-transactions";
import { Enums, Identities, Interfaces, Utils } from "@arkecosystem/crypto";

// todo: review the implementation and make use of ioc
@Container.injectable()
export class BlockState {
    private walletRepository: Contracts.State.WalletRepository;

    // todo: remove the need for this method
    public init(walletRepository: Contracts.State.WalletRepository): this {
        this.walletRepository = walletRepository;

        return this;
    }

    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        const generatorPublicKey: string = block.data.generatorPublicKey;

        let delegate: Contracts.State.Wallet;
        if (!this.walletRepository.has(generatorPublicKey)) {
            const generator: string = Identities.Address.fromPublicKey(generatorPublicKey);

            if (block.data.height === 1) {
                delegate = new Wallets.Wallet(generator);
                delegate.publicKey = generatorPublicKey;

                this.walletRepository.reindex(delegate);
            } else {
                app.terminate(`Failed to lookup generator '${generatorPublicKey}' of block '${block.data.id}'.`);
            }
        } else {
            delegate = this.walletRepository.findByPublicKey(block.data.generatorPublicKey);
        }

        const appliedTransactions: Interfaces.ITransaction[] = [];

        try {
            for (const transaction of block.transactions) {
                await this.applyTransaction(transaction);
                appliedTransactions.push(transaction);
            }

            const applied: boolean = delegate.applyBlock(block.data);

            // If the block has been applied to the delegate, the balance is increased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (applied && delegate.hasVoted()) {
                const increase: Utils.BigNumber = block.data.reward.plus(block.data.totalFee);
                const votedDelegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                    delegate.getAttribute<string>("vote"),
                );
                const voteBalance: Utils.BigNumber = votedDelegate.getAttribute("delegate.voteBalance");
                votedDelegate.setAttribute("delegate.voteBalance", voteBalance.plus(increase));
            }
        } catch (error) {
            app.log.error("Failed to apply all transactions in block - reverting previous transactions");

            // Revert the applied transactions from last to first
            for (const transaction of appliedTransactions.reverse()) {
                await this.revertTransaction(transaction);
            }

            throw error;
        }
    }

    public async revertBlock(block: Interfaces.IBlock): Promise<void> {
        if (!this.walletRepository.has(block.data.generatorPublicKey)) {
            app.terminate(`Failed to lookup generator '${block.data.generatorPublicKey}' of block '${block.data.id}'.`);
        }

        const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(block.data.generatorPublicKey);
        const revertedTransactions: Interfaces.ITransaction[] = [];

        try {
            // Revert the transactions from last to first
            for (let i = block.transactions.length - 1; i >= 0; i--) {
                const transaction: Interfaces.ITransaction = block.transactions[i];
                await this.revertTransaction(transaction);
                revertedTransactions.push(transaction);
            }

            const reverted: boolean = delegate.revertBlock(block.data);

            // If the block has been reverted, the balance is decreased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (reverted && delegate.hasVoted()) {
                const decrease: Utils.BigNumber = block.data.reward.plus(block.data.totalFee);
                const votedDelegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                    delegate.getAttribute<string>("vote"),
                );
                const voteBalance: Utils.BigNumber = votedDelegate.getAttribute("delegate.voteBalance");
                votedDelegate.setAttribute("delegate.voteBalance", voteBalance.minus(decrease));
            }
        } catch (error) {
            app.log.error(error.stack);

            for (const transaction of revertedTransactions.reverse()) {
                await this.applyTransaction(transaction);
            }

            throw error;
        }
    }

    public async applyTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        const transactionHandler: Handlers.TransactionHandler = await app
            .get<any>("transactionHandlerRegistry")
            .get(transaction.type, transaction.typeGroup);

        let lockWallet: Contracts.State.Wallet;
        let lockTransaction: Interfaces.ITransactionData;
        if (
            transaction.type === Enums.TransactionType.HtlcClaim &&
            transaction.typeGroup === Enums.TransactionTypeGroup.Core
        ) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
            lockTransaction = lockWallet.getAttribute("htlc.locks")[lockId];
        }

        await transactionHandler.apply(transaction, this.walletRepository);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const recipient: Contracts.State.Wallet = this.walletRepository.findByAddress(transaction.data.recipientId);

        this.applyVoteBalances(sender, recipient, transaction.data, lockWallet, lockTransaction);
    }

    public async revertTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        const { data } = transaction;

        const transactionHandler: TransactionInterfaces.TransactionHandler = await app
            .get<any>("transactionHandlerRegistry")
            .get(transaction.type, transaction.typeGroup);
        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(data.senderPublicKey);
        const recipient: Contracts.State.Wallet = this.walletRepository.findByAddress(data.recipientId);

        await transactionHandler.revert(transaction, this.walletRepository);

        let lockWallet: Contracts.State.Wallet;
        let lockTransaction: Interfaces.ITransactionData;
        if (
            transaction.type === Enums.TransactionType.HtlcClaim &&
            transaction.typeGroup === Enums.TransactionTypeGroup.Core
        ) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
            lockTransaction = lockWallet.getAttribute("htlc.locks")[lockId];
        }

        // Revert vote balance updates
        this.revertVoteBalances(sender, recipient, data, lockWallet, lockTransaction);
    }

    // WALLETS
    public applyVoteBalances(
        sender: Contracts.State.Wallet,
        recipient: Contracts.State.Wallet,
        transaction: Interfaces.ITransactionData,
        lockWallet: Contracts.State.Wallet,
        lockTransaction: Interfaces.ITransactionData,
    ): void {
        return this.updateVoteBalances(sender, recipient, transaction, lockWallet, lockTransaction, false);
    }

    public revertVoteBalances(
        sender: Contracts.State.Wallet,
        recipient: Contracts.State.Wallet,
        transaction: Interfaces.ITransactionData,
        lockWallet: Contracts.State.Wallet,
        lockTransaction: Interfaces.ITransactionData,
    ): void {
        return this.updateVoteBalances(sender, recipient, transaction, lockWallet, lockTransaction, true);
    }

    /**
     * Updates the vote balances of the respective delegates of sender and recipient.
     * If the transaction is not a vote...
     *    1. fee + amount is removed from the sender's delegate vote balance
     *    2. amount is added to the recipient's delegate vote balance
     *
     * in case of a vote...
     *    1. the full sender balance is added to the sender's delegate vote balance
     *
     * If revert is set to true, the operations are reversed (plus -> minus, minus -> plus).
     */
    private updateVoteBalances(
        sender: Contracts.State.Wallet,
        recipient: Contracts.State.Wallet,
        transaction: Interfaces.ITransactionData,
        lockWallet: Contracts.State.Wallet,
        lockTransaction: Interfaces.ITransactionData,
        revert: boolean,
    ): void {
        if (
            transaction.type === Enums.TransactionType.Vote &&
            transaction.typeGroup === Enums.TransactionTypeGroup.Core
        ) {
            const vote: string = transaction.asset.votes[0];
            const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(vote.substr(1));
            let voteBalance: Utils.BigNumber = delegate.getAttribute("delegate.voteBalance");

            if (vote.startsWith("+")) {
                voteBalance = revert
                    ? voteBalance.minus(sender.balance.minus(transaction.fee))
                    : voteBalance.plus(sender.balance);
            } else {
                voteBalance = revert
                    ? voteBalance.plus(sender.balance)
                    : voteBalance.minus(sender.balance.plus(transaction.fee));
            }

            delegate.setAttribute("delegate.voteBalance", voteBalance);
        } else {
            // Update vote balance of the sender's delegate
            if (sender.hasVoted()) {
                const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                    sender.getAttribute("vote"),
                );
                const amount =
                    transaction.type === Enums.TransactionType.MultiPayment &&
                        transaction.typeGroup === Enums.TransactionTypeGroup.Core
                        ? transaction.asset.payments.reduce(
                            (prev, curr) => prev.plus(curr.amount),
                            Utils.BigNumber.ZERO,
                        )
                        : transaction.amount;
                const total: Utils.BigNumber = amount.plus(transaction.fee);

                const voteBalance: Utils.BigNumber = delegate.getAttribute(
                    "delegate.voteBalance",
                    Utils.BigNumber.ZERO,
                );
                let newVoteBalance: Utils.BigNumber;

                if (
                    transaction.type === Enums.TransactionType.HtlcLock &&
                    transaction.typeGroup === Enums.TransactionTypeGroup.Core
                ) {
                    // HTLC Lock keeps the locked amount as the sender's delegate vote balance
                    newVoteBalance = revert ? voteBalance.plus(transaction.fee) : voteBalance.minus(transaction.fee);
                } else if (
                    transaction.type === Enums.TransactionType.HtlcClaim &&
                    transaction.typeGroup === Enums.TransactionTypeGroup.Core
                ) {
                    // HTLC Claim transfers the locked amount to the lock recipient's (= claim sender) delegate vote balance
                    newVoteBalance = revert
                        ? voteBalance.plus(transaction.fee).minus(lockTransaction.amount)
                        : voteBalance.minus(transaction.fee).plus(lockTransaction.amount);
                } else {
                    // General case : sender delegate vote balance reduced by amount + fees (or increased if revert)
                    newVoteBalance = revert ? voteBalance.plus(total) : voteBalance.minus(total);
                }
                delegate.setAttribute("delegate.voteBalance", newVoteBalance);
            }

            if (
                transaction.type === Enums.TransactionType.HtlcClaim &&
                transaction.typeGroup === Enums.TransactionTypeGroup.Core &&
                lockWallet.hasAttribute("vote")
            ) {
                // HTLC Claim transfers the locked amount to the lock recipient's (= claim sender) delegate vote balance
                const lockWalletDelegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                    lockWallet.getAttribute("vote"),
                );
                const lockWalletDelegateVoteBalance: Utils.BigNumber = lockWalletDelegate.getAttribute(
                    "delegate.voteBalance",
                    Utils.BigNumber.ZERO,
                );
                lockWalletDelegate.setAttribute(
                    "delegate.voteBalance",
                    revert
                        ? lockWalletDelegateVoteBalance.plus(lockTransaction.amount)
                        : lockWalletDelegateVoteBalance.minus(lockTransaction.amount),
                );
            }

            if (
                transaction.type === Enums.TransactionType.MultiPayment &&
                transaction.typeGroup === Enums.TransactionTypeGroup.Core
            ) {
                // go through all payments and update recipients delegates vote balance
                for (const { recipientId, amount } of transaction.asset.payments) {
                    const recipientWallet: Contracts.State.Wallet = this.walletRepository.findByAddress(recipientId);
                    const vote = recipientWallet.getAttribute("vote");
                    if (vote) {
                        const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(vote);
                        const voteBalance: Utils.BigNumber = delegate.getAttribute(
                            "delegate.voteBalance",
                            Utils.BigNumber.ZERO,
                        );
                        delegate.setAttribute(
                            "delegate.voteBalance",
                            revert ? voteBalance.minus(amount) : voteBalance.plus(amount),
                        );
                    }
                }
            }

            // Update vote balance of recipient's delegate
            if (
                recipient &&
                recipient.hasVoted() &&
                (transaction.type !== Enums.TransactionType.HtlcLock ||
                    transaction.typeGroup !== Enums.TransactionTypeGroup.Core)
            ) {
                const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                    recipient.getAttribute("vote"),
                );
                const voteBalance: Utils.BigNumber = delegate.getAttribute(
                    "delegate.voteBalance",
                    Utils.BigNumber.ZERO,
                );

                delegate.setAttribute(
                    "delegate.voteBalance",
                    revert ? voteBalance.minus(transaction.amount) : voteBalance.plus(transaction.amount),
                );
            }
        }
    }
}
