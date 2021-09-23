"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const enums_1 = require("../enums");
const { schemas } = crypto_1.Transactions;
class BusinessResignationTransaction extends crypto_1.Transactions.Transaction {
    static getSchema() {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessResignation",
            required: ["typeGroup"],
            properties: {
                type: { transactionType: enums_1.MagistrateTransactionType.BusinessResignation },
                typeGroup: { const: enums_1.MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
            },
        });
    }
    serialize() {
        return new bytebuffer_1.default(0);
    }
    deserialize(buf) {
        return;
    }
}
exports.BusinessResignationTransaction = BusinessResignationTransaction;
BusinessResignationTransaction.typeGroup = enums_1.MagistrateTransactionGroup;
BusinessResignationTransaction.type = enums_1.MagistrateTransactionType.BusinessResignation;
BusinessResignationTransaction.key = "businessResignation";
BusinessResignationTransaction.defaultStaticFee = crypto_1.Utils.BigNumber.make(enums_1.MagistrateTransactionStaticFees.BusinessResignation);
//# sourceMappingURL=business-resignation.js.map