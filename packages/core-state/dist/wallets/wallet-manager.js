"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const crypto_1 = require("@arkecosystem/crypto");
const pluralize_1 = __importDefault(require("pluralize"));
const errors_1 = require("./errors");
const temp_wallet_manager_1 = require("./temp-wallet-manager");
const wallet_1 = require("./wallet");
const wallet_index_1 = require("./wallet-index");
class WalletManager {
    constructor() {
        // @TODO: make this private and read-only
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.indexes = {};
        this.reset();
        this.registerIndex(core_interfaces_1.State.WalletIndexes.Addresses, (index, wallet) => {
            if (wallet.address) {
                index.set(wallet.address, wallet);
            }
        });
        this.registerIndex(core_interfaces_1.State.WalletIndexes.PublicKeys, (index, wallet) => {
            if (wallet.publicKey) {
                index.set(wallet.publicKey, wallet);
            }
        });
        this.registerIndex(core_interfaces_1.State.WalletIndexes.Usernames, (index, wallet) => {
            if (wallet.isDelegate()) {
                index.set(wallet.getAttribute("delegate.username"), wallet);
            }
        });
        this.registerIndex(core_interfaces_1.State.WalletIndexes.Resignations, (index, wallet) => {
            if (wallet.isDelegate() && wallet.getAttribute("delegate.resigned")) {
                index.set(wallet.getAttribute("delegate.username"), wallet);
            }
        });
        this.registerIndex(core_interfaces_1.State.WalletIndexes.Locks, (index, wallet) => {
            const locks = wallet.getAttribute("htlc.locks");
            if (locks) {
                for (const lockId of Object.keys(locks)) {
                    index.set(lockId, wallet);
                }
            }
        });
        this.registerIndex(core_interfaces_1.State.WalletIndexes.Ipfs, (index, wallet) => {
            const hashes = wallet.getAttribute("ipfs.hashes");
            if (hashes) {
                for (const hash of Object.keys(hashes)) {
                    index.set(hash, wallet);
                }
            }
        });
    }
    registerIndex(name, indexer) {
        if (this.indexes[name]) {
            throw new errors_1.WalletIndexAlreadyRegisteredError(name);
        }
        this.indexes[name] = new wallet_index_1.WalletIndex(indexer);
    }
    unregisterIndex(name) {
        if (!this.indexes[name]) {
            throw new errors_1.WalletIndexNotFoundError(name);
        }
        delete this.indexes[name];
    }
    getIndex(name) {
        if (!this.indexes[name]) {
            throw new errors_1.WalletIndexNotFoundError(name);
        }
        return this.indexes[name];
    }
    getIndexNames() {
        return Object.keys(this.indexes);
    }
    allByAddress() {
        return this.getIndex(core_interfaces_1.State.WalletIndexes.Addresses).values();
    }
    allByPublicKey() {
        return this.getIndex(core_interfaces_1.State.WalletIndexes.PublicKeys).values();
    }
    allByUsername() {
        return this.getIndex(core_interfaces_1.State.WalletIndexes.Usernames).values();
    }
    findById(id) {
        for (const index of Object.values(this.indexes)) {
            const wallet = index.get(id);
            if (wallet) {
                return wallet;
            }
        }
        return undefined;
    }
    findByAddress(address) {
        const index = this.getIndex(core_interfaces_1.State.WalletIndexes.Addresses);
        if (address && !index.has(address)) {
            index.set(address, new wallet_1.Wallet(address));
        }
        return index.get(address);
    }
    findByPublicKey(publicKey) {
        const index = this.getIndex(core_interfaces_1.State.WalletIndexes.PublicKeys);
        if (publicKey && !index.has(publicKey)) {
            const address = crypto_1.Identities.Address.fromPublicKey(publicKey);
            const wallet = this.findByAddress(address);
            wallet.publicKey = publicKey;
            index.set(publicKey, wallet);
        }
        return index.get(publicKey);
    }
    findByUsername(username) {
        return this.findByIndex(core_interfaces_1.State.WalletIndexes.Usernames, username);
    }
    findByIndex(index, key) {
        if (!Array.isArray(index)) {
            index = [index];
        }
        for (const name of index) {
            const index = this.getIndex(name);
            if (index.has(key)) {
                return index.get(key);
            }
        }
        return undefined;
    }
    has(key) {
        for (const walletIndex of Object.values(this.indexes)) {
            if (walletIndex.has(key)) {
                return true;
            }
        }
        return false;
    }
    hasByAddress(address) {
        return this.hasByIndex(core_interfaces_1.State.WalletIndexes.Addresses, address);
    }
    hasByPublicKey(publicKey) {
        return this.hasByIndex(core_interfaces_1.State.WalletIndexes.PublicKeys, publicKey);
    }
    hasByUsername(username) {
        return this.hasByIndex(core_interfaces_1.State.WalletIndexes.Usernames, username);
    }
    hasByIndex(indexName, key) {
        return this.getIndex(indexName).has(key);
    }
    getNonce(publicKey) {
        if (this.hasByPublicKey(publicKey)) {
            return this.findByPublicKey(publicKey).nonce;
        }
        return crypto_1.Utils.BigNumber.ZERO;
    }
    forgetByAddress(address) {
        this.forgetByIndex(core_interfaces_1.State.WalletIndexes.Addresses, address);
    }
    forgetByPublicKey(publicKey) {
        this.forgetByIndex(core_interfaces_1.State.WalletIndexes.PublicKeys, publicKey);
    }
    forgetByUsername(username) {
        this.forgetByIndex(core_interfaces_1.State.WalletIndexes.Usernames, username);
    }
    forgetByIndex(indexName, key) {
        this.getIndex(indexName).forget(key);
    }
    index(wallets) {
        for (const wallet of wallets) {
            this.reindex(wallet);
        }
    }
    reindex(wallet) {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.index(wallet);
        }
    }
    getCurrentBlock() {
        return this.currentBlock;
    }
    clone() {
        return new temp_wallet_manager_1.TempWalletManager(this);
    }
    loadActiveDelegateList(roundInfo) {
        const delegates = this.buildDelegateRanking(roundInfo);
        const { maxDelegates } = roundInfo;
        if (delegates.length < maxDelegates) {
            throw new Error(`Expected to find ${maxDelegates} delegates but only found ${delegates.length}. ` +
                `This indicates an issue with the genesis block & delegates.`);
        }
        this.logger.debug(`Loaded ${delegates.length} active ${pluralize_1.default("delegate", delegates.length)}`);
        return delegates;
    }
    // Only called during integrity verification on boot.
    buildVoteBalances() {
        for (const voter of this.allByPublicKey()) {
            if (voter.hasVoted()) {
                const delegate = this.findByPublicKey(voter.getAttribute("vote"));
                const voteBalance = delegate.getAttribute("delegate.voteBalance");
                const lockedBalance = voter.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
                delegate.setAttribute("delegate.voteBalance", voteBalance.plus(voter.balance).plus(lockedBalance));
            }
        }
    }
    async applyBlock(block) {
        this.currentBlock = block;
        const generatorPublicKey = block.data.generatorPublicKey;
        let delegate;
        if (!this.has(generatorPublicKey)) {
            const generator = crypto_1.Identities.Address.fromPublicKey(generatorPublicKey);
            if (block.data.height === 1) {
                delegate = new wallet_1.Wallet(generator);
                delegate.publicKey = generatorPublicKey;
                this.reindex(delegate);
            }
            else {
                core_container_1.app.forceExit(`Failed to lookup generator '${generatorPublicKey}' of block '${block.data.id}'.`);
            }
        }
        else {
            delegate = this.findByPublicKey(block.data.generatorPublicKey);
        }
        const appliedTransactions = [];
        try {
            for (const transaction of block.transactions) {
                await this.applyTransaction(transaction);
                appliedTransactions.push(transaction);
            }
            const applied = delegate.applyBlock(block.data);
            // If the block has been applied to the delegate, the balance is increased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (applied && delegate.hasVoted()) {
                const increase = block.data.reward.plus(block.data.totalFee);
                const votedDelegate = this.findByPublicKey(delegate.getAttribute("vote"));
                const voteBalance = votedDelegate.getAttribute("delegate.voteBalance");
                votedDelegate.setAttribute("delegate.voteBalance", voteBalance.plus(increase));
            }
        }
        catch (error) {
            this.logger.error("Failed to apply all transactions in block - reverting previous transactions");
            // Revert the applied transactions from last to first
            for (const transaction of appliedTransactions.reverse()) {
                await this.revertTransaction(transaction);
            }
            throw error;
        }
        finally {
            this.currentBlock = undefined;
        }
    }
    async revertBlock(block) {
        if (!this.has(block.data.generatorPublicKey)) {
            core_container_1.app.forceExit(`Failed to lookup generator '${block.data.generatorPublicKey}' of block '${block.data.id}'.`);
        }
        this.currentBlock = block;
        const delegate = this.findByPublicKey(block.data.generatorPublicKey);
        const revertedTransactions = [];
        try {
            // Revert the transactions from last to first
            for (let i = block.transactions.length - 1; i >= 0; i--) {
                const transaction = block.transactions[i];
                await this.revertTransaction(transaction);
                revertedTransactions.push(transaction);
            }
            const reverted = delegate.revertBlock(block.data);
            // If the block has been reverted, the balance is decreased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (reverted && delegate.hasVoted()) {
                const decrease = block.data.reward.plus(block.data.totalFee);
                const votedDelegate = this.findByPublicKey(delegate.getAttribute("vote"));
                const voteBalance = votedDelegate.getAttribute("delegate.voteBalance");
                votedDelegate.setAttribute("delegate.voteBalance", voteBalance.minus(decrease));
            }
        }
        catch (error) {
            this.logger.error(error.stack);
            for (const transaction of revertedTransactions.reverse()) {
                await this.applyTransaction(transaction);
            }
            throw error;
        }
        finally {
            this.currentBlock = undefined;
        }
    }
    async applyTransaction(transaction) {
        const transactionHandler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
        let lockWallet;
        let lockTransaction;
        if (transaction.type === crypto_1.Enums.TransactionType.HtlcClaim &&
            transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.findByIndex(core_interfaces_1.State.WalletIndexes.Locks, lockId);
            lockTransaction = lockWallet.getAttribute("htlc.locks", {})[lockId];
        }
        await transactionHandler.apply(transaction, this);
        const sender = this.findByPublicKey(transaction.data.senderPublicKey);
        const recipient = this.findByAddress(transaction.data.recipientId);
        this.updateVoteBalances(sender, recipient, transaction.data, lockWallet, lockTransaction);
    }
    async revertTransaction(transaction) {
        const { data } = transaction;
        const transactionHandler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
        const sender = this.findByPublicKey(data.senderPublicKey);
        const recipient = this.findByAddress(data.recipientId);
        await transactionHandler.revert(transaction, this);
        let lockWallet;
        let lockTransaction;
        if (transaction.type === crypto_1.Enums.TransactionType.HtlcClaim &&
            transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.findByIndex(core_interfaces_1.State.WalletIndexes.Locks, lockId);
            lockTransaction = lockWallet.getAttribute("htlc.locks", {})[lockId];
        }
        // Revert vote balance updates
        this.updateVoteBalances(sender, recipient, data, lockWallet, lockTransaction, true);
    }
    canBePurged(wallet) {
        return wallet.canBePurged();
    }
    reset() {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }
    buildDelegateRanking(roundInfo) {
        const delegatesActive = [];
        for (const delegate of this.allByUsername()) {
            if (delegate.hasAttribute("delegate.resigned")) {
                delegate.forgetAttribute("delegate.rank");
            }
            else {
                delegatesActive.push(delegate);
            }
        }
        let delegatesSorted = delegatesActive
            .sort((a, b) => {
            const voteBalanceA = a.getAttribute("delegate.voteBalance");
            const voteBalanceB = b.getAttribute("delegate.voteBalance");
            const diff = voteBalanceB.comparedTo(voteBalanceA);
            if (diff === 0) {
                if (a.publicKey === b.publicKey) {
                    throw new Error(`The balance and public key of both delegates are identical! Delegate "${a.getAttribute("delegate.username")}" appears twice in the list.`);
                }
                return a.publicKey.localeCompare(b.publicKey, "en");
            }
            return diff;
        })
            .map((delegate, i) => {
            const rank = i + 1;
            delegate.setAttribute("delegate.rank", rank);
            return delegate;
        });
        if (roundInfo) {
            delegatesSorted = delegatesSorted.slice(0, roundInfo.maxDelegates);
            for (const delegate of delegatesSorted) {
                delegate.setAttribute("delegate.round", roundInfo.round);
            }
        }
        return delegatesSorted;
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
    updateVoteBalances(sender, recipient, transaction, lockWallet, lockTransaction, revert = false) {
        if (transaction.type === crypto_1.Enums.TransactionType.Vote &&
            transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core) {
            const vote = transaction.asset.votes[0];
            const delegate = this.findByPublicKey(vote.substr(1));
            let voteBalance = delegate.getAttribute("delegate.voteBalance", crypto_1.Utils.BigNumber.ZERO);
            const senderLockedBalance = sender.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
            if (vote.startsWith("+")) {
                voteBalance = revert
                    ? voteBalance.minus(sender.balance.minus(transaction.fee)).minus(senderLockedBalance)
                    : voteBalance.plus(sender.balance).plus(senderLockedBalance);
            }
            else {
                voteBalance = revert
                    ? voteBalance.plus(sender.balance).plus(senderLockedBalance)
                    : voteBalance.minus(sender.balance.plus(transaction.fee)).minus(senderLockedBalance);
            }
            delegate.setAttribute("delegate.voteBalance", voteBalance);
        }
        else {
            // Update vote balance of the sender's delegate
            if (sender.hasVoted()) {
                const delegate = this.findByPublicKey(sender.getAttribute("vote"));
                const amount = transaction.type === crypto_1.Enums.TransactionType.MultiPayment &&
                    transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core
                    ? transaction.asset.payments.reduce((prev, curr) => prev.plus(curr.amount), crypto_1.Utils.BigNumber.ZERO)
                    : transaction.amount;
                const total = amount.plus(transaction.fee);
                const voteBalance = delegate.getAttribute("delegate.voteBalance", crypto_1.Utils.BigNumber.ZERO);
                let newVoteBalance;
                if (transaction.type === crypto_1.Enums.TransactionType.HtlcLock &&
                    transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core) {
                    // HTLC Lock keeps the locked amount as the sender's delegate vote balance
                    newVoteBalance = revert ? voteBalance.plus(transaction.fee) : voteBalance.minus(transaction.fee);
                }
                else if (transaction.type === crypto_1.Enums.TransactionType.HtlcClaim &&
                    transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core) {
                    // HTLC Claim transfers the locked amount to the lock recipient's (= claim sender) delegate vote balance
                    newVoteBalance = revert
                        ? voteBalance.plus(transaction.fee).minus(lockTransaction.amount)
                        : voteBalance.minus(transaction.fee).plus(lockTransaction.amount);
                }
                else {
                    // General case : sender delegate vote balance reduced by amount + fees (or increased if revert)
                    newVoteBalance = revert ? voteBalance.plus(total) : voteBalance.minus(total);
                }
                delegate.setAttribute("delegate.voteBalance", newVoteBalance);
            }
            if (transaction.type === crypto_1.Enums.TransactionType.HtlcClaim &&
                transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core &&
                lockWallet.hasAttribute("vote")) {
                // HTLC Claim transfers the locked amount to the lock recipient's (= claim sender) delegate vote balance
                const lockWalletDelegate = this.findByPublicKey(lockWallet.getAttribute("vote"));
                const lockWalletDelegateVoteBalance = lockWalletDelegate.getAttribute("delegate.voteBalance", crypto_1.Utils.BigNumber.ZERO);
                lockWalletDelegate.setAttribute("delegate.voteBalance", revert
                    ? lockWalletDelegateVoteBalance.plus(lockTransaction.amount)
                    : lockWalletDelegateVoteBalance.minus(lockTransaction.amount));
            }
            if (transaction.type === crypto_1.Enums.TransactionType.MultiPayment &&
                transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core) {
                // go through all payments and update recipients delegates vote balance
                for (const { recipientId, amount } of transaction.asset.payments) {
                    const recipientWallet = this.findByAddress(recipientId);
                    const vote = recipientWallet.getAttribute("vote");
                    if (vote) {
                        const delegate = this.findByPublicKey(vote);
                        const voteBalance = delegate.getAttribute("delegate.voteBalance", crypto_1.Utils.BigNumber.ZERO);
                        delegate.setAttribute("delegate.voteBalance", revert ? voteBalance.minus(amount) : voteBalance.plus(amount));
                    }
                }
            }
            // Update vote balance of recipient's delegate
            if (recipient &&
                recipient.hasVoted() &&
                (transaction.type !== crypto_1.Enums.TransactionType.HtlcLock ||
                    transaction.typeGroup !== crypto_1.Enums.TransactionTypeGroup.Core)) {
                const delegate = this.findByPublicKey(recipient.getAttribute("vote"));
                const voteBalance = delegate.getAttribute("delegate.voteBalance", crypto_1.Utils.BigNumber.ZERO);
                delegate.setAttribute("delegate.voteBalance", revert ? voteBalance.minus(transaction.amount) : voteBalance.plus(transaction.amount));
            }
        }
    }
}
exports.WalletManager = WalletManager;
//# sourceMappingURL=wallet-manager.js.map