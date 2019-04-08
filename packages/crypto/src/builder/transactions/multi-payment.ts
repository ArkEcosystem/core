import { TransactionTypes } from "../../constants";
import { MaximumPaymentCountExceededError } from "../../errors";
import { ITransactionData } from "../../interfaces";
import { feeManager } from "../../managers";
import { Bignum } from "../../utils";
import { TransactionBuilder } from "./transaction";

export class MultiPaymentBuilder extends TransactionBuilder<MultiPaymentBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.MultiPayment;
        this.data.fee = feeManager.get(TransactionTypes.MultiPayment);
        this.data.payments = {};
        this.data.vendorFieldHex = null;
        this.data.asset = {
            payments: [],
        };
        this.data.amount = new Bignum(0);
    }

    /**
     * Add payment to the multipayment collection.
     */
    public addPayment(recipientId: string, amount: number): MultiPaymentBuilder {
        if (this.data.asset.payments.length >= 2258) {
            throw new MaximumPaymentCountExceededError(this.data.asset.payments.length);
        }

        this.data.asset.payments.push({
            amount: new Bignum(amount),
            recipientId,
        });
        this.data.amount = (this.data.amount as Bignum).plus(amount);

        return this;
    }

    public getStruct(): ITransactionData {
        const struct = super.getStruct();
        struct.senderPublicKey = this.data.senderPublicKey;
        struct.vendorFieldHex = this.data.vendorFieldHex;
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;

        return struct;
    }

    protected instance(): MultiPaymentBuilder {
        return this;
    }
}
