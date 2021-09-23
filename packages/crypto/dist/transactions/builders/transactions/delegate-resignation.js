"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../utils");
const types_1 = require("../../types");
const transaction_1 = require("./transaction");
class DelegateResignationBuilder extends transaction_1.TransactionBuilder {
    constructor() {
        super();
        this.data.type = types_1.DelegateResignationTransaction.type;
        this.data.typeGroup = types_1.DelegateResignationTransaction.typeGroup;
        this.data.version = 2;
        this.data.fee = types_1.DelegateResignationTransaction.staticFee();
        this.data.amount = utils_1.BigNumber.ZERO;
        this.data.senderPublicKey = undefined;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        return struct;
    }
    instance() {
        return this;
    }
}
exports.DelegateResignationBuilder = DelegateResignationBuilder;
//# sourceMappingURL=delegate-resignation.js.map