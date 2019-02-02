import { crypto, slots } from "../../crypto";
import { MissingTransactionSignatureError } from "../../errors";
import { configManager } from "../../managers";
import { ITransactionData, Transaction } from "../../models";
import { INetwork } from "../../networks";
import { Bignum } from "../../utils";

export abstract class TransactionBuilder<TBuilder extends TransactionBuilder<TBuilder>> {
    public data: ITransactionData;

    protected signWithSenderAsRecipient: boolean = false;

    constructor() {
        this.data = {
            id: null,
            timestamp: slots.getTime(),
            version: 0x01,
        } as ITransactionData;
    }

    /**
     * Build a new Transaction instance.
     */
    public build(data: Partial<ITransactionData> = {}): Transaction {
        return new Transaction({ ...this.data, ...data });
    }

    /**
     * Set transaction version.
     */
    public version(version: number): TBuilder {
        this.data.version = version;
        return this.instance();
    }

    /**
     * Set transaction network.
     */
    public network(network: number): TBuilder {
        this.data.network = network;
        return this.instance();
    }

    /**
     * Set transaction fee.
     */
    public fee(fee: Bignum | number | string): TBuilder {
        if (fee !== null) {
            this.data.fee = fee;
        }

        return this.instance();
    }

    /**
     * Set amount to transfer.
     */
    public amount(amount: Bignum | number | string): TBuilder {
        this.data.amount = amount;
        return this.instance();
    }

    /**
     * Set recipient id.
     */
    public recipientId(recipientId: string): TBuilder {
        this.data.recipientId = recipientId;
        return this.instance();
    }

    /**
     * Set sender public key.
     */
    public senderPublicKey(publicKey: string): TBuilder {
        this.data.senderPublicKey = publicKey;
        return this.instance();
    }

    /**
     * Set vendor field.
     */
    public vendorField(vendorField: string): TBuilder {
        if (vendorField && Buffer.from(vendorField).length <= 64) {
            this.data.vendorField = vendorField;
        }

        return this.instance();
    }

    /**
     * Sign transaction using passphrase.
     */
    public sign(passphrase: string): TBuilder {
        const keys = crypto.getKeys(passphrase);
        this.data.senderPublicKey = keys.publicKey;

        if (this.signWithSenderAsRecipient) {
            const pubKeyHash = this.data.network || configManager.get("pubKeyHash");
            this.data.recipientId = crypto.getAddress(crypto.getKeys(passphrase).publicKey, pubKeyHash);
        }

        this.data.signature = crypto.sign(this.getSigningObject(), keys);

        return this.instance();
    }

    /**
     * Sign transaction using wif.
     */
    public signWithWif(wif: string, networkWif?: number): TBuilder {
        const keys = crypto.getKeysFromWIF(wif, {
            wif: networkWif || configManager.get("wif"),
        } as INetwork);
        this.data.senderPublicKey = keys.publicKey;

        if (this.signWithSenderAsRecipient) {
            const pubKeyHash = this.data.network || configManager.get("pubKeyHash");

            this.data.recipientId = crypto.getAddress(keys.publicKey, pubKeyHash);
        }

        this.data.signature = crypto.sign(this.getSigningObject(), keys);

        return this.instance();
    }

    /**
     * Sign transaction with second passphrase.
     */
    public secondSign(secondPassphrase: string): TBuilder {
        if (secondPassphrase) {
            const keys = crypto.getKeys(secondPassphrase);
            // TODO sign or second?
            this.data.signSignature = crypto.secondSign(this.getSigningObject(), keys);
        }

        return this.instance();
    }

    /**
     * Sign transaction with wif.
     */
    public secondSignWithWif(wif: string, networkWif?: number): TBuilder {
        if (wif) {
            const keys = crypto.getKeysFromWIF(wif, {
                wif: networkWif || configManager.get("wif"),
            } as INetwork);
            // TODO sign or second?
            this.data.signSignature = crypto.secondSign(this.getSigningObject(), keys);
        }

        return this.instance();
    }

    /**
     * Sign transaction for multi-signature wallets.
     */
    public multiSignatureSign(passphrase: string): TBuilder {
        const keys = crypto.getKeys(passphrase);
        if (!this.data.signatures) {
            this.data.signatures = [];
        }
        this.data.signatures.push(crypto.sign(this.getSigningObject(), keys));

        return this.instance();
    }

    /**
     * Verify the transaction.
     */
    public verify(): boolean {
        return crypto.verify(this.data);
    }

    /**
     * Get structure of transaction
     */
    public getStruct(): ITransactionData {
        if (!this.data.senderPublicKey || !this.data.signature) {
            throw new MissingTransactionSignatureError();
        }

        const struct = {
            // hex: crypto.getBytes(this).toString('hex'), // v2
            id: crypto.getId(this.data).toString(),
            signature: this.data.signature,
            signSignature: this.data.signSignature,
            timestamp: this.data.timestamp,
            version: this.data.version,
            type: this.data.type,
            fee: this.data.fee,
            senderPublicKey: this.data.senderPublicKey,
            network: this.data.network,
        } as ITransactionData;

        if (Array.isArray(this.data.signatures)) {
            struct.signatures = this.data.signatures;
        }

        return struct;
    }

    protected abstract instance(): TBuilder;

    /**
     * Get a valid object used to sign a transaction.
     */
    private getSigningObject(): ITransactionData {
        const data = Object.assign({}, this.data) as ITransactionData;

        Object.keys(data).forEach(key => {
            if (["model", "network", "id"].includes(key)) {
                delete data[key];
            }
        });

        return data;
    }
}
