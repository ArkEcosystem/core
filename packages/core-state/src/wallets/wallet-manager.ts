import { app } from "@arkecosystem/core-container";
import { Logger, Shared, State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { TempWalletManager } from "./temp-wallet-manager";
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

    public findById(id: string): State.IWallet {
        return this.byAddress[id] || this.byPublicKey[id] || this.byUsername[id];
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
    }

    public clone(): WalletManager {
        return new TempWalletManager(this);
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
                delegate.voteBalance = delegate.voteBalance.plus(voter.balance);
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

    public applyBlock(block: Interfaces.IBlock): void {
        const generatorPublicKey: string = block.data.generatorPublicKey;

        let delegate: State.IWallet;
        if (!this.has(generatorPublicKey)) {
            const generator: string = Identities.Address.fromPublicKey(generatorPublicKey);

            if (block.data.height === 1) {
                delegate = new Wallet(generator);
                delegate.publicKey = generatorPublicKey;

                this.reindex(delegate);
            } else {
                app.forceExit(`Failed to lookup generator '${generatorPublicKey}' of block '${block.data.id}'.`);
            }
        } else {
            delegate = this.findByPublicKey(block.data.generatorPublicKey);
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
                const votedDelegate: State.IWallet = this.findByPublicKey(delegate.vote);
                votedDelegate.voteBalance = votedDelegate.voteBalance.plus(increase);
            }
        } catch (error) {
            this.logger.error("Failed to apply all transactions in block - reverting previous transactions");

            // Revert the applied transactions from last to first
            for (const transaction of appliedTransactions.reverse()) {
                this.revertTransaction(transaction);
            }

            throw error;
        }
    }

    public revertBlock(block: Interfaces.IBlock): void {
        if (!this.has(block.data.generatorPublicKey)) {
            app.forceExit(`Failed to lookup generator '${block.data.generatorPublicKey}' of block '${block.data.id}'.`);
        }

        const delegate: State.IWallet = this.findByPublicKey(block.data.generatorPublicKey);
        const revertedTransactions: Interfaces.ITransaction[] = [];

        try {
            // Revert the transactions from last to first
            for (let i = block.transactions.length - 1; i >= 0; i--) {
                const transaction: Interfaces.ITransaction = block.transactions[i];
                this.revertTransaction(transaction);
                revertedTransactions.push(transaction);
            }

            const reverted: boolean = delegate.revertBlock(block.data);

            // If the block has been reverted, the balance is decreased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (reverted && delegate.vote) {
                const decrease: Utils.BigNumber = block.data.reward.plus(block.data.totalFee);
                const votedDelegate: State.IWallet = this.findByPublicKey(delegate.vote);
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

        transactionHandler.apply(transaction, this);

        const sender: State.IWallet = this.findByPublicKey(transaction.data.senderPublicKey);
        const recipient: State.IWallet = this.findByAddress(transaction.data.recipientId);

        this.updateVoteBalances(sender, recipient, transaction.data);
    }

    public revertTransaction(transaction: Interfaces.ITransaction): void {
        const { data } = transaction;

        const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(transaction.type);
        const sender: State.IWallet = this.findByPublicKey(data.senderPublicKey);
        const recipient: State.IWallet = this.findByAddress(data.recipientId);

        transactionHandler.revert(transaction, this);

        // Revert vote balance updates
        this.updateVoteBalances(sender, recipient, data, true);
    }

    public isDelegate(publicKey: string): boolean {
        if (!this.has(publicKey)) {
            return false;
        }

        return !!this.findByPublicKey(publicKey).username;
    }

    public canBePurged(wallet: State.IWallet): boolean {
        return wallet.balance.isZero() && !wallet.secondPublicKey && !wallet.multisignature && !wallet.username;
    }

    /**
     * Reset the wallets index.
     * @return {void}
     */
    public reset(): void {
        this.byAddress = {};
        this.byPublicKey = {};
        this.byUsername = {};
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
                            `The balance and public key of both delegates are identical! Delegate "${a.username}" appears twice in the list.`,
                        );
                    }

                    return a.publicKey.localeCompare(b.publicKey, "en");
                }

                return diff;
            })
            .map((delegate, i) => {
                const rate = i + 1;
                this.findByUsername(delegate.username).rate = rate;
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
        revert: boolean = false,
    ): void {
        // TODO: multipayment?
        if (transaction.type !== Enums.TransactionTypes.Vote) {
            // Update vote balance of the sender's delegate
            if (sender.vote) {
                const delegate: State.IWallet = this.findByPublicKey(sender.vote);
                const total: Utils.BigNumber = transaction.amount.plus(transaction.fee);
                delegate.voteBalance = revert ? delegate.voteBalance.plus(total) : delegate.voteBalance.minus(total);
            }

            // Update vote balance of recipient's delegate
            if (recipient && recipient.vote) {
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
