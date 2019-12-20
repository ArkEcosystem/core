import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class DelegateResignationBuilder extends TransactionBuilder<DelegateResignationBuilder> {
    public constructor() {
        super();

        this.data.type = Two.DelegateResignationTransaction.type;
        this.data.typeGroup = Two.DelegateResignationTransaction.typeGroup;
        this.data.version = 2;
        this.data.fee = Two.DelegateResignationTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.senderPublicKey = undefined;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        return struct;
    }

    protected instance(): DelegateResignationBuilder {
        return this;
    }
}
