"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const enums_1 = require("../enums");
const transactions_1 = require("../transactions");
class BusinessUpdateBuilder extends crypto_1.Transactions.TransactionBuilder {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = enums_1.MagistrateTransactionGroup;
        this.data.type = enums_1.MagistrateTransactionType.BusinessUpdate;
        this.data.fee = transactions_1.BusinessUpdateTransaction.staticFee();
        this.data.amount = crypto_1.Utils.BigNumber.ZERO;
        this.data.asset = { businessUpdate: {} };
    }
    getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }
    businessUpdateAsset(businessAsset) {
        this.data.asset.businessUpdate = {
            ...businessAsset,
        };
        return this;
    }
    instance() {
        return this;
    }
}
exports.BusinessUpdateBuilder = BusinessUpdateBuilder;
//# sourceMappingURL=business-update.js.map