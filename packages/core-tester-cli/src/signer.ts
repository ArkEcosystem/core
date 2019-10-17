import { Identities, Transactions, Utils } from "@arkecosystem/crypto";

export class Signer {
    protected network: number;
    protected nonce: Utils.BigNumber;

    public constructor(network: number, nonce: string) {
        this.network = network;
        this.nonce = Utils.BigNumber.make(nonce);
    }

    public makeTransfer(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.transfer()
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

    public makeDelegate(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.delegateRegistration()
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

    public makeSecondSignature(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.secondSignature()
            .fee(this.toSatoshi(opts.signatureFee))
            .network(this.network)
            .nonce(this.nonce.toString())
            .signatureAsset(opts.secondPassphrase)
            .sign(opts.passphrase)
            .getStruct();

        this.incrementNonce();
        return transaction;
    }

    public makeVote(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.vote()
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

    public makeMultiSignatureRegistration(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.multiSignature()
            .multiSignatureAsset({
                min: opts.min,
                publicKeys: opts.participants.split(","),
            })
            .senderPublicKey(Identities.PublicKey.fromPassphrase(opts.passphrase))
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

    public makeIpfs(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.ipfs()
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

    public makeMultipayment(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.multiPayment()
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

    public makeHtlcLock(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.htlcLock()
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

    public makeHtlcClaim(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.htlcClaim()
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

    public makeHtlcRefund(opts: Record<string, any>): any {
        const transaction = Transactions.BuilderFactory.htlcRefund()
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

    private incrementNonce(): void {
        this.nonce = this.nonce.plus(1);
    }

    private toSatoshi(value): string {
        return Utils.BigNumber.make(value * 1e8).toFixed();
    }
}
