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
class HtlcLockTransaction extends transaction_1.Transaction {
    static getSchema() {
        return schemas.htlcLock;
    }
    verify() {
        const milestone = managers_1.configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true && super.verify();
    }
    hasVendorField() {
        return true;
    }
    serialize(options) {
        const { data } = this;
        const buffer = new bytebuffer_1.default(8 + 32 + 1 + 4 + 21, true);
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(data.amount.toString());
        buffer.append(Buffer.from(data.asset.lock.secretHash, "hex"));
        buffer.writeUint8(data.asset.lock.expiration.type);
        buffer.writeUint32(data.asset.lock.expiration.value);
        buffer.append(identities_1.Address.toBuffer(data.recipientId).addressBuffer);
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        const amount = bignum_1.BigNumber.make(buf.readUint64().toString());
        const secretHash = buf.readBytes(32).toString("hex");
        const expirationType = buf.readUint8();
        const expirationValue = buf.readUint32();
        const recipientId = identities_1.Address.fromBuffer(buf.readBytes(21).toBuffer());
        data.amount = amount;
        data.recipientId = recipientId;
        data.asset = {
            lock: {
                secretHash,
                expiration: {
                    type: expirationType,
                    value: expirationValue,
                },
            },
        };
    }
}
exports.HtlcLockTransaction = HtlcLockTransaction;
HtlcLockTransaction.typeGroup = enums_1.TransactionTypeGroup.Core;
HtlcLockTransaction.type = enums_1.TransactionType.HtlcLock;
HtlcLockTransaction.key = "htlcLock";
HtlcLockTransaction.defaultStaticFee = bignum_1.BigNumber.make("10000000");
//# sourceMappingURL=htlc-lock.js.map