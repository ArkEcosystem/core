import { TransactionTypes } from "../../../enums";
import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { DelegateResignationTransaction } from '../../types';
import { TransactionBuilder } from "./transaction";

export class DelegateResignationBuilder extends TransactionBuilder<DelegateResignationBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.DelegateResignation;
        this.data.version = 2;
        this.data.fee = DelegateResignationTransaction.staticFee();
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
