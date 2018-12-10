import { TRANSACTION_TYPES } from "../../constants";
import { feeManager } from "../../managers/fee";
import { TransactionBuilder } from "./transaction";

export class DelegateResignationBuilder extends TransactionBuilder {
    /**
     * @constructor
     */
    constructor() {
        super();

        this.data.type = TRANSACTION_TYPES.DELEGATE_RESIGNATION;
        this.data.fee = feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION);
    }
}
