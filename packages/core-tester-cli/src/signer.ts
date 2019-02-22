import { bignumify } from "@arkecosystem/core-utils";
import { formatSatoshi } from "@arkecosystem/crypto";
import { client } from "@arkecosystem/crypto";

export class Signer {
    protected network: Record<string, any>;

    public constructor(network) {
        this.network = network;
    }

    public makeTransfer(opts: Record<string, any>): any {
        const transaction = client
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
        const transaction = client
            .getBuilder()
            .delegateRegistration()
            .fee(this.toSatoshi(opts.delegateFee))
            .network(this.network.version)
            .usernameAsset(opts.username);

        transaction.sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    private toSatoshi(value) {
        return bignumify(value)
            .times(1e8)
            .toFixed();
    }

    private fromSatoshi(satoshi) {
        return formatSatoshi(satoshi);
    }
}
