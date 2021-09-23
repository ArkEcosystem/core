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
const bignum_1 = require("../../utils/bignum");
const schemas = __importStar(require("./schemas"));
const transaction_1 = require("./transaction");
class TransferTransaction extends transaction_1.Transaction {
    static getSchema() {
        return schemas.transfer;
    }
    hasVendorField() {
        return true;
    }
    serialize(options) {
        const { data } = this;
        const buffer = new bytebuffer_1.default(24, true);
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(data.amount.toString());
        buffer.writeUint32(data.expiration || 0);
        const { addressBuffer, addressError } = identities_1.Address.toBuffer(data.recipientId);
        options.addressError = addressError;
        buffer.append(addressBuffer);
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        data.amount = bignum_1.BigNumber.make(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = identities_1.Address.fromBuffer(buf.readBytes(21).toBuffer());
    }
}
exports.TransferTransaction = TransferTransaction;
TransferTransaction.typeGroup = enums_1.TransactionTypeGroup.Core;
TransferTransaction.type = enums_1.TransactionType.Transfer;
TransferTransaction.key = "transfer";
TransferTransaction.defaultStaticFee = bignum_1.BigNumber.make("10000000");
//# sourceMappingURL=transfer.js.map