import { TransactionTypes } from "../../constants";
import { crypto } from "../../crypto";
import { feeManager } from "../../managers";
import { ITransactionData } from "../../models";
import { TransactionBuilder } from "./transaction";

export class DelegateRegistrationBuilder extends TransactionBuilder<DelegateRegistrationBuilder> {

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
     */
    public usernameAsset(username: string): DelegateRegistrationBuilder {
        this.data.asset.delegate.username = username;
        return this;
    }

    /**
     * Overrides the inherited `sign` method to include the public key of the new delegate.
     */
    public sign(passphrase: string): DelegateRegistrationBuilder {
        this.data.asset.delegate.publicKey = crypto.getKeys(passphrase).publicKey;
        super.sign(passphrase);
        return this;
    }

    public getStruct(): ITransactionData {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): DelegateRegistrationBuilder {
        return this;
    }
}
