import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers";
import { ITransactionData } from "../../models";
import { TransactionBuilder } from "./transaction";

export class MultiPaymentBuilder extends TransactionBuilder<MultiPaymentBuilder> {

    constructor() {
        super();

        this.data.type = TransactionTypes.MultiPayment;
        this.data.fee = feeManager.get(TransactionTypes.MultiPayment);
        this.data.payments = {};
        this.data.vendorFieldHex = null;
    }

    /**
     * Add payment to the multipayment collection.
     */
    public addPayment(address: string, amount: number): MultiPaymentBuilder {
        const paymentsCount = Object.keys(this.data.payments).length / 2;

        if (paymentsCount >= 2258) {
            throw new Error("A maximum of 2259 outputs is allowed");
        }

        const key = paymentsCount + 1;
        this.data.payments[`address${key}`] = address;
        this.data.payments[`amount${key}`] = amount;

        return this;
    }

    public getStruct(): ITransactionData {
        const struct = super.getStruct();
        struct.senderPublicKey = this.data.senderPublicKey;
        struct.vendorFieldHex = this.data.vendorFieldHex;

        return Object.assign(struct, this.data.payments);
    }

    protected instance(): MultiPaymentBuilder {
        return this;
    }
}
