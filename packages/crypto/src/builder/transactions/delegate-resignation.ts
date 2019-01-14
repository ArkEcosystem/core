import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers";
import { TransactionBuilder } from "./transaction";

export class DelegateResignationBuilder extends TransactionBuilder {

    constructor() {
        super();

        this.data.type = TransactionTypes.DelegateResignation;
        this.data.fee = feeManager.get(TransactionTypes.DelegateResignation);
    }
}
