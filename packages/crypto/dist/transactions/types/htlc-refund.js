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
class HtlcRefundTransaction extends transaction_1.Transaction {
    static getSchema() {
        return schemas.htlcRefund;
    }
    verify() {
        const milestone = managers_1.configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true && super.verify();
    }
    serialize(options) {
        const { data } = this;
        const buffer = new bytebuffer_1.default(32, true);
        buffer.append(Buffer.from(data.asset.refund.lockTransactionId, "hex"));
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        const lockTransactionId = buf.readBytes(32).toString("hex");
        data.asset = {
            refund: {
                lockTransactionId,
            },
        };
    }
}
exports.HtlcRefundTransaction = HtlcRefundTransaction;
HtlcRefundTransaction.typeGroup = enums_1.TransactionTypeGroup.Core;
HtlcRefundTransaction.type = enums_1.TransactionType.HtlcRefund;
HtlcRefundTransaction.key = "htlcRefund";
HtlcRefundTransaction.defaultStaticFee = bignum_1.BigNumber.ZERO;
//# sourceMappingURL=htlc-refund.js.map