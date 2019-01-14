import { crypto, slots } from "../../crypto";
import { configManager } from "../../managers";
import { ITransactionData, Transaction } from "../../models";
import { INetwork } from "../../networks";

export abstract class TransactionBuilder {
    public data: ITransactionData;
    public model: any;

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
    public version(version: number): TransactionBuilder {
        this.data.version = version;
        return this;
    }

    /**
     * Set transaction network.
     */
    public network(network: number): TransactionBuilder {
        this.data.network = network;
        return this;
    }

    /**
     * Set transaction fee.
     */
    public fee(fee: number): TransactionBuilder {
        if (fee !== null) {
            this.data.fee = fee;
        }

        return this;
    }

    /**
     * Set amount to transfer.
     * @return {TransactionBuilder}
     */
    public amount(amount: number): TransactionBuilder {
        this.data.amount = amount;
        return this;
    }

    /**
     * Set recipient id.
     */
    public recipientId(recipientId: string): TransactionBuilder {
        this.data.recipientId = recipientId;
        return this;
    }

    /**
     * Set sender public key.
     */
    public senderPublicKey(publicKey: string): TransactionBuilder {
        this.data.senderPublicKey = publicKey;
        return this;
    }

    /**
     * Set vendor field.
     */
    public vendorField(vendorField: string): TransactionBuilder {
        if (vendorField && Buffer.from(vendorField).length <= 64) {
            this.data.vendorField = vendorField;
        }

        return this;
    }

    /**
     * Sign transaction using passphrase.
     */
    public sign(passphrase: string): TransactionBuilder {
        const keys = crypto.getKeys(passphrase);
        this.data.senderPublicKey = keys.publicKey;

        if (this.signWithSenderAsRecipient) {
            const pubKeyHash = this.data.network || configManager.get("pubKeyHash");
            this.data.recipientId = crypto.getAddress(crypto.getKeys(passphrase).publicKey, pubKeyHash);
        }

        this.data.signature = crypto.sign(this.__getSigningObject(), keys);

        return this;
    }

    /**
     * Sign transaction using wif.
     */
    public signWithWif(wif: string, networkWif?: number): TransactionBuilder {
        const keys = crypto.getKeysFromWIF(wif, {
            wif: networkWif || configManager.get("wif"),
        } as INetwork);
        this.data.senderPublicKey = keys.publicKey;

        if (this.signWithSenderAsRecipient) {
            const pubKeyHash = this.data.network || configManager.get("pubKeyHash");

            this.data.recipientId = crypto.getAddress(keys.publicKey, pubKeyHash);
        }

        this.data.signature = crypto.sign(this.__getSigningObject(), keys);

        return this;
    }

    /**
     * Sign transaction with second passphrase.
     */
    public secondSign(secondPassphrase: string): TransactionBuilder {
        if (secondPassphrase) {
            const keys = crypto.getKeys(secondPassphrase);
            // TODO sign or second?
            this.data.signSignature = crypto.secondSign(this.__getSigningObject(), keys);
        }

        return this;
    }

    /**
     * Sign transaction with wif.
     */
    public secondSignWithWif(wif: string, networkWif?: number): TransactionBuilder {
        if (wif) {
            const keys = crypto.getKeysFromWIF(wif, {
                wif: networkWif || configManager.get("wif"),
            } as INetwork);
            // TODO sign or second?
            this.data.signSignature = crypto.secondSign(this.__getSigningObject(), keys);
        }

        return this;
    }

    /**
     * Sign transaction for multi-signature wallets.
     */
    public multiSignatureSign(passphrase: string): TransactionBuilder {
        const keys = crypto.getKeys(passphrase);
        if (!this.data.signatures) {
            this.data.signatures = [];
        }
        this.data.signatures.push(crypto.sign(this.__getSigningObject(), keys));

        return this;
    }

    /**
     * Verify the transaction.
     */
    public verify(): boolean {
        return crypto.verify(this.data);
    }

    /**
     * Serialize the transaction.
     * TODO @deprecated when a Transaction model is returned
     * @return {Buffer}
     */
    public serialize() {
        return this.model.serialize(this.getStruct());
    }

    /**
     * Get structure of transaction
     * @return {Object}
     */
    public getStruct() {
        if (!this.data.senderPublicKey || !this.data.signature) {
            throw new Error("The transaction is not signed yet");
        }

        const struct = {
            // hex: crypto.getBytes(this).toString('hex'), // v2
            id: crypto.getId(this.data).toString(),
            signature: this.data.signature,
            signSignature: this.data.signSignature,
            timestamp: this.data.timestamp,

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

    /**
     * Get a valid object used to sign a transaction.
     */
    public __getSigningObject(): ITransactionData {
        const data = Object.assign({}, this.data) as ITransactionData;

        Object.keys(data).forEach(key => {
            if (["model", "network", "id"].includes(key)) {
                delete data[key];
            }
        });

        return data;
    }
}
