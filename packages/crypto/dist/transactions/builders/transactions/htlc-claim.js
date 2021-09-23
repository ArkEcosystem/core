"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../utils");
const types_1 = require("../../types");
const transaction_1 = require("./transaction");
class HtlcClaimBuilder extends transaction_1.TransactionBuilder {
    constructor() {
        super();
        this.data.type = types_1.HtlcClaimTransaction.type;
        this.data.typeGroup = types_1.HtlcClaimTransaction.typeGroup;
        this.data.fee = types_1.HtlcClaimTransaction.staticFee();
        this.data.amount = utils_1.BigNumber.ZERO;
        this.data.asset = {};
    }
    htlcClaimAsset(claimAsset) {
        this.data.asset = {
            claim: claimAsset,
        };
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}
exports.HtlcClaimBuilder = HtlcClaimBuilder;
//# sourceMappingURL=htlc-claim.js.map