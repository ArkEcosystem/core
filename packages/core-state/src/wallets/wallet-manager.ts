import { app, Contracts } from "@arkecosystem/core-kernel";
import { Handlers, Interfaces as TransactionInterfaces } from "@arkecosystem/core-transactions";
import { Enums, Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { WalletIndexAlreadyRegisteredError, WalletIndexNotFoundError } from "./errors";
import { TempWalletManager } from "./temp-wallet-manager";
import { Wallet } from "./wallet";
import { WalletIndex } from "./wallet-index";

export class WalletManager implements Contracts.State.IWalletManager {
    // @TODO: make this private and read-only
    public logger: Contracts.Kernel.ILogger = app.resolve<Contracts.Kernel.ILogger>("log");

    private readonly indexes: Record<string, Contracts.State.IWalletIndex> = {};
    private currentBlock: Interfaces.IBlock;

    constructor() {
        this.reset();

        this.registerIndex(
            Contracts.State.WalletIndexes.Addresses,
            (index: Contracts.State.IWalletIndex, wallet: Contracts.State.IWallet) => {
                if (wallet.address) {
                    index.set(wallet.address, wallet);
                }
            },
        );

        this.registerIndex(
            Contracts.State.WalletIndexes.PublicKeys,
            (index: Contracts.State.IWalletIndex, wallet: Contracts.State.IWallet) => {
                if (wallet.publicKey) {
                    index.set(wallet.publicKey, wallet);
                }
            },
        );

        this.registerIndex(
            Contracts.State.WalletIndexes.Usernames,
            (index: Contracts.State.IWalletIndex, wallet: Contracts.State.IWallet) => {
                if (wallet.isDelegate()) {
                    index.set(wallet.getAttribute("delegate.username"), wallet);
                }
            },
        );

        this.registerIndex(
            Contracts.State.WalletIndexes.Locks,
            (index: Contracts.State.IWalletIndex, wallet: Contracts.State.IWallet) => {
                const locks = wallet.getAttribute("htlc.locks");
                if (locks) {
                    for (const lockId of Object.keys(locks)) {
                        index.set(lockId, wallet);
                    }
                }
            },
        );
    }

    public registerIndex(name: string, indexer: Contracts.State.WalletIndexer): void {
        if (this.indexes[name]) {
            throw new WalletIndexAlreadyRegisteredError(name);
        }

        this.indexes[name] = new WalletIndex(indexer);
    }

    public unregisterIndex(name: string): void {
        if (!this.indexes[name]) {
            throw new WalletIndexNotFoundError(name);
        }

        delete this.indexes[name];
    }

    public getIndex(name: string): Contracts.State.IWalletIndex {
        if (!this.indexes[name]) {
            throw new WalletIndexNotFoundError(name);
        }

        return this.indexes[name];
    }

    public allByAddress(): ReadonlyArray<Contracts.State.IWallet> {
        return this.getIndex(Contracts.State.WalletIndexes.Addresses).all();
    }

    public allByPublicKey(): ReadonlyArray<Contracts.State.IWallet> {
        return this.getIndex(Contracts.State.WalletIndexes.PublicKeys).all();
    }

    public allByUsername(): ReadonlyArray<Contracts.State.IWallet> {
        return this.getIndex(Contracts.State.WalletIndexes.Usernames).all();
    }

    public findById(id: string): Contracts.State.IWallet {
        for (const index of Object.values(this.indexes)) {
            const wallet: Contracts.State.IWallet = index.get(id);
            if (wallet) {
                return wallet;
            }
        }

        return undefined;
    }

    public findByAddress(address: string): Contracts.State.IWallet {
        const index: Contracts.State.IWalletIndex = this.getIndex(Contracts.State.WalletIndexes.Addresses);
        if (address && !index.has(address)) {
            index.set(address, new Wallet(address));
        }

        return index.get(address);
    }

    public findByPublicKey(publicKey: string): Contracts.State.IWallet {
        const index: Contracts.State.IWalletIndex = this.getIndex(Contracts.State.WalletIndexes.PublicKeys);
        if (publicKey && !index.has(publicKey)) {
            const address: string = Identities.Address.fromPublicKey(publicKey);
            const wallet: Contracts.State.IWallet = this.findByAddress(address);
            wallet.publicKey = publicKey;
            index.set(publicKey, wallet);
        }

        return index.get(publicKey);
    }

    public findByUsername(username: string): Contracts.State.IWallet {
        return this.findByIndex(Contracts.State.WalletIndexes.Usernames, username);
    }

    public findByIndex(indexName: string, key: string): Contracts.State.IWallet | undefined {
        return this.getIndex(indexName).get(key);
    }

    public has(key: string): boolean {
        for (const walletIndex of Object.values(this.indexes)) {
            if (walletIndex.has(key)) {
                return true;
            }
        }

        return false;
    }

    public hasByAddress(address: string): boolean {
        return this.hasByIndex(Contracts.State.WalletIndexes.Addresses, address);
    }

    public hasByPublicKey(publicKey: string): boolean {
        return this.hasByIndex(Contracts.State.WalletIndexes.PublicKeys, publicKey);
    }

    public hasByUsername(username: string): boolean {
        return this.hasByIndex(Contracts.State.WalletIndexes.Usernames, username);
    }

    public hasByIndex(indexName: string, key: string): boolean {
        return this.getIndex(indexName).has(key);
    }

    public getNonce(publicKey: string): Utils.BigNumber {
        if (this.hasByPublicKey(publicKey)) {
            return this.findByPublicKey(publicKey).nonce;
        }

        return Utils.BigNumber.ZERO;
    }

    public forgetByAddress(address: string): void {
        this.forgetByIndex(Contracts.State.WalletIndexes.Addresses, address);
    }

    public forgetByPublicKey(publicKey: string): void {
        this.forgetByIndex(Contracts.State.WalletIndexes.PublicKeys, publicKey);
    }

    public forgetByUsername(username: string): void {
        this.forgetByIndex(Contracts.State.WalletIndexes.Usernames, username);
    }

    public forgetByIndex(indexName: string, key: string): void {
        this.getIndex(indexName).forget(key);
    }

    public index(wallets: ReadonlyArray<Contracts.State.IWallet>): void {
        for (const wallet of wallets) {
            this.reindex(wallet);
        }
    }

    public reindex(wallet: Contracts.State.IWallet): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.index(wallet);
        }
    }

    public getCurrentBlock(): Readonly<Interfaces.IBlock> {
        return this.currentBlock;
    }

    public clone(): WalletManager {
        return new TempWalletManager(this);
    }

    public loadActiveDelegateList(roundInfo: Contracts.Shared.IRoundInfo): Contracts.State.IWallet[] {
        const delegates: Contracts.State.IWallet[] = this.buildDelegateRanking(roundInfo);
        const { maxDelegates } = roundInfo;

        if (delegates.length < maxDelegates) {
            throw new Error(
                `Expected to find ${maxDelegates} delegates but only found ${delegates.length}. ` +
                    `This indicates an issue with the genesis block & delegates.`,
            );
        }

        this.logger.debug(`Loaded ${delegates.length} active ${pluralize("delegate", delegates.length)}`);

        return delegates;
    }

    // Only called during integrity verification on boot.
    public buildVoteBalances(): void {
        for (const voter of this.allByPublicKey()) {
            if (voter.hasVoted()) {
                const delegate: Contracts.State.IWallet = this.findByPublicKey(voter.getAttribute<string>("vote"));
                const voteBalance: Utils.BigNumber = delegate.getAttribute("delegate.voteBalance");
                const lockedBalance = voter.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
                delegate.setAttribute("delegate.voteBalance", voteBalance.plus(voter.balance).plus(lockedBalance));
            }
        }
    }

    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        this.currentBlock = block;
        const generatorPublicKey: string = block.data.generatorPublicKey;

        let delegate: Contracts.State.IWallet;
        if (!this.has(generatorPublicKey)) {
            const generator: string = Identities.Address.fromPublicKey(generatorPublicKey);

            if (block.data.height === 1) {
                delegate = new Wallet(generator);
                delegate.publicKey = generatorPublicKey;

                this.reindex(delegate);
            } else {
                app.terminate(`Failed to lookup generator '${generatorPublicKey}' of block '${block.data.id}'.`);
            }
        } else {
            delegate = this.findByPublicKey(block.data.generatorPublicKey);
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
                const votedDelegate: Contracts.State.IWallet = this.findByPublicKey(
                    delegate.getAttribute<string>("vote"),
                );
                const voteBalance: Utils.BigNumber = votedDelegate.getAttribute("delegate.voteBalance");
                votedDelegate.setAttribute("delegate.voteBalance", voteBalance.plus(increase));
            }
        } catch (error) {
            this.logger.error("Failed to apply all transactions in block - reverting previous transactions");

            // Revert the applied transactions from last to first
            for (const transaction of appliedTransactions.reverse()) {
                await this.revertTransaction(transaction);
            }

            throw error;
        } finally {
            this.currentBlock = undefined;
        }
    }

    public async revertBlock(block: Interfaces.IBlock): Promise<void> {
        if (!this.has(block.data.generatorPublicKey)) {
            app.terminate(`Failed to lookup generator '${block.data.generatorPublicKey}' of block '${block.data.id}'.`);
        }
        this.currentBlock = block;

        const delegate: Contracts.State.IWallet = this.findByPublicKey(block.data.generatorPublicKey);
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
                const votedDelegate: Contracts.State.IWallet = this.findByPublicKey(
                    delegate.getAttribute<string>("vote"),
                );
                const voteBalance: Utils.BigNumber = votedDelegate.getAttribute("delegate.voteBalance");
                votedDelegate.setAttribute("delegate.voteBalance", voteBalance.minus(decrease));
            }
        } catch (error) {
            this.logger.error(error.stack);

            for (const transaction of revertedTransactions.reverse()) {
                await this.applyTransaction(transaction);
            }

            throw error;
        } finally {
            this.currentBlock = undefined;
        }
    }

    public async applyTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(
            transaction.type,
            transaction.typeGroup,
        );

        let lockWallet: Contracts.State.IWallet;
        let lockTransaction: Interfaces.ITransactionData;
        if (transaction.type === Enums.TransactionType.HtlcClaim) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
            lockTransaction = lockWallet.getAttribute("htlc.locks", {})[lockId];
        }

        await transactionHandler.apply(transaction, this);

        const sender: Contracts.State.IWallet = this.findByPublicKey(transaction.data.senderPublicKey);
        const recipient: Contracts.State.IWallet = this.findByAddress(transaction.data.recipientId);

        this.updateVoteBalances(sender, recipient, transaction.data, lockWallet, lockTransaction);
    }

    public async revertTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        const { data } = transaction;

        const transactionHandler: TransactionInterfaces.ITransactionHandler = Handlers.Registry.get(
            transaction.type,
            transaction.typeGroup,
        );
        const sender: Contracts.State.IWallet = this.findByPublicKey(data.senderPublicKey);
        const recipient: Contracts.State.IWallet = this.findByAddress(data.recipientId);

        await transactionHandler.revert(transaction, this);

        let lockWallet: Contracts.State.IWallet;
        let lockTransaction: Interfaces.ITransactionData;
        if (transaction.type === Enums.TransactionType.HtlcClaim) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
            lockTransaction = lockWallet.getAttribute("htlc.locks", {})[lockId];
        }

        // Revert vote balance updates
        this.updateVoteBalances(sender, recipient, data, lockWallet, lockTransaction, true);
    }

    public canBePurged(wallet: Contracts.State.IWallet): boolean {
        return wallet.canBePurged();
    }

    public reset(): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }

    public buildDelegateRanking(roundInfo?: Contracts.Shared.IRoundInfo): Contracts.State.IWallet[] {
        const delegates: Contracts.State.IWallet[] = this.allByUsername().filter(
            (wallet: Contracts.State.IWallet) => !wallet.hasAttribute("delegate.resigned"),
        );

        let delegateWallets = delegates
            .sort((a, b) => {
                const voteBalanceA: Utils.BigNumber = a.getAttribute("delegate.voteBalance");
                const voteBalanceB: Utils.BigNumber = b.getAttribute("delegate.voteBalance");

                const diff = voteBalanceB.comparedTo(voteBalanceA);
                if (diff === 0) {
                    if (a.publicKey === b.publicKey) {
                        throw new Error(
                            `The balance and public key of both delegates are identical! Delegate "${a.getAttribute(
                                "delegate.username",
                            )}" appears twice in the list.`,
                        );
                    }

                    return a.publicKey.localeCompare(b.publicKey, "en");
                }

                return diff;
            })
            .map(
                (delegate, i): Contracts.State.IWallet => {
                    const rank = i + 1;
                    delegate.setAttribute("delegate.rank", rank);
                    return delegate;
                },
            );

        if (roundInfo) {
            delegateWallets = delegateWallets.slice(0, roundInfo.maxDelegates);
            for (const delegate of delegateWallets) {
                delegate.setAttribute("delegate.round", roundInfo.round);
            }
        }

        return delegateWallets;
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
        sender: Contracts.State.IWallet,
        recipient: Contracts.State.IWallet,
        transaction: Interfaces.ITransactionData,
        lockWallet: Contracts.State.IWallet,
        lockTransaction: Interfaces.ITransactionData,
        revert: boolean = false,
    ): void {
        if (transaction.type !== Enums.TransactionType.Vote) {
            // Update vote balance of the sender's delegate
            if (sender.hasVoted()) {
                const delegate: Contracts.State.IWallet = this.findByPublicKey(sender.getAttribute("vote"));
                const amount =
                    transaction.type === Enums.TransactionType.MultiPayment
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

                if (transaction.type === Enums.TransactionType.HtlcLock) {
                    // HTLC Lock keeps the locked amount as the sender's delegate vote balance
                    newVoteBalance = revert ? voteBalance.plus(transaction.fee) : voteBalance.minus(transaction.fee);
                } else if (transaction.type === Enums.TransactionType.HtlcClaim) {
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

            if (transaction.type === Enums.TransactionType.HtlcClaim && lockWallet.hasAttribute("vote")) {
                // HTLC Claim transfers the locked amount to the lock recipient's (= claim sender) delegate vote balance
                const lockWalletDelegate: Contracts.State.IWallet = this.findByPublicKey(
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

            if (transaction.type === Enums.TransactionType.MultiPayment) {
                // go through all payments and update recipients delegates vote balance
                for (const { recipientId, amount } of transaction.asset.payments) {
                    const recipientWallet: Contracts.State.IWallet = this.findByAddress(recipientId);
                    const vote = recipientWallet.getAttribute("vote");
                    if (vote) {
                        const delegate: Contracts.State.IWallet = this.findByPublicKey(vote);
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
            if (recipient && recipient.hasVoted() && transaction.type !== Enums.TransactionType.HtlcLock) {
                const delegate: Contracts.State.IWallet = this.findByPublicKey(recipient.getAttribute("vote"));
                const voteBalance: Utils.BigNumber = delegate.getAttribute(
                    "delegate.voteBalance",
                    Utils.BigNumber.ZERO,
                );

                delegate.setAttribute(
                    "delegate.voteBalance",
                    revert ? voteBalance.minus(transaction.amount) : voteBalance.plus(transaction.amount),
                );
            }
        } else {
            const vote: string = transaction.asset.votes[0];
            const delegate: Contracts.State.IWallet = this.findByPublicKey(vote.substr(1));
            let voteBalance: Utils.BigNumber = delegate.getAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

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
        }
    }
}
