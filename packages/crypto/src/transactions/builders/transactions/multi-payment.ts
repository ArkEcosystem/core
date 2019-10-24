import { MaximumPaymentCountExceededError } from "../../../errors";
import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { MultiPaymentTransaction } from "../../types";
import { TransactionBuilder } from "./transaction";

export class MultiPaymentBuilder extends TransactionBuilder<MultiPaymentBuilder> {
    constructor() {
        super();

        this.data.type = MultiPaymentTransaction.type;
        this.data.typeGroup = MultiPaymentTransaction.typeGroup;
        this.data.fee = MultiPaymentTransaction.staticFee();
        this.data.vendorField = undefined;
        this.data.asset = {
            payments: [],
        };
        this.data.amount = BigNumber.make(0);
    }

    public addPayment(recipientId: string, amount: string): MultiPaymentBuilder {
        if (this.data.asset && this.data.asset.payments) {
            if (this.data.asset.payments.length >= 500) {
                throw new MaximumPaymentCountExceededError(this.data.asset.payments.length + 1);
            }

            this.data.asset.payments.push({
                amount: BigNumber.make(amount),
                recipientId,
            });
        }

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.senderPublicKey = this.data.senderPublicKey;
        struct.vendorField = this.data.vendorField;
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;

        return struct;
    }

    protected instance(): MultiPaymentBuilder {
        return this;
    }
}
