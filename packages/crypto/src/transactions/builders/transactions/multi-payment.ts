import { TransactionTypes } from "../../../enums";
import { MaximumPaymentCountExceededError } from "../../../errors";
import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { MultiPaymentTransaction } from '../../types';
import { TransactionBuilder } from "./transaction";

export class MultiPaymentBuilder extends TransactionBuilder<MultiPaymentBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.MultiPayment;
        this.data.fee = MultiPaymentTransaction.staticFee();
        this.data.vendorFieldHex = undefined;
        this.data.asset = {
            payments: [],
        };
        this.data.amount = BigNumber.make(0);
    }

    public addPayment(recipientId: string, amount: string): MultiPaymentBuilder {
        if (this.data.asset.payments.length >= 2258) {
            throw new MaximumPaymentCountExceededError(this.data.asset.payments.length);
        }

        this.data.asset.payments.push({
            amount: BigNumber.make(amount),
            recipientId,
        });

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
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
