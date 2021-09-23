"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const enums_1 = require("../enums");
const transactions_1 = require("../transactions");
class BusinessRegistrationBuilder extends crypto_1.Transactions.TransactionBuilder {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = enums_1.MagistrateTransactionGroup;
        this.data.type = enums_1.MagistrateTransactionType.BusinessRegistration;
        this.data.fee = transactions_1.BusinessRegistrationTransaction.staticFee();
        this.data.amount = crypto_1.Utils.BigNumber.ZERO;
        this.data.asset = { businessRegistration: {} };
    }
    businessRegistrationAsset(businessAsset) {
        this.data.asset.businessRegistration = {
            ...businessAsset,
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
exports.BusinessRegistrationBuilder = BusinessRegistrationBuilder;
//# sourceMappingURL=business-registration.js.map