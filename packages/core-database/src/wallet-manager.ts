import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import { TransactionServiceRegistry } from "@arkecosystem/core-transactions";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Bignum, constants, crypto, formatSatoshi, isException, models, Transaction } from "@arkecosystem/crypto";
import pluralize from "pluralize";

const { TransactionTypes } = constants;

export class WalletManager implements Database.IWalletManager {
    public logger = app.resolvePlugin<Logger.ILogger>("logger");
    public config = app.getConfig();

    public networkId: number;
    public byAddress: { [key: string]: models.Wallet };
    public byPublicKey: { [key: string]: models.Wallet };
    public byUsername: { [key: string]: models.Wallet };

    /**
     * Create a new wallet manager instance.
     * @constructor
     */
    constructor() {
        this.networkId = this.config ? this.config.get("network.pubKeyHash") : 0x17;
        this.reset();
    }

    public allByAddress(): models.Wallet[] {
        return Object.values(this.byAddress);
    }

    /**
     * Get all wallets by publicKey.
     */
    public allByPublicKey(): models.Wallet[] {
        return Object.values(this.byPublicKey);
    }

    /**
     * Get all wallets by username.
     * @return {Array}
     */
    public allByUsername(): models.Wallet[] {
        return Object.values(this.byUsername);
    }

    /**
     * Find a wallet by the given address.
     */
    public findByAddress(address: string): models.Wallet {
        if (!this.byAddress[address]) {
            this.byAddress[address] = new models.Wallet(address);
        }

        return this.byAddress[address];
    }

    /**
     * Checks if wallet exits in wallet manager
     * @param  {String} key can be publicKey or address of wallet
     */
    public exists(key: string) {
        if (this.byPublicKey[key]) {
            return true;
        }

        return !!this.byAddress[key];
    }

    /**
     * Find a wallet by the given public key.
     * @param  {String} publicKey
     * @return {Wallet}
     */
    public findByPublicKey(publicKey: string): models.Wallet {
        if (!this.byPublicKey[publicKey]) {
            const address = crypto.getAddress(publicKey, this.networkId);

            const wallet = this.findByAddress(address);
            wallet.publicKey = publicKey;
            this.byPublicKey[publicKey] = wallet;
        }

        return this.byPublicKey[publicKey];
    }

    /**
     * Find a wallet by the given username.
     * @param  {String} username
     * @return {Wallet}
     */
    public findByUsername(username: string): models.Wallet {
        return this.byUsername[username];
    }

    /**
     * Set wallet by address.
     * @param {String} address
     * @param {Wallet} wallet
     */
    public setByAddress(address, wallet) {
        this.byAddress[address] = wallet;
    }

    /**
     * Set wallet by publicKey.
     * @param {String} publicKey
     * @param {Wallet} wallet
     */
    public setByPublicKey(publicKey, wallet) {
        this.byPublicKey[publicKey] = wallet;
    }

    /**
     * Set wallet by username.
     * @param {String} username
     * @param {Wallet} wallet
     */
    public setByUsername(username, wallet) {
        this.byUsername[username] = wallet;
    }

    /**
     * Remove wallet by address.
     * @param {String} address
     */
    public forgetByAddress(address) {
        delete this.byAddress[address];
    }

    /**
     * Remove wallet by publicKey.
     * @param {String} publicKey
     */
    public forgetByPublicKey(publicKey) {
        delete this.byPublicKey[publicKey];
    }

    /**
     * Remove wallet by username.
     * @param {String} username
     */
    public forgetByUsername(username) {
        delete this.byUsername[username];
    }

    /**
     * Index the given wallets.
     * @param  {Array} wallets
     * @return {void}
     */
    public index(wallets) {
        for (const wallet of wallets) {
            this.reindex(wallet);
        }
    }

    /**
     * Reindex the given wallet.
     * @param  {Wallet} wallet
     * @return {void}
     */
    public reindex(wallet: models.Wallet) {
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

    public clear() {
        Object.values(this.byAddress).forEach(wallet => {
            wallet.dirty = false;
        });
    }

    /**
     * Load a list of all active delegates.
     * @param  {Number} maxDelegates
     * @param height
     * @return {Array}
     */
    public loadActiveDelegateList(maxDelegates: number, height?: number): any[] {
        if (height > 1 && height % maxDelegates !== 1) {
            throw new Error("Trying to build delegates outside of round change");
        }

        const { round } = roundCalculator.calculateRound(height, maxDelegates);
        const delegatesWallets = this.allByUsername();

        if (delegatesWallets.length < maxDelegates) {
            throw new Error(
                `Expected to find ${maxDelegates} delegates but only found ${
                    delegatesWallets.length
                }. This indicates an issue with the genesis block & delegates.`,
            );
        }

        const equalVotesMap = new Map();

        const delegates = delegatesWallets
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
                return { ...{ round }, ...delegate, rate };
            })
            .slice(0, maxDelegates);

        for (const [voteBalance, set] of equalVotesMap.entries()) {
            const values: any[] = Array.from(set.values());
            if (delegates.includes(values[0])) {
                const mapped = values.map(v => `${v.username} (${v.publicKey})`);
                this.logger.warn(
                    `Delegates ${JSON.stringify(mapped, null, 4)} have a matching vote balance of ${formatSatoshi(
                        voteBalance,
                    )}`,
                );
            }
        }

        this.logger.debug(`Loaded ${delegates.length} active ${pluralize("delegate", delegates.length)}`);

        return delegates;
    }

    /**
     * Build vote balances of all delegates.
     * NOTE: Only called during SPV.
     * @return {void}
     */
    public buildVoteBalances() {
        Object.values(this.byPublicKey).forEach(voter => {
            if (voter.vote) {
                const delegate = this.byPublicKey[voter.vote];
                delegate.voteBalance = delegate.voteBalance.plus(voter.balance);
            }
        });
    }

    /**
     * Remove non-delegate wallets that have zero (0) balance from memory.
     * @return {void}
     */
    public purgeEmptyNonDelegates() {
        Object.values(this.byPublicKey).forEach(wallet => {
            if (this.canBePurged(wallet)) {
                delete this.byPublicKey[wallet.publicKey];
                delete this.byAddress[wallet.address];
            }
        });
    }

    /**
     * Apply the given block to a delegate.
     * @param  {Block} block
     * @return {void}
     */
    public applyBlock(block: models.Block) {
        const generatorPublicKey = block.data.generatorPublicKey;

        let delegate = this.byPublicKey[block.data.generatorPublicKey];

        if (!delegate) {
            const generator = crypto.getAddress(generatorPublicKey, this.networkId);

            if (block.data.height === 1) {
                delegate = new models.Wallet(generator);
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

        const appliedTransactions = [];

        try {
            block.transactions.forEach(transaction => {
                this.applyTransaction(transaction);
                appliedTransactions.push(transaction);
            });

            const applied = delegate.applyBlock(block.data);

            // If the block has been applied to the delegate, the balance is increased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (applied && delegate.vote) {
                const increase = (block.data.reward as Bignum).plus(block.data.totalFee);
                const votedDelegate = this.byPublicKey[delegate.vote];
                votedDelegate.voteBalance = votedDelegate.voteBalance.plus(increase);
            }
        } catch (error) {
            this.logger.error("Failed to apply all transactions in block - reverting previous transactions");
            // Revert the applied transactions from last to first
            for (let i = appliedTransactions.length - 1; i >= 0; i--) {
                this.revertTransaction(appliedTransactions[i]);
            }

            // TODO: should revert the delegate applyBlock ?
            // TBC: whatever situation `delegate.applyBlock(block.data)` is never applied

            throw error;
        }
    }

    /**
     * Remove the given block from a delegate.
     * @param  {Block} block
     * @return {void}
     */
    public revertBlock(block: models.Block) {
        const delegate = this.byPublicKey[block.data.generatorPublicKey];

        if (!delegate) {
            app.forceExit(`Failed to lookup generator '${block.data.generatorPublicKey}' of block '${block.data.id}'.`);
        }

        const revertedTransactions = [];

        try {
            // Revert the transactions from last to first
            for (let i = block.transactions.length - 1; i >= 0; i--) {
                const transaction = block.transactions[i];
                this.revertTransaction(transaction);
                revertedTransactions.push(transaction);
            }

            const reverted = delegate.revertBlock(block.data);

            // If the block has been reverted, the balance is decreased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (reverted && delegate.vote) {
                const decrease = (block.data.reward as Bignum).plus(block.data.totalFee);
                const votedDelegate = this.byPublicKey[delegate.vote];
                votedDelegate.voteBalance = votedDelegate.voteBalance.minus(decrease);
            }
        } catch (error) {
            this.logger.error(error.stack);

            revertedTransactions.reverse().forEach(transaction => this.applyTransaction(transaction));

            throw error;
        }
    }

    /**
     * Apply the given transaction to a delegate.
     */
    public applyTransaction(transaction: Transaction) {
        const { data } = transaction;
        const { type, asset, recipientId, senderPublicKey } = data;

        const transactionService = TransactionServiceRegistry.get(transaction.type);
        const sender = this.findByPublicKey(senderPublicKey);
        const recipient = this.findByAddress(recipientId);
        const errors = [];

        // TODO: can/should be removed?
        if (type === TransactionTypes.SecondSignature) {
            data.recipientId = "";
        }

        // handle exceptions / verify that we can apply the transaction to the sender
        if (isException(data)) {
            this.logger.warn(`Transaction ${data.id} forcibly applied because it has been added as an exception.`);
        } else if (!transactionService.canBeApplied(transaction, sender)) {
            this.logger.error(
                `Can't apply transaction id:${data.id} from sender:${sender.address} due to ${JSON.stringify(errors)}`,
            );
            this.logger.debug(`Audit: ${JSON.stringify(sender.auditApply(data), null, 2)}`);
            throw new Error(`Can't apply transaction ${data.id}`);
        }

        transactionService.applyToSender(transaction, sender);

        if (type === TransactionTypes.DelegateRegistration) {
            this.reindex(sender);
        }

        // TODO: make more generic
        if (recipient && type === TransactionTypes.Transfer) {
            transactionService.applyToRecipient(transaction, recipient);
        }

        this._updateVoteBalances(sender, recipient, data);
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
     * @param  {Wallet} sender
     * @param  {Wallet} recipient
     * @param  {Transaction} transaction
     * @param  {Boolean} revert
     * @return {Transaction}
     */
    public _updateVoteBalances(sender, recipient, transaction, revert = false) {
        // TODO: multipayment?
        if (transaction.type !== TransactionTypes.Vote) {
            // Update vote balance of the sender's delegate
            if (sender.vote) {
                const delegate = this.findByPublicKey(sender.vote);
                const total = transaction.amount.plus(transaction.fee);
                delegate.voteBalance = revert ? delegate.voteBalance.plus(total) : delegate.voteBalance.minus(total);
            }

            // Update vote balance of recipient's delegate
            if (recipient && recipient.vote) {
                const delegate = this.findByPublicKey(recipient.vote);
                delegate.voteBalance = revert
                    ? delegate.voteBalance.minus(transaction.amount)
                    : delegate.voteBalance.plus(transaction.amount);
            }
        } else {
            const vote = transaction.asset.votes[0];
            const delegate = this.findByPublicKey(vote.substr(1));

            if (vote.startsWith("+")) {
                delegate.voteBalance = revert
                    ? delegate.voteBalance.minus(sender.balance)
                    : delegate.voteBalance.plus(sender.balance);
            } else {
                delegate.voteBalance = revert
                    ? delegate.voteBalance.plus(sender.balance.plus(transaction.fee))
                    : delegate.voteBalance.minus(sender.balance.plus(transaction.fee));
            }
        }
    }

    /**
     * Remove the given transaction from a delegate.
     */
    public revertTransaction(transaction: Transaction) {
        const { type, data } = transaction;
        const transactionService = TransactionServiceRegistry.get(transaction.type);
        const sender = this.findByPublicKey(data.senderPublicKey); // Should exist
        const recipient = this.byAddress[data.recipientId];

        transactionService.revertForSender(transaction, sender);

        // removing the wallet from the delegates index
        if (type === TransactionTypes.DelegateRegistration) {
            delete this.byUsername[data.asset.delegate.username];
        }

        if (recipient && type === TransactionTypes.Transfer) {
            transactionService.revertForRecipient(transaction, recipient);
        }

        // Revert vote balance updates
        this._updateVoteBalances(sender, recipient, data, true);
    }

    /**
     * Checks if a given publicKey is a registered delegate
     * @param {String} publicKey
     */
    public isDelegate(publicKey: string) {
        const delegateWallet = this.byPublicKey[publicKey];

        if (delegateWallet && delegateWallet.username) {
            return !!this.byUsername[delegateWallet.username];
        }

        return false;
    }

    /**
     * Determine if the wallet can be removed from memory.
     * @param  {Object} wallet
     * @return {Boolean}
     */
    public canBePurged(wallet) {
        return wallet.balance.isZero() && !wallet.secondPublicKey && !wallet.multisignature && !wallet.username;
    }

    /**
     * Reset the wallets index.
     * @return {void}
     */
    public reset() {
        this.byAddress = {};
        this.byPublicKey = {};
        this.byUsername = {};
    }
}
