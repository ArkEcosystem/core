"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_transactions_1 = require("@arkecosystem/core-transactions");
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = __importDefault(require("assert"));
const dottie_1 = __importDefault(require("dottie"));
class Wallet {
    constructor(address) {
        this.address = address;
        this.balance = crypto_1.Utils.BigNumber.ZERO;
        this.nonce = crypto_1.Utils.BigNumber.ZERO;
        this.attributes = {};
    }
    hasAttribute(key) {
        this.assertKnownAttribute(key);
        return dottie_1.default.exists(this.attributes, key);
    }
    getAttribute(key, defaultValue) {
        this.assertKnownAttribute(key);
        return dottie_1.default.get(this.attributes, key, defaultValue);
    }
    setAttribute(key, value) {
        this.assertKnownAttribute(key);
        dottie_1.default.set(this.attributes, key, value);
    }
    forgetAttribute(key) {
        this.assertKnownAttribute(key);
        this.setAttribute(key, undefined);
    }
    getAttributes() {
        return this.attributes;
    }
    isDelegate() {
        return !!this.getAttribute("delegate");
    }
    hasVoted() {
        return !!this.getAttribute("vote");
    }
    hasSecondSignature() {
        return !!this.getAttribute("secondPublicKey");
    }
    hasMultiSignature() {
        return !!this.getAttribute("multiSignature");
    }
    canBePurged() {
        const hasAttributes = Object.keys(this.attributes).length > 0;
        const lockedBalance = this.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
        return this.balance.isZero() && lockedBalance.isZero() && !hasAttributes;
    }
    applyBlock(block) {
        if (block.generatorPublicKey === this.publicKey ||
            crypto_1.Identities.Address.fromPublicKey(block.generatorPublicKey) === this.address) {
            this.balance = this.balance.plus(block.reward).plus(block.totalFee);
            const delegate = this.getAttribute("delegate");
            delegate.producedBlocks++;
            delegate.forgedFees = delegate.forgedFees.plus(block.totalFee);
            delegate.forgedRewards = delegate.forgedRewards.plus(block.reward);
            delegate.lastBlock = block;
            return true;
        }
        return false;
    }
    revertBlock(block) {
        if (block.generatorPublicKey === this.publicKey ||
            crypto_1.Identities.Address.fromPublicKey(block.generatorPublicKey) === this.address) {
            this.balance = this.balance.minus(block.reward).minus(block.totalFee);
            const delegate = this.getAttribute("delegate");
            delegate.forgedFees = delegate.forgedFees.minus(block.totalFee);
            delegate.forgedRewards = delegate.forgedRewards.minus(block.reward);
            delegate.producedBlocks--;
            // TODO: get it back from database?
            delegate.lastBlock = undefined;
            return true;
        }
        return false;
    }
    verifySignatures(transaction, multiSignature) {
        return crypto_1.Transactions.Verifier.verifySignatures(transaction, multiSignature || this.getAttribute("multiSignature"));
    }
    /**
     * Verify that the transaction's nonce is the wallet nonce plus one, so that the
     * transaction can be applied to the wallet.
     * Throw an exception if it is not.
     */
    verifyTransactionNonceApply(transaction) {
        if (transaction.data.version > 1 && !this.nonce.plus(1).isEqualTo(transaction.data.nonce)) {
            throw new core_transactions_1.Errors.UnexpectedNonceError(transaction.data.nonce, this, false);
        }
    }
    /**
     * Verify that the transaction's nonce is the same as the wallet nonce, so that the
     * transaction can be reverted from the wallet.
     * Throw an exception if it is not.
     */
    verifyTransactionNonceRevert(transaction) {
        if (transaction.data.version > 1 && !this.nonce.isEqualTo(transaction.data.nonce)) {
            throw new core_transactions_1.Errors.UnexpectedNonceError(transaction.data.nonce, this, true);
        }
    }
    auditApply(transaction) {
        const audit = [];
        const delegate = this.getAttribute("delegate");
        const secondPublicKey = this.getAttribute("secondPublicKey");
        const multiSignature = this.getAttribute("multiSignature");
        if (multiSignature) {
            audit.push({
                Mutisignature: this.verifySignatures(transaction, multiSignature),
            });
        }
        else {
            audit.push({
                "Remaining amount": +this.balance
                    .minus(transaction.amount)
                    .minus(transaction.fee)
                    .toFixed(),
            });
            audit.push({ "Signature validation": crypto_1.Transactions.Verifier.verifyHash(transaction) });
            if (secondPublicKey) {
                audit.push({
                    "Second Signature Verification": crypto_1.Transactions.Verifier.verifySecondSignature(transaction, secondPublicKey),
                });
            }
        }
        if (transaction.version > 1 && !this.nonce.plus(1).isEqualTo(transaction.nonce)) {
            audit.push({
                "Invalid Nonce": transaction.nonce,
                "Wallet Nonce": this.nonce,
            });
        }
        const typeGroup = transaction.typeGroup || crypto_1.Enums.TransactionTypeGroup.Core;
        if (typeGroup === crypto_1.Enums.TransactionTypeGroup.Core) {
            if (transaction.type === crypto_1.Enums.TransactionType.Transfer) {
                audit.push({ Transfer: true });
            }
            if (transaction.type === crypto_1.Enums.TransactionType.SecondSignature) {
                audit.push({ "Second public key": secondPublicKey });
            }
            if (transaction.type === crypto_1.Enums.TransactionType.DelegateRegistration) {
                const username = transaction.asset.delegate.username;
                audit.push({ "Current username": delegate.username });
                audit.push({ "New username": username });
            }
            if (transaction.type === crypto_1.Enums.TransactionType.DelegateResignation) {
                audit.push({ "Resigned delegate": delegate.username });
            }
            if (transaction.type === crypto_1.Enums.TransactionType.Vote) {
                audit.push({ "Current vote": this.getAttribute("vote") });
                audit.push({ "New vote": transaction.asset.votes[0] });
            }
            if (transaction.type === crypto_1.Enums.TransactionType.MultiSignature) {
                const keysgroup = transaction.asset.multisignature.keysgroup;
                audit.push({ "Multisignature not yet registered": !multiSignature });
                audit.push({
                    "Multisignature enough keys": keysgroup.length >= transaction.asset.multiSignature.min,
                });
                audit.push({
                    "Multisignature all keys signed": keysgroup.length === transaction.signatures.length,
                });
                audit.push({
                    "Multisignature verification": this.verifySignatures(transaction, transaction.asset.multiSignature),
                });
            }
            if (transaction.type === crypto_1.Enums.TransactionType.Ipfs) {
                audit.push({ IPFS: true });
            }
            if (transaction.type === crypto_1.Enums.TransactionType.MultiPayment) {
                const amount = transaction.asset.payments.reduce((a, p) => a.plus(p.amount), crypto_1.Utils.BigNumber.ZERO);
                audit.push({ "Multipayment remaining amount": amount });
            }
            if (!(transaction.type in crypto_1.Enums.TransactionType)) {
                audit.push({ "Unknown Type": true });
            }
        }
        else {
            audit.push({ Type: transaction.type, TypeGroup: transaction.typeGroup });
        }
        return audit;
    }
    toString() {
        return `${this.address} (${crypto_1.Utils.formatSatoshi(this.balance)})`;
    }
    assertKnownAttribute(key) {
        assert_1.default(core_transactions_1.Handlers.Registry.isKnownWalletAttribute(key), `Tried to access unknown attribute: ${key}`);
    }
}
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.js.map