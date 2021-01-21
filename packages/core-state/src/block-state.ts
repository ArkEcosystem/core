import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Interfaces, Utils } from "@arkecosystem/crypto";

@Container.injectable()
export class BlockState {
    @Container.inject(Container.Identifiers.WalletRepository)
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    private readonly handlerRegistry!: Handlers.Registry;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly state!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        const previousBlock = this.state.getLastBlock();
        const forgerWallet = this.walletRepository.findByPublicKey(block.data.generatorPublicKey);
        const appliedTransactions: Interfaces.ITransaction[] = [];

        try {
            for (const transaction of block.transactions) {
                await this.applyTransaction(transaction);
                appliedTransactions.push(transaction);
            }

            this.applyBlockToForger(forgerWallet, block.data);

            this.state.setLastBlock(block);
        } catch (error) {
            this.logger.error(error.stack);
            this.logger.error("Failed to apply all transactions in block - reverting previous transactions");

            for (const transaction of appliedTransactions.slice().reverse()) {
                await this.revertTransaction(transaction);
            }

            this.state.setLastBlock(previousBlock);

            throw error;
        }
    }

    public async revertBlock(block: Interfaces.IBlock): Promise<void> {
        const forgerWallet = this.walletRepository.findByPublicKey(block.data.generatorPublicKey);

        try {
            this.revertBlockFromForger(forgerWallet, block.data);

            for (const transaction of block.transactions.slice().reverse()) {
                await this.revertTransaction(transaction);
            }
        } catch (error) {
            this.logger.error(error.stack);
            this.logger.error("Failed to revert all transactions in block");

            throw error;
        }
    }

    public async applyTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const transactionHandler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);
        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        await transactionHandler.throwIfCannotBeApplied(transaction, sender);
        this.updateVoteBalance(transaction, false);
        await transactionHandler.apply(transaction);
    }

    public async revertTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        const transactionHandler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);

        await transactionHandler.revert(transaction);
        this.updateVoteBalance(transaction, true);
    }

    public increaseWalletDelegateVoteBalance(
        wallet: Contracts.State.Wallet,
        amount: AppUtils.BigNumber,
        revert: boolean,
    ): void {
        if (revert) {
            this.decreaseWalletDelegateVoteBalance(wallet, amount, false);
            return;
        }

        if (wallet.hasVoted()) {
            const delegatePublicKey = wallet.getAttribute<string>("vote");
            const delegateWallet = this.walletRepository.findByPublicKey(delegatePublicKey);
            const oldDelegateVoteBalance = delegateWallet.getAttribute<AppUtils.BigNumber>("delegate.voteBalance");
            const newDelegateVoteBalance = oldDelegateVoteBalance.plus(amount);
            delegateWallet.setAttribute("delegate.voteBalance", newDelegateVoteBalance);
        }
    }

    public decreaseWalletDelegateVoteBalance(
        wallet: Contracts.State.Wallet,
        amount: AppUtils.BigNumber,
        revert: boolean,
    ): void {
        if (revert) {
            this.increaseWalletDelegateVoteBalance(wallet, amount, false);
            return;
        }

        if (wallet.hasVoted()) {
            const delegatePublicKey = wallet.getAttribute<string>("vote");
            const delegateWallet = this.walletRepository.findByPublicKey(delegatePublicKey);
            const oldDelegateVoteBalance = delegateWallet.getAttribute<AppUtils.BigNumber>("delegate.voteBalance");
            const newDelegateVoteBalance = oldDelegateVoteBalance.minus(amount);
            delegateWallet.setAttribute("delegate.voteBalance", newDelegateVoteBalance);
        }
    }

    private applyBlockToForger(forgerWallet: Contracts.State.Wallet, blockData: Interfaces.IBlockData) {
        const delegateAttribute = forgerWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
        delegateAttribute.producedBlocks++;
        delegateAttribute.forgedFees = delegateAttribute.forgedFees.plus(blockData.totalFee);
        delegateAttribute.forgedRewards = delegateAttribute.forgedRewards.plus(blockData.reward);
        delegateAttribute.lastBlock = blockData;

        const balanceIncrease = blockData.reward.plus(blockData.totalFee);
        this.increaseWalletDelegateVoteBalance(forgerWallet, balanceIncrease, false);
        forgerWallet.balance = forgerWallet.balance.plus(balanceIncrease);
        forgerWallet.setAttribute("delegate", delegateAttribute);
    }

    private revertBlockFromForger(forgerWallet: Contracts.State.Wallet, blockData: Interfaces.IBlockData) {
        const delegateAttribute = forgerWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
        delegateAttribute.producedBlocks--;
        delegateAttribute.forgedFees = delegateAttribute.forgedFees.minus(blockData.totalFee);
        delegateAttribute.forgedRewards = delegateAttribute.forgedRewards.minus(blockData.reward);
        delegateAttribute.lastBlock = undefined;

        const balanceDecrease = blockData.reward.plus(blockData.totalFee);
        this.decreaseWalletDelegateVoteBalance(forgerWallet, balanceDecrease, false);
        forgerWallet.balance = forgerWallet.balance.minus(balanceDecrease);
        forgerWallet.setAttribute("delegate", delegateAttribute);
    }

    private updateVoteBalance(transaction: Interfaces.ITransaction, revert: boolean): void {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        if (
            // htlc-claim and htlc-refund handlers don't call super.applyToSender
            transaction.typeGroup !== Enums.TransactionTypeGroup.Core ||
            (transaction.type !== Enums.TransactionType.HtlcClaim &&
                transaction.type !== Enums.TransactionType.HtlcRefund)
        ) {
            this.decreaseWalletDelegateVoteBalance(senderWallet, transaction.data.amount, revert);
            this.decreaseWalletDelegateVoteBalance(senderWallet, transaction.data.fee, revert);
        }

        if (transaction.typeGroup === Enums.TransactionTypeGroup.Core) {
            if (transaction.type === Enums.TransactionType.Transfer) {
                AppUtils.assert.defined<string>(transaction.data.recipientId);
                const recipientWallet = this.walletRepository.findByAddress(transaction.data.recipientId);
                this.increaseWalletDelegateVoteBalance(recipientWallet, transaction.data.amount, revert);
            }

            if (transaction.type === Enums.TransactionType.Vote) {
                AppUtils.assert.defined<string[]>(transaction.data.asset?.votes);

                const senderDelegatedVoteBalance = senderWallet
                    .getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)
                    .plus(senderWallet.balance)
                    .minus(transaction.data.fee);

                for (const vote of transaction.data.asset.votes) {
                    const delegateWallet = this.walletRepository.findByPublicKey(vote.slice(1));

                    const delegateVoteBalanceChange = senderDelegatedVoteBalance
                        .times(vote.startsWith("+") ? 1 : -1)
                        .times(revert ? -1 : 1);

                    const delegateVoteBalance = delegateWallet
                        .getAttribute("delegate.voteBalance", Utils.BigNumber.ZERO)
                        .plus(delegateVoteBalanceChange);

                    delegateWallet.setAttribute("delegate.voteBalance", delegateVoteBalance);
                }
            }

            if (transaction.type === Enums.TransactionType.MultiPayment) {
                AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

                for (const payment of transaction.data.asset.payments) {
                    const recipientWallet = this.walletRepository.findByAddress(payment.recipientId);

                    this.decreaseWalletDelegateVoteBalance(senderWallet, payment.amount, revert);
                    this.increaseWalletDelegateVoteBalance(recipientWallet, payment.amount, revert);
                }
            }

            if (transaction.type === Enums.TransactionType.HtlcLock) {
                this.increaseWalletDelegateVoteBalance(senderWallet, transaction.data.amount, revert);
            }

            if (transaction.type === Enums.TransactionType.HtlcClaim) {
                AppUtils.assert.defined<string>(transaction.data.asset?.claim?.lockTransactionId);

                const lockId = transaction.data.asset.claim.lockTransactionId;
                const lockWallet = this.walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
                const lock = lockWallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks")[lockId];

                AppUtils.assert.defined<Interfaces.IHtlcLock>(lock);
                AppUtils.assert.defined<Interfaces.IHtlcLock>(lock.recipientId);

                const recipientWallet = this.walletRepository.findByAddress(lock.recipientId);

                this.decreaseWalletDelegateVoteBalance(lockWallet, lock.amount, revert);
                this.increaseWalletDelegateVoteBalance(recipientWallet, lock.amount, revert);
                this.decreaseWalletDelegateVoteBalance(recipientWallet, transaction.data.fee, revert); // see htlc-claim.ts:147
            }

            if (transaction.type === Enums.TransactionType.HtlcRefund) {
                AppUtils.assert.defined<string>(transaction.data.asset?.refund?.lockTransactionId);

                const lockId = transaction.data.asset.refund.lockTransactionId;
                const lockWallet = this.walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);

                this.decreaseWalletDelegateVoteBalance(lockWallet, transaction.data.fee, revert); // see htlc-refund.ts:134
            }
        }
    }
}
