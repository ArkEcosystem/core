import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers";
import { ITransactionData } from "../../transactions";
import { TransactionBuilder } from "./transaction";

export class DelegateResignationBuilder extends TransactionBuilder<DelegateResignationBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.DelegateResignation;
        this.data.fee = feeManager.get(TransactionTypes.DelegateResignation);
        this.data.amount = 0;
        this.data.asset = {};
    }

    public getStruct(): ITransactionData {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): DelegateResignationBuilder {
        return this;
    }
}
