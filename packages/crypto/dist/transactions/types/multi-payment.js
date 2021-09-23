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
const identities_1 = require("../../identities");
const managers_1 = require("../../managers");
const bignum_1 = require("../../utils/bignum");
const schemas = __importStar(require("./schemas"));
const transaction_1 = require("./transaction");
class MultiPaymentTransaction extends transaction_1.Transaction {
    static getSchema() {
        return schemas.multiPayment;
    }
    verify() {
        return managers_1.configManager.getMilestone().aip11 && super.verify();
    }
    hasVendorField() {
        return true;
    }
    serialize(options) {
        const { data } = this;
        const buffer = new bytebuffer_1.default(2 + data.asset.payments.length * 29, true);
        buffer.writeUint16(data.asset.payments.length);
        for (const payment of data.asset.payments) {
            // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
            buffer.writeUint64(payment.amount.toString());
            const { addressBuffer, addressError } = identities_1.Address.toBuffer(payment.recipientId);
            options.addressError = addressError || options.addressError;
            buffer.append(addressBuffer);
        }
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        const payments = [];
        const total = buf.readUint16();
        for (let j = 0; j < total; j++) {
            payments.push({
                amount: bignum_1.BigNumber.make(buf.readUint64().toString()),
                recipientId: identities_1.Address.fromBuffer(buf.readBytes(21).toBuffer()),
            });
        }
        data.amount = bignum_1.BigNumber.ZERO;
        data.asset = { payments };
    }
}
exports.MultiPaymentTransaction = MultiPaymentTransaction;
MultiPaymentTransaction.typeGroup = enums_1.TransactionTypeGroup.Core;
MultiPaymentTransaction.type = enums_1.TransactionType.MultiPayment;
MultiPaymentTransaction.key = "multiPayment";
MultiPaymentTransaction.defaultStaticFee = bignum_1.BigNumber.make("10000000");
//# sourceMappingURL=multi-payment.js.map