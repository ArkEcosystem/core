"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const enums_1 = require("../enums");
const transactions_1 = require("../transactions");
class BridgechainResignationBuilder extends crypto_1.Transactions.TransactionBuilder {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = enums_1.MagistrateTransactionGroup;
        this.data.type = enums_1.MagistrateTransactionType.BridgechainResignation;
        this.data.fee = transactions_1.BridgechainResignationTransaction.staticFee();
        this.data.amount = crypto_1.Utils.BigNumber.ZERO;
        this.data.asset = { bridgechainResignation: {} };
    }
    bridgechainResignationAsset(bridgechainId) {
        this.data.asset.bridgechainResignation.bridgechainId = bridgechainId;
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
exports.BridgechainResignationBuilder = BridgechainResignationBuilder;
//# sourceMappingURL=bridgechain-resignation.js.map