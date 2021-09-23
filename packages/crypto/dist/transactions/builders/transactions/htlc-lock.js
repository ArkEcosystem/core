"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../utils");
const types_1 = require("../../types");
const transaction_1 = require("./transaction");
class HtlcLockBuilder extends transaction_1.TransactionBuilder {
    constructor() {
        super();
        this.data.type = types_1.HtlcLockTransaction.type;
        this.data.typeGroup = types_1.HtlcLockTransaction.typeGroup;
        this.data.recipientId = undefined;
        this.data.amount = utils_1.BigNumber.ZERO;
        this.data.fee = types_1.HtlcLockTransaction.staticFee();
        this.data.vendorField = undefined;
        this.data.asset = {};
    }
    htlcLockAsset(lockAsset) {
        this.data.asset = {
            lock: lockAsset,
        };
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.recipientId = this.data.recipientId;
        struct.amount = this.data.amount;
        struct.vendorField = this.data.vendorField;
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}
exports.HtlcLockBuilder = HtlcLockBuilder;
//# sourceMappingURL=htlc-lock.js.map