"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const transaction_reader_1 = require("../transaction-reader");
const delegate_registration_1 = require("./delegate-registration");
const transaction_1 = require("./transaction");
class VoteTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.VoteTransaction;
    }
    dependencies() {
        return [delegate_registration_1.DelegateRegistrationTransactionHandler];
    }
    walletAttributes() {
        return ["vote"];
    }
    async bootstrap(connection, walletManager) {
        const reader = await transaction_reader_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                const vote = transaction.asset.votes[0];
                const walletVote = wallet.getAttribute("vote");
                if (vote.startsWith("+")) {
                    if (walletVote) {
                        throw new errors_1.AlreadyVotedError();
                    }
                    wallet.setAttribute("vote", vote.slice(1));
                }
                else {
                    if (!walletVote) {
                        throw new errors_1.NoVoteError();
                    }
                    else if (walletVote !== vote.slice(1)) {
                        throw new errors_1.UnvoteMismatchError();
                    }
                    wallet.forgetAttribute("vote");
                }
            }
        }
    }
    async isActivated() {
        return true;
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        const { data } = transaction;
        const vote = data.asset.votes[0];
        const walletVote = wallet.getAttribute("vote");
        const delegatePublicKey = vote.slice(1);
        const delegateWallet = walletManager.findByPublicKey(delegatePublicKey);
        if (vote.startsWith("+")) {
            if (walletVote) {
                throw new errors_1.AlreadyVotedError();
            }
            if (delegateWallet.hasAttribute("delegate.resigned")) {
                throw new errors_1.VotedForResignedDelegateError(vote);
            }
        }
        else {
            if (!walletVote) {
                throw new errors_1.NoVoteError();
            }
            else if (walletVote !== vote.slice(1)) {
                throw new errors_1.UnvoteMismatchError();
            }
        }
        if (!delegateWallet.isDelegate()) {
            throw new errors_1.VotedForNonDelegateError(vote);
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    emitEvents(transaction, emitter) {
        const vote = transaction.data.asset.votes[0];
        emitter.emit(vote.startsWith("+") ? core_event_emitter_1.ApplicationEvents.WalletVote : core_event_emitter_1.ApplicationEvents.WalletUnvote, {
            delegate: vote,
            transaction: transaction.data,
        });
    }
    async canEnterTransactionPool(data, pool, processor) {
        return this.typeFromSenderAlreadyInPool(data, pool);
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote = transaction.data.asset.votes[0];
        if (vote.startsWith("+")) {
            sender.setAttribute("vote", vote.slice(1));
        }
        else {
            sender.forgetAttribute("vote");
        }
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const vote = transaction.data.asset.votes[0];
        if (vote.startsWith("+")) {
            sender.forgetAttribute("vote");
        }
        else {
            sender.setAttribute("vote", vote.slice(1));
        }
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.VoteTransactionHandler = VoteTransactionHandler;
//# sourceMappingURL=vote.js.map