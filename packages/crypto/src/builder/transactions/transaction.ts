import { crypto, slots } from "../../crypto";
import { configManager } from "../../managers/config";
import { Transaction } from "../../models/transaction";

export abstract class TransactionBuilder {
    public data: any;
    public model: any;

    protected signWithSenderAsRecipient: boolean = false;

    /**
     * @constructor
     */
    constructor() {
        this.data = {
            id: null,
            timestamp: slots.getTime(),
            version: 0x01,
        };
    }

    /**
     * Build a new Transaction instance.
     * @return {Transaction}
     */
    public build(data: any = {}) {
        return new Transaction({ ...this.data, ...data });
    }

    /**
     * Set transaction version.
     * @param {Number} version
     * @return {TransactionBuilder}
     */
    public version(version) {
        this.data.version = version;
        return this;
    }

    /**
     * Set transaction network.
     * @param {Number} network
     * @return {TransactionBuilder}
     */
    public network(network) {
        this.data.network = network;
        return this;
    }

    /**
     * Set transaction fee.
     * @param {Number} fee
     * @return {TransactionBuilder}
     */
    public fee(fee) {
        if (fee !== null) {
            this.data.fee = fee;
        }

        return this;
    }

    /**
     * Set amount to transfer.
     * @param  {Number} amount
     * @return {TransactionBuilder}
     */
    public amount(amount) {
        this.data.amount = amount;
        return this;
    }

    /**
     * Set recipient id.
     * @param  {String} recipientId
     * @return {TransactionBuilder}
     */
    public recipientId(recipientId) {
        this.data.recipientId = recipientId;
        return this;
    }

    /**
     * Set sender public key.
     * @param  {String} publicKey
     * @return {TransactionBuilder}
     */
    public senderPublicKey(publicKey) {
        this.data.senderPublicKey = publicKey;
        return this;
    }

    /**
     * Set vendor field.
     * @param  {String} vendorField
     * @return {TransactionBuilder}
     */
    public vendorField(vendorField) {
        if (vendorField && Buffer.from(vendorField).length <= 64) {
            this.data.vendorField = vendorField;
        }

        return this;
    }

    /**
     * Verify the transaction.
     * @return {Boolean}
     */
    public verify() {
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
     * Sign transaction using passphrase.
     * @param  {String} passphrase
     * @return {TransactionBuilder}
     */
    public sign(passphrase) {
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
     * @param  {String} wif
     * @param  {String} networkWif - value associated with network
     * @return {TransactionBuilder}
     */
    public signWithWif(wif, networkWif?) {
        const keys = crypto.getKeysFromWIF(wif, {
            wif: networkWif || configManager.get("wif"),
        });
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
     * @param  {String} secondPassphrase
     * @return {TransactionBuilder}
     */
    public secondSign(secondPassphrase) {
        if (secondPassphrase) {
            const keys = crypto.getKeys(secondPassphrase);
            // TODO sign or second?
            this.data.signSignature = crypto.secondSign(this.__getSigningObject(), keys);
        }

        return this;
    }

    /**
     * Sign transaction with wif.
     * @param  {String} wif
     * @param  {String} networkWif - value associated with network
     * @return {TransactionBuilder}
     */
    public secondSignWithWif(wif, networkWif) {
        if (wif) {
            const keys = crypto.getKeysFromWIF(wif, {
                wif: networkWif || configManager.get("wif"),
            });
            // TODO sign or second?
            this.data.signSignature = crypto.secondSign(this.__getSigningObject(), keys);
        }

        return this;
    }

    /**
     * Sign transaction for multi-signature wallets.
     * @param {String} passphrase
     * @return {TransactionBuilder}
     */
    public multiSignatureSign(passphrase) {
        const keys = crypto.getKeys(passphrase);
        if (!this.data.signatures) {
            this.data.signatures = [];
        }
        this.data.signatures.push(crypto.sign(this.__getSigningObject(), keys));

        return this;
    }

    /**
     * Get structure of transaction
     * @return {Object}
     */
    public getStruct() {
        if (!this.data.senderPublicKey || !this.data.signature) {
            throw new Error("The transaction is not signed yet");
        }

        const struct: any = {
            // hex: crypto.getBytes(this).toString('hex'), // v2
            id: crypto.getId(this.data).toString(),
            signature: this.data.signature,
            signSignature: this.data.signSignature,
            timestamp: this.data.timestamp,

            type: this.data.type,
            fee: this.data.fee,
            senderPublicKey: this.data.senderPublicKey,
            network: this.data.network,
        };

        if (Array.isArray(this.data.signatures)) {
            struct.signatures = this.data.signatures;
        }

        return struct;
    }

    /**
     * Get a valid object used to sign a transaction.
     * @return {Object}
     */
    public __getSigningObject() {
        const data = Object.assign({}, this.data);

        Object.keys(data).forEach(key => {
            if (["model", "network", "id"].includes(key)) {
                delete data[key];
            }
        });

        return data;
    }
}
