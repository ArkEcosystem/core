import { Identities, Transactions, Utils } from "@arkecosystem/crypto";

export class Signer {
    protected network: number;

    public constructor(network: number) {
        this.network = network;
    }

    public makeTransfer(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.transfer()
            .fee(this.toSatoshi(opts.transferFee))
            .network(this.network)
            .recipientId(opts.recipient)
            .amount(this.toSatoshi(opts.amount));

        if (opts.vendorField) {
            transaction.vendorField(opts.vendorField);
        }

        transaction.sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    public makeDelegate(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.delegateRegistration()
            .fee(this.toSatoshi(opts.delegateFee))
            .network(this.network)
            .usernameAsset(opts.username)
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    public makeSecondSignature(opts: Record<string, any>): any {
        return Transactions.BuilderFactory.secondSignature()
            .fee(this.toSatoshi(opts.signatureFee))
            .network(this.network)
            .signatureAsset(opts.secondPassphrase)
            .sign(opts.passphrase)
            .getStruct();
    }

    public makeVote(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.vote()
            .fee(this.toSatoshi(opts.voteFee))
            .votesAsset([`+${opts.delegate}`])
            .network(this.network)
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    public makeMultiSignatureRegistration(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.multiSignature()
            .multiSignatureAsset({
                min: opts.min,
                publicKeys: opts.participants.split(","),
            })
            .senderPublicKey(Identities.PublicKey.fromPassphrase(opts.passphrase))
            .network(this.network);

        for (const [index, passphrase] of opts.passphrases.split(",").entries()) {
            transaction.multiSign(passphrase, index);
        }

        transaction.sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    public makeIpfs(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.ipfs()
            .fee(this.toSatoshi(opts.ipfsFee))
            .ipfsAsset(opts.ipfs)
            .network(this.network)
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    public makeMultipayment(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.multiPayment()
            .fee(this.toSatoshi(opts.multipaymentFee))
            .network(this.network);

        for (const payment of opts.payments) {
            transaction.addPayment(payment.recipientId, payment.amount);
        }

        transaction.sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    public makeHtlcLock(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.htlcLock()
            .fee(this.toSatoshi(opts.htlcLockFee))
            .htlcLockAsset(opts.lock)
            .amount(opts.amount)
            .recipientId(opts.recipient)
            .network(this.network)
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    public makeHtlcClaim(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.htlcClaim()
            .fee(this.toSatoshi(opts.htlcClaimFee))
            .htlcClaimAsset(opts.claim)
            .network(this.network)
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    public makeHtlcRefund(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.htlcRefund()
            .fee(this.toSatoshi(opts.htlcRefundFee))
            .htlcRefundAsset(opts.refund)
            .network(this.network)
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    private toSatoshi(value): string {
        return Utils.BigNumber.make(value * 1e8).toFixed();
    }
}
