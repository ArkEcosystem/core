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
class SecondSignatureRegistrationTransaction extends transaction_1.Transaction {
    static getSchema() {
        return schemas.secondSignature;
    }
    serialize(options) {
        const { data } = this;
        const buffer = new bytebuffer_1.default(33, true);
        buffer.append(data.asset.signature.publicKey, "hex");
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        data.asset = {
            signature: {
                publicKey: buf.readBytes(33).toString("hex"),
            },
        };
    }
}
exports.SecondSignatureRegistrationTransaction = SecondSignatureRegistrationTransaction;
SecondSignatureRegistrationTransaction.typeGroup = enums_1.TransactionTypeGroup.Core;
SecondSignatureRegistrationTransaction.type = enums_1.TransactionType.SecondSignature;
SecondSignatureRegistrationTransaction.key = "secondSignature";
SecondSignatureRegistrationTransaction.defaultStaticFee = bignum_1.BigNumber.make("500000000");
//# sourceMappingURL=second-signature.js.map