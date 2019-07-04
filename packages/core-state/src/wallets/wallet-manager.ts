import { app } from "@arkecosystem/core-container";
import { Logger, Shared, State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import cloneDeep from "lodash.clonedeep";
import pluralize from "pluralize";
import { Wallet } from "./wallet";

export class WalletManager implements State.IWalletManager {
    // @TODO: make this private and read-only
    public byAddress: { [key: string]: State.IWallet };
    // @TODO: make this private and read-only
    public byPublicKey: { [key: string]: State.IWallet };
    // @TODO: make this private and read-only
    public byUsername: { [key: string]: State.IWallet };
    // @TODO: make this private and read-only
    public logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    private byLockId: { [key: string]: State.IWallet };

    constructor() {
        this.reset();
    }

    public allByAddress(): State.IWallet[] {
        return Object.values(this.byAddress);
    }

    public allByPublicKey(): State.IWallet[] {
        return Object.values(this.byPublicKey);
    }

    public allByUsername(): State.IWallet[] {
        return Object.values(this.byUsername);
    }

    public allByLockId(): State.IWallet[] {
        return Object.values(this.byLockId);
    }

    public findByAddress(address: string): State.IWallet {
        if (address && !this.byAddress[address]) {
            this.byAddress[address] = new Wallet(address);
        }

        return this.byAddress[address];
    }

    public findByPublicKey(publicKey: string): State.IWallet {
        if (publicKey && !this.byPublicKey[publicKey]) {
            const address = Identities.Address.fromPublicKey(publicKey);

            const wallet = this.findByAddress(address);
            wallet.publicKey = publicKey;
            this.byPublicKey[publicKey] = wallet;
        }

        return this.byPublicKey[publicKey];
    }

    public findByUsername(username: string): State.IWallet {
        return this.byUsername[username];
    }

    public findByLockId(lockId: string): State.IWallet {
        return this.byLockId[lockId];
    }

    public setByAddress(address: string, wallet: Wallet): void {
        if (address && wallet) {
            this.byAddress[address] = wallet;
        }
    }

    public setByPublicKey(publicKey: string, wallet: Wallet): void {
        if (publicKey && wallet) {
            this.byPublicKey[publicKey] = wallet;
        }
    }

    public setByUsername(username: string, wallet: Wallet): void {
        if (username && wallet) {
            this.byUsername[username] = wallet;
        }
    }

    public setByLockId(lockId: string, wallet: Wallet): void {
        if (lockId && wallet) {
            this.byLockId[lockId] = wallet;
        }
    }

    public has(addressOrPublicKey: string): boolean {
        return this.hasByAddress(addressOrPublicKey) || this.hasByPublicKey(addressOrPublicKey);
    }

    public hasByAddress(address: string): boolean {
        return !!this.byAddress[address];
    }

    public hasByPublicKey(publicKey: string): boolean {
        return !!this.byPublicKey[publicKey];
    }

    public hasByUsername(username: string): boolean {
        return !!this.byUsername[username];
    }

    public hasByLockId(lockId: string): boolean {
        return !!this.byLockId[lockId];
    }

    public getNonce(publicKey: string): Utils.BigNumber {
        if (this.hasByPublicKey(publicKey)) {
            return this.byPublicKey[publicKey].nonce;
        }

        return Utils.BigNumber.ZERO;
    }

    public forgetByAddress(address: string): void {
        delete this.byAddress[address];
    }

    public forgetByPublicKey(publicKey: string): void {
        delete this.byPublicKey[publicKey];
    }

    public forgetByUsername(username: string): void {
        delete this.byUsername[username];
    }

    public forgetByLockId(lockId: string): void {
        delete this.byLockId[lockId];
    }

    public index(wallets: State.IWallet[]): void {
        for (const wallet of wallets) {
            this.reindex(wallet);
        }
    }

    public reindex(wallet: State.IWallet): void {
        if (wallet.address) {
            this.byAddress[wallet.address] = wallet;
        }

        if (wallet.publicKey) {
            this.byPublicKey[wallet.publicKey] = wallet;
        }

        if (wallet.username) {
            this.byUsername[wallet.username] = wallet;
        }

        if (wallet.locks) {
            for (const lockId of Object.keys(wallet.locks)) {
                this.byLockId[lockId] = wallet;
            }
        }
    }

    public cloneDelegateWallets(): WalletManager {
        const walletManager: WalletManager = new WalletManager();
        walletManager.index(cloneDeep(this.allByUsername()));
        return walletManager;
    }

    public loadActiveDelegateList(roundInfo: Shared.IRoundInfo): State.IDelegateWallet[] {
        const delegates: State.IWallet[] = this.buildDelegateRanking(roundInfo);
        const { maxDelegates } = roundInfo;

        if (delegates.length < maxDelegates) {
            throw new Error(
                `Expected to find ${maxDelegates} delegates but only found ${delegates.length}. ` +
                    `This indicates an issue with the genesis block & delegates.`,
            );
        }

        this.logger.debug(`Loaded ${delegates.length} active ${pluralize("delegate", delegates.length)}`);

        return delegates as State.IDelegateWallet[];
    }

    // Only called during integrity verification on boot.
    public buildVoteBalances(): void {
        for (const voter of Object.values(this.byPublicKey)) {
            if (voter.vote) {
                const delegate: State.IWallet = this.byPublicKey[voter.vote];
                delegate.voteBalance = delegate.voteBalance.plus(voter.balance).plus(voter.lockedBalance);
            }
        }
    }

    public purgeEmptyNonDelegates(): void {
        for (const wallet of Object.values(this.byPublicKey)) {
            if (this.canBePurged(wallet)) {
                delete this.byPublicKey[wallet.publicKey];
                delete this.byAddress[wallet.address];
            }
        }
    }

    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        const generatorPublicKey: string = block.data.generatorPublicKey;

        let delegate: State.IWallet = this.byPublicKey[block.data.generatorPublicKey];

        if (!delegate) {
            const generator: string = Identities.Address.fromPublicKey(generatorPublicKey);

            if (block.data.height === 1) {
                delegate = new Wallet(generator);
                delegate.publicKey = generatorPublicKey;

                this.reindex(delegate);
            } else {
                this.logger.debug(`Delegate by address: ${this.byAddress[generator]}`);

                if (this.byAddress[generator]) {
                    this.logger.info("This look like a bug, please report");
                }

                throw new Error(`Could not find delegate with publicKey ${generatorPublicKey}`);
            }
        }

        const appliedTransactions: Interfaces.ITransaction[] = [];

        try {
            for (const transaction of block.transactions) {
                this.applyTransaction(transaction);
                appliedTransactions.push(transaction);
            }

            const applied: boolean = delegate.applyBlock(block.data);

            // If the block has been applied to the delegate, the balance is increased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (applied && delegate.vote) {
                const increase: Utils.BigNumber = block.data.reward.plus(block.data.totalFee);
                const votedDelegate: State.IWallet = this.byPublicKey[delegate.vote];
                votedDelegate.voteBalance = votedDelegate.voteBalance.plus(increase);
            }
        } catch (error) {
            this.logger.error("Failed to apply all transactions in block - reverting previous transactions");

            // Revert the applied transactions from last to first
            for (const transaction of appliedTransactions.reverse()) {
                await this.revertTransaction(transaction);
            }

            throw error;
        }
    }

    public async revertBlock(block: Interfaces.IBlock): Promise<void> {
        const delegate: State.IWallet = this.byPublicKey[block.data.generatorPublicKey];

        if (!delegate) {
            app.forceExit(`Failed to lookup generator '${block.data.generatorPublicKey}' of block '${block.data.id}'.`);
        }

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
            if (reverted && delegate.vote) {
                const decrease: Utils.BigNumber = block.data.reward.plus(block.data.totalFee);
                const votedDelegate: State.IWallet = this.byPublicKey[delegate.vote];
                votedDelegate.voteBalance = votedDelegate.voteBalance.minus(decrease);
            }
        } catch (error) {
            this.logger.error(error.stack);

            for (const transaction of revertedTransactions.reverse()) {
                this.applyTransaction(transaction);
            }

            throw error;
        }
    }

    public applyTransaction(transaction: Interfaces.ITransaction): void {
        const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(transaction.type);

        let lockWallet: State.IWallet;
        let lockTransaction: Interfaces.ITransactionData;
        if (transaction.type === Enums.TransactionTypes.HtlcClaim) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.findByLockId(lockId);
            lockTransaction = lockWallet.locks[lockId];
        }

        transactionHandler.apply(transaction, this);

        const sender: State.IWallet = this.findByPublicKey(transaction.data.senderPublicKey);
        const recipient: State.IWallet = this.findByAddress(transaction.data.recipientId);

        this.updateVoteBalances(sender, recipient, transaction.data, lockWallet, lockTransaction);
    }

    public async revertTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        const { data } = transaction;

        const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(transaction.type);
        const sender: State.IWallet = this.findByPublicKey(data.senderPublicKey);
        const recipient: State.IWallet = this.byAddress[data.recipientId];

        await transactionHandler.revert(transaction, this);

        let lockWallet: State.IWallet;
        let lockTransaction: Interfaces.ITransactionData;
        if (transaction.type === Enums.TransactionTypes.HtlcClaim) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.findByLockId(lockId);
            lockTransaction = lockWallet.locks[lockId];
        }

        // Revert vote balance updates
        this.updateVoteBalances(sender, recipient, data, lockWallet, lockTransaction, true);
    }

    public isDelegate(publicKey: string): boolean {
        const delegateWallet: State.IWallet = this.byPublicKey[publicKey];

        if (delegateWallet && delegateWallet.username) {
            return this.hasByUsername(delegateWallet.username);
        }

        return false;
    }

    public canBePurged(wallet: State.IWallet): boolean {
        return (
            wallet.balance.isZero() &&
            wallet.lockedBalance.isZero() &&
            !wallet.secondPublicKey &&
            !wallet.multisignature &&
            !wallet.username
        );
    }

    /**
     * Reset the wallets index.
     * @return {void}
     */
    public reset(): void {
        this.byAddress = {};
        this.byPublicKey = {};
        this.byUsername = {};
        this.byLockId = {};
    }

    public buildDelegateRanking(roundInfo?: Shared.IRoundInfo): State.IDelegateWallet[] {
        const delegates: State.IWallet[] = this.allByUsername().filter((w: State.IWallet) => !w.resigned);

        const equalVotesMap = new Map();
        let delegateWallets = delegates
            .sort((a, b) => {
                const diff = b.voteBalance.comparedTo(a.voteBalance);

                if (diff === 0) {
                    if (!equalVotesMap.has(a.voteBalance.toFixed())) {
                        equalVotesMap.set(a.voteBalance.toFixed(), new Set());
                    }

                    const set = equalVotesMap.get(a.voteBalance.toFixed());
                    set.add(a);
                    set.add(b);

                    if (a.publicKey === b.publicKey) {
                        throw new Error(
                            `The balance and public key of both delegates are identical! Delegate "${
                                a.username
                            }" appears twice in the list.`,
                        );
                    }

                    return a.publicKey.localeCompare(b.publicKey, "en");
                }

                return diff;
            })
            .map((delegate, i) => {
                const rate = i + 1;
                this.byUsername[delegate.username].rate = rate;
                return { round: roundInfo ? roundInfo.round : 0, ...delegate, rate };
            });

        if (roundInfo) {
            delegateWallets = delegateWallets.slice(0, roundInfo.maxDelegates);

            for (const [voteBalance, set] of equalVotesMap.entries()) {
                const values: any[] = Array.from(set.values());
                if (delegateWallets.includes(values[0])) {
                    const mapped = values.map(v => `${v.username} (${v.publicKey})`);
                    this.logger.warn(
                        `Delegates ${JSON.stringify(
                            mapped,
                            undefined,
                            4,
                        )} have a matching vote balance of ${Utils.formatSatoshi(voteBalance)}`,
                    );
                }
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
        sender: State.IWallet,
        recipient: State.IWallet,
        transaction: Interfaces.ITransactionData,
        lockWallet: State.IWallet,
        lockTransaction: Interfaces.ITransactionData,
        revert: boolean = false,
    ): void {
        // TODO: multipayment?
        if (transaction.type !== Enums.TransactionTypes.Vote) {
            // Update vote balance of the sender's delegate
            if (sender.vote) {
                const delegate: State.IWallet = this.findByPublicKey(sender.vote);
                const total: Utils.BigNumber = transaction.amount.plus(transaction.fee);

                if (transaction.type === Enums.TransactionTypes.HtlcLock) {
                    // HTLC Lock keeps the locked amount as the sender's delegate vote balance
                    delegate.voteBalance = revert
                        ? delegate.voteBalance.plus(transaction.fee)
                        : delegate.voteBalance.minus(transaction.fee);
                } else if (transaction.type === Enums.TransactionTypes.HtlcClaim) {
                    // HTLC Claim transfers the locked amount to the lock recipient's (= claim sender) delegate vote balance
                    delegate.voteBalance = revert
                        ? delegate.voteBalance.plus(transaction.fee).minus(lockTransaction.amount)
                        : delegate.voteBalance.minus(transaction.fee).plus(lockTransaction.amount);

                    const lockWalletDelegate: State.IWallet = this.findByPublicKey(lockWallet.vote);
                    lockWalletDelegate.voteBalance = revert
                        ? delegate.voteBalance.plus(lockTransaction.amount)
                        : delegate.voteBalance.minus(lockTransaction.amount);
                } else {
                    // General case : sender delegate vote balance reduced by amount + fees (or increased if revert)
                    delegate.voteBalance = revert
                        ? delegate.voteBalance.plus(total)
                        : delegate.voteBalance.minus(total);
                }
            }

            // Update vote balance of recipient's delegate
            if (recipient && recipient.vote && transaction.type !== Enums.TransactionTypes.HtlcLock) {
                // HTLC Lock does not update vote balance of recipient's voted delegate because he didn't receive the funds yet
                const delegate: State.IWallet = this.findByPublicKey(recipient.vote);
                delegate.voteBalance = revert
                    ? delegate.voteBalance.minus(transaction.amount)
                    : delegate.voteBalance.plus(transaction.amount);
            }
        } else {
            const vote: string = transaction.asset.votes[0];
            const delegate: State.IWallet = this.findByPublicKey(vote.substr(1));

            if (vote.startsWith("+")) {
                delegate.voteBalance = revert
                    ? delegate.voteBalance.minus(sender.balance.minus(transaction.fee))
                    : delegate.voteBalance.plus(sender.balance);
            } else {
                delegate.voteBalance = revert
                    ? delegate.voteBalance.plus(sender.balance)
                    : delegate.voteBalance.minus(sender.balance.plus(transaction.fee));
            }
        }
    }
}
