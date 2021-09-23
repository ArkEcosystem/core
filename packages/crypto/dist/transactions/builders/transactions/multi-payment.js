"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../../errors");
const managers_1 = require("../../../managers");
const utils_1 = require("../../../utils");
const types_1 = require("../../types");
const transaction_1 = require("./transaction");
class MultiPaymentBuilder extends transaction_1.TransactionBuilder {
    constructor() {
        super();
        this.data.type = types_1.MultiPaymentTransaction.type;
        this.data.typeGroup = types_1.MultiPaymentTransaction.typeGroup;
        this.data.fee = types_1.MultiPaymentTransaction.staticFee();
        this.data.vendorField = undefined;
        this.data.asset = {
            payments: [],
        };
        this.data.amount = utils_1.BigNumber.make(0);
    }
    addPayment(recipientId, amount) {
        const limit = managers_1.configManager.getMilestone().multiPaymentLimit || 500;
        if (this.data.asset.payments.length >= limit) {
            throw new errors_1.MaximumPaymentCountExceededError(limit);
        }
        this.data.asset.payments.push({
            amount: utils_1.BigNumber.make(amount),
            recipientId,
        });
        return this;
    }
    getStruct() {
        if (!this.data.asset.payments ||
            !Array.isArray(this.data.asset.payments) ||
            this.data.asset.payments.length <= 1) {
            throw new errors_1.MinimumPaymentCountSubceededError();
        }
        const struct = super.getStruct();
        struct.senderPublicKey = this.data.senderPublicKey;
        struct.vendorField = this.data.vendorField;
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}
exports.MultiPaymentBuilder = MultiPaymentBuilder;
//# sourceMappingURL=multi-payment.js.map