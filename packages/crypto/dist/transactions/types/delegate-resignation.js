"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const enums_1 = require("../../enums");
const managers_1 = require("../../managers");
const bignum_1 = require("../../utils/bignum");
const schemas = __importStar(require("./schemas"));
const transaction_1 = require("./transaction");
class DelegateResignationTransaction extends transaction_1.Transaction {
    static getSchema() {
        return schemas.delegateResignation;
    }
    verify() {
        return managers_1.configManager.getMilestone().aip11 && super.verify();
    }
    serialize(options) {
        return new bytebuffer_1.default(0);
    }
    deserialize(buf) {
        return;
    }
}
exports.DelegateResignationTransaction = DelegateResignationTransaction;
DelegateResignationTransaction.typeGroup = enums_1.TransactionTypeGroup.Core;
DelegateResignationTransaction.type = enums_1.TransactionType.DelegateResignation;
DelegateResignationTransaction.key = "delegateResignation";
DelegateResignationTransaction.defaultStaticFee = bignum_1.BigNumber.make("2500000000");
//# sourceMappingURL=delegate-resignation.js.map