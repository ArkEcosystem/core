import { Utils } from "@arkecosystem/crypto";
import { Client } from "@arkecosystem/crypto";

export class Signer {
    protected network: Record<string, any>;

    public constructor(network) {
        this.network = network;
    }

    public makeTransfer(opts: Record<string, any>): any {
        const transaction = Client.client
            .getBuilder()
            .transfer()
            .fee(this.toSatoshi(opts.transferFee))
            .network(this.network.version)
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
        const transaction = Client.client
            .getBuilder()
            .delegateRegistration()
            .fee(this.toSatoshi(opts.delegateFee))
            .network(this.network.version)
            .usernameAsset(opts.username)
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    public makeSecondSignature(opts: Record<string, any>): any {
        return Client.client
            .getBuilder()
            .secondSignature()
            .fee(this.toSatoshi(opts.signatureFee))
            .network(this.network.version)
            .signatureAsset(opts.secondPassphrase)
            .sign(opts.passphrase)
            .getStruct();
    }

    public makeVote(opts: Record<string, any>): any {
        const transaction = Client.client
            .getBuilder()
            .vote()
            .fee(this.toSatoshi(opts.voteFee))
            .votesAsset([`+${opts.delegate}`])
            .network(this.network.version)
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    private toSatoshi(value): string {
        return Utils.BigNumber.make(value)
            .times(1e8)
            .toFixed();
    }
}
