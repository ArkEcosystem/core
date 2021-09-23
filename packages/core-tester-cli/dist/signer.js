"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
class Signer {
    constructor(network, nonce) {
        this.network = network;
        this.nonce = crypto_1.Utils.BigNumber.make(nonce);
    }
    makeTransfer(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.transfer()
            .fee(this.toSatoshi(opts.transferFee))
            .network(this.network)
            .nonce(this.nonce.toString())
            .recipientId(opts.recipient)
            .amount(this.toSatoshi(opts.amount));
        if (opts.vendorField) {
            transaction.vendorField(opts.vendorField);
        }
        transaction.sign(opts.passphrase);
        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }
        this.incrementNonce();
        return transaction.getStruct();
    }
    makeDelegate(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.delegateRegistration()
            .fee(this.toSatoshi(opts.delegateFee))
            .network(this.network)
            .nonce(this.nonce.toString())
            .usernameAsset(opts.username)
            .sign(opts.passphrase);
        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }
        this.incrementNonce();
        return transaction.getStruct();
    }
    makeSecondSignature(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.secondSignature()
            .fee(this.toSatoshi(opts.signatureFee))
            .network(this.network)
            .nonce(this.nonce.toString())
            .signatureAsset(opts.secondPassphrase)
            .sign(opts.passphrase)
            .getStruct();
        this.incrementNonce();
        return transaction;
    }
    makeVote(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.vote()
            .fee(this.toSatoshi(opts.voteFee))
            .network(this.network)
            .nonce(this.nonce.toString())
            .votesAsset([`+${opts.delegate}`])
            .sign(opts.passphrase);
        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }
        this.incrementNonce();
        return transaction.getStruct();
    }
    makeMultiSignatureRegistration(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.multiSignature()
            .multiSignatureAsset({
            min: opts.min,
            publicKeys: opts.participants.split(","),
        })
            .senderPublicKey(crypto_1.Identities.PublicKey.fromPassphrase(opts.passphrase))
            .nonce(this.nonce.toString())
            .network(this.network);
        for (const [index, passphrase] of opts.passphrases.split(",").entries()) {
            transaction.multiSign(passphrase, index);
        }
        transaction.sign(opts.passphrase);
        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }
        this.incrementNonce();
        return transaction.getStruct();
    }
    makeIpfs(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.ipfs()
            .fee(this.toSatoshi(opts.ipfsFee))
            .ipfsAsset(opts.ipfs)
            .nonce(this.nonce.toString())
            .network(this.network)
            .sign(opts.passphrase);
        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }
        this.incrementNonce();
        return transaction.getStruct();
    }
    makeMultipayment(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.multiPayment()
            .fee(this.toSatoshi(opts.multipaymentFee))
            .nonce(this.nonce.toString())
            .network(this.network);
        for (const payment of opts.payments) {
            transaction.addPayment(payment.recipientId, payment.amount);
        }
        transaction.sign(opts.passphrase);
        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }
        this.incrementNonce();
        return transaction.getStruct();
    }
    makeHtlcLock(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.htlcLock()
            .fee(this.toSatoshi(opts.htlcLockFee))
            .htlcLockAsset(opts.lock)
            .nonce(this.nonce.toString())
            .amount(opts.amount)
            .recipientId(opts.recipient)
            .network(this.network)
            .sign(opts.passphrase);
        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }
        this.incrementNonce();
        return transaction.getStruct();
    }
    makeHtlcClaim(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.htlcClaim()
            .fee(this.toSatoshi(opts.htlcClaimFee))
            .htlcClaimAsset(opts.claim)
            .network(this.network)
            .nonce(this.nonce.toString())
            .sign(opts.passphrase);
        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }
        this.incrementNonce();
        return transaction.getStruct();
    }
    makeHtlcRefund(opts) {
        const transaction = crypto_1.Transactions.BuilderFactory.htlcRefund()
            .fee(this.toSatoshi(opts.htlcRefundFee))
            .htlcRefundAsset(opts.refund)
            .network(this.network)
            .nonce(this.nonce.toString())
            .sign(opts.passphrase);
        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }
        this.incrementNonce();
        return transaction.getStruct();
    }
    incrementNonce() {
        this.nonce = this.nonce.plus(1);
    }
    toSatoshi(value) {
        return crypto_1.Utils.BigNumber.make(value * 1e8).toFixed();
    }
}
exports.Signer = Signer;
//# sourceMappingURL=signer.js.map