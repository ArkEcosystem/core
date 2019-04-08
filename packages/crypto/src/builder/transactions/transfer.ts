import { TransactionTypes } from "../../constants";
import { ITransactionData } from "../../interfaces";
import { feeManager } from "../../managers";
import { TransactionBuilder } from "./transaction";

export class TransferBuilder extends TransactionBuilder<TransferBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.Transfer;
        this.data.fee = feeManager.get(TransactionTypes.Transfer);
        this.data.amount = 0;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.expiration = 0;
    }

    public getStruct(): ITransactionData {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        struct.vendorField = this.data.vendorField;
        // struct.vendorFieldHex = this.vendorFieldHex // v2
        return struct;
    }

    protected instance(): TransferBuilder {
        return this;
    }
}
