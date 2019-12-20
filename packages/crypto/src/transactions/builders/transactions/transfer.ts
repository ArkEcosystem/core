import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class TransferBuilder extends TransactionBuilder<TransferBuilder> {
    public constructor() {
        super();

        this.data.type = Two.TransferTransaction.type;
        this.data.typeGroup = Two.TransferTransaction.typeGroup;
        this.data.fee = Two.TransferTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.expiration = 0;
    }

    public expiration(expiration: number): TransferBuilder {
        this.data.expiration = expiration;

        return this.instance();
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        struct.vendorField = this.data.vendorField;
        struct.expiration = this.data.expiration;

        return struct;
    }

    protected instance(): TransferBuilder {
        return this;
    }
}
