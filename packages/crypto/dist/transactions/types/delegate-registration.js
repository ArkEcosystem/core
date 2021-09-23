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
const bignum_1 = require("../../utils/bignum");
const schemas = __importStar(require("./schemas"));
const transaction_1 = require("./transaction");
class DelegateRegistrationTransaction extends transaction_1.Transaction {
    static getSchema() {
        return schemas.delegateRegistration;
    }
    serialize(options) {
        const { data } = this;
        const delegateBytes = Buffer.from(data.asset.delegate.username, "utf8");
        const buffer = new bytebuffer_1.default(delegateBytes.length, true);
        buffer.writeByte(delegateBytes.length);
        buffer.append(delegateBytes, "hex");
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        const usernamelength = buf.readUint8();
        data.asset = {
            delegate: {
                username: buf.readString(usernamelength),
            },
        };
    }
}
exports.DelegateRegistrationTransaction = DelegateRegistrationTransaction;
DelegateRegistrationTransaction.typeGroup = enums_1.TransactionTypeGroup.Core;
DelegateRegistrationTransaction.type = enums_1.TransactionType.DelegateRegistration;
DelegateRegistrationTransaction.key = "delegateRegistration";
DelegateRegistrationTransaction.defaultStaticFee = bignum_1.BigNumber.make("2500000000");
//# sourceMappingURL=delegate-registration.js.map