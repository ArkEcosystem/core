import { TransactionTypes } from "../../constants";
import { crypto } from "../../crypto";
import { feeManager } from "../../managers/fee";
import { TransactionBuilder } from "./transaction";

export class DelegateRegistrationBuilder extends TransactionBuilder {
    /**
     * @constructor
     */
    constructor() {
        super();

        this.data.type = TransactionTypes.DelegateRegistration;
        this.data.fee = feeManager.get(TransactionTypes.DelegateRegistration);
        this.data.amount = 0;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.asset = { delegate: {} };
    }

    /**
     * Establish the delegate username on the asset.
     * @param  {String} username
     * @return {DelegateRegistrationBuilder}
     */
    public usernameAsset(username) {
        this.data.asset.delegate.username = username;
        return this;
    }

    /**
     * Overrides the inherited `sign` method to include the public key of the new delegate.
     * @param  {String}   passphrase
     * @return {DelegateRegistrationBuilder}
     * TODO rename to `assetDelegate` and merge with username ?
     */
    public sign(passphrase) {
        this.data.asset.delegate.publicKey = crypto.getKeys(passphrase).publicKey;
        super.sign(passphrase);
        return this;
    }

    /**
     * Overrides the inherited method to return the additional required by this type of transaction.
     * @return {Object}
     */
    public getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        return struct;
    }
}
