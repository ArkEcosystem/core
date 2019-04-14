import { TransactionTypes } from "../../../enums";
import { ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { BigNumber } from "../../../utils";
import { TransactionBuilder } from "./transaction";

export class TransferBuilder extends TransactionBuilder<TransferBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.Transfer;
        this.data.fee = feeManager.get(TransactionTypes.Transfer);
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.expiration = 0;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
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
