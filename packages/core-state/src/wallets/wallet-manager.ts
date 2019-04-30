import { app } from "@arkecosystem/core-container";
import { Database, Logger, Shared } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import cloneDeep from "lodash.clonedeep";
import pluralize from "pluralize";
import { Wallet } from "./wallet";

export class WalletManager implements Database.IWalletManager {
    // @TODO: make this private and read-only
    public byAddress: { [key: string]: Database.IWallet };
    // @TODO: make this private and read-only
    public byPublicKey: { [key: string]: Database.IWallet };
    // @TODO: make this private and read-only
    public byUsername: { [key: string]: Database.IWallet };
    // @TODO: make this private and read-only
    public logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    constructor() {
        this.reset();
    }

    public allByAddress(): Database.IWallet[] {
        return Object.values(this.byAddress);
    }

    public allByPublicKey(): Database.IWallet[] {
        return Object.values(this.byPublicKey);
    }

    public allByUsername(): Database.IWallet[] {
        return Object.values(this.byUsername);
    }

    public findByAddress(address: string): Database.IWallet {
        if (address && !this.byAddress[address]) {
            this.byAddress[address] = new Wallet(address);
        }

        return this.byAddress[address];
    }

    public findByPublicKey(publicKey: string): Database.IWallet {
        if (publicKey && !this.byPublicKey[publicKey]) {
            const address = Identities.Address.fromPublicKey(publicKey);

            const wallet = this.findByAddress(address);
            wallet.publicKey = publicKey;
            this.byPublicKey[publicKey] = wallet;
        }

        return this.byPublicKey[publicKey];
    }

    public findByUsername(username: string): Database.IWallet {
        return this.byUsername[username];
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

    public forgetByAddress(address: string): void {
        delete this.byAddress[address];
    }

    public forgetByPublicKey(publicKey: string): void {
        delete this.byPublicKey[publicKey];
    }

    public forgetByUsername(username: string): void {
        delete this.byUsername[username];
    }

    public index(wallets: Database.IWallet[]): void {
        for (const wallet of wallets) {
            this.reindex(wallet);
        }
    }

    public reindex(wallet: Database.IWallet): void {
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

    public cloneDelegateWallets(): WalletManager {
        const walletManager: WalletManager = new WalletManager();
        walletManager.index(cloneDeep(this.allByUsername()));
        return walletManager;
    }

    public loadActiveDelegateList(roundInfo: Shared.IRoundInfo): Database.IDelegateWallet[] {
        const { maxDelegates } = roundInfo;
        const delegatesWallets: Database.IWallet[] = this.allByUsername();

        if (delegatesWallets.length < maxDelegates) {
            throw new Error(
                `Expected to find ${maxDelegates} delegates but only found ${
                    delegatesWallets.length
                }. This indicates an issue with the genesis block & delegates.`,
            );
        }

        const delegates: Database.IWallet[] = this.buildDelegateRanking(delegatesWallets, roundInfo);

        this.logger.debug(`Loaded ${delegates.length} active ${pluralize("delegate", delegates.length)}`);

        return delegates as Database.IDelegateWallet[];
    }

    // Only called during integrity verification on boot.
    public buildVoteBalances(): void {
        for (const voter of Object.values(this.byPublicKey)) {
            if (voter.vote) {
                const delegate: Database.IWallet = this.byPublicKey[voter.vote];
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

        let delegate: Database.IWallet = this.byPublicKey[block.data.generatorPublicKey];

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
            block.transactions.forEach(transaction => {
                this.applyTransaction(transaction);
                appliedTransactions.push(transaction);
            });

            const applied: boolean = delegate.applyBlock(block.data);

            // If the block has been applied to the delegate, the balance is increased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (applied && delegate.vote) {
                const increase: Utils.BigNumber = block.data.reward.plus(block.data.totalFee);
                const votedDelegate: Database.IWallet = this.byPublicKey[delegate.vote];
                votedDelegate.voteBalance = votedDelegate.voteBalance.plus(increase);
            }
        } catch (error) {
            this.logger.error("Failed to apply all transactions in block - reverting previous transactions");

            // Revert the applied transactions from last to first
            appliedTransactions
                .reverse()
                .forEach((transaction: Interfaces.ITransaction) => this.revertTransaction(transaction));

            // for (let i = appliedTransactions.length - 1; i >= 0; i--) {
            //     this.revertTransaction(appliedTransactions[i]);
            // }
            // TODO: should revert the delegate applyBlock ?
            // TBC: whatever situation `delegate.applyBlock(block.data)` is never applied

            throw error;
        }
    }

    public revertBlock(block: Interfaces.IBlock): void {
        const delegate: Database.IWallet = this.byPublicKey[block.data.generatorPublicKey];

        if (!delegate) {
            app.forceExit(`Failed to lookup generator '${block.data.generatorPublicKey}' of block '${block.data.id}'.`);
        }

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
                const votedDelegate: Database.IWallet = this.byPublicKey[delegate.vote];
                votedDelegate.voteBalance = votedDelegate.voteBalance.minus(decrease);
            }
        } catch (error) {
            this.logger.error(error.stack);

            revertedTransactions
                .reverse()
                .forEach((transaction: Interfaces.ITransaction) => this.applyTransaction(transaction));

            throw error;
        }
    }

    public applyTransaction(transaction: Interfaces.ITransaction): void {
        const { data } = transaction;
        const { type, recipientId, senderPublicKey } = data;

        const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(transaction.type);
        const sender: Database.IWallet = this.findByPublicKey(senderPublicKey);
        const recipient: Database.IWallet = this.findByAddress(recipientId);

        // TODO: can/should be removed?
        if (type === Enums.TransactionTypes.SecondSignature) {
            data.recipientId = "";
        }

        // handle exceptions / verify that we can apply the transaction to the sender
        if (Utils.isException(data)) {
            this.logger.warn(`Transaction ${data.id} forcibly applied because it has been added as an exception.`);
        } else {
            try {
                transactionHandler.canBeApplied(transaction, sender, this);
            } catch (error) {
                this.logger.error(
                    `Can't apply transaction id:${data.id} from sender:${sender.address} due to ${error.message}`,
                );
                this.logger.debug(`Audit: ${JSON.stringify(sender.auditApply(data), null, 2)}`);
                throw new Error(`Can't apply transaction ${data.id}`);
            }
        }

        transactionHandler.apply(transaction, this);
        this.updateVoteBalances(sender, recipient, data);
    }

    public revertTransaction(transaction: Interfaces.ITransaction): void {
        const { data } = transaction;

        const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(transaction.type);
        const sender: Database.IWallet = this.findByPublicKey(data.senderPublicKey);
        const recipient: Database.IWallet = this.byAddress[data.recipientId];

        transactionHandler.revert(transaction, this);

        // Revert vote balance updates
        this.updateVoteBalances(sender, recipient, data, true);
    }

    public isDelegate(publicKey: string): boolean {
        const delegateWallet: Database.IWallet = this.byPublicKey[publicKey];

        if (delegateWallet && delegateWallet.username) {
            return this.hasByUsername(delegateWallet.username);
        }

        return false;
    }

    public canBePurged(wallet: Database.IWallet): boolean {
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

    public buildDelegateRanking(
        delegates: Database.IWallet[],
        roundInfo?: Shared.IRoundInfo,
    ): Database.IDelegateWallet[] {
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
                            null,
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
        sender: Database.IWallet,
        recipient: Database.IWallet,
        transaction: Interfaces.ITransactionData,
        revert: boolean = false,
    ): void {
        // TODO: multipayment?
        if (transaction.type !== Enums.TransactionTypes.Vote) {
            // Update vote balance of the sender's delegate
            if (sender.vote) {
                const delegate: Database.IWallet = this.findByPublicKey(sender.vote);
                const total: Utils.BigNumber = transaction.amount.plus(transaction.fee);
                delegate.voteBalance = revert ? delegate.voteBalance.plus(total) : delegate.voteBalance.minus(total);
            }

            // Update vote balance of recipient's delegate
            if (recipient && recipient.vote) {
                const delegate: Database.IWallet = this.findByPublicKey(recipient.vote);
                delegate.voteBalance = revert
                    ? delegate.voteBalance.minus(transaction.amount)
                    : delegate.voteBalance.plus(transaction.amount);
            }
        } else {
            const vote: string = transaction.asset.votes[0];
            const delegate: Database.IWallet = this.findByPublicKey(vote.substr(1));

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
