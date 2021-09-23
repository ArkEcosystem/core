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
const utils_1 = require("../../utils");
const bignum_1 = require("../../utils/bignum");
const schemas = __importStar(require("./schemas"));
const transaction_1 = require("./transaction");
class MultiSignatureRegistrationTransaction extends transaction_1.Transaction {
    static getSchema() {
        return schemas.multiSignature;
    }
    static staticFee(feeContext = {}) {
        const staticFee = super.staticFee(feeContext);
        const data = feeContext.data;
        if (data) {
            if (data.version === 2) {
                return staticFee.times(data.asset.multiSignature.publicKeys.length + 1);
            }
            else {
                return staticFee.times(data.asset.multiSignatureLegacy.keysgroup.length + 1);
            }
        }
        return staticFee;
    }
    verify() {
        return utils_1.isException(this.data) || (managers_1.configManager.getMilestone().aip11 && super.verify());
    }
    serialize(options) {
        const { data } = this;
        let buffer;
        if (data.version === 2) {
            const { min, publicKeys } = data.asset.multiSignature;
            buffer = new bytebuffer_1.default(2 + publicKeys.length * 33);
            buffer.writeUint8(min);
            buffer.writeUint8(publicKeys.length);
            for (const publicKey of publicKeys) {
                buffer.append(publicKey, "hex");
            }
        }
        else {
            // Legacy
            const joined = data.asset.multiSignatureLegacy.keysgroup
                .map(k => (k[0] === "+" ? k.slice(1) : k))
                .join("");
            const keysgroupBuffer = Buffer.from(joined, "hex");
            buffer = new bytebuffer_1.default(keysgroupBuffer.length + 3, true);
            buffer.writeByte(data.asset.multiSignatureLegacy.min);
            buffer.writeByte(data.asset.multiSignatureLegacy.keysgroup.length);
            buffer.writeByte(data.asset.multiSignatureLegacy.lifetime);
            buffer.append(keysgroupBuffer, "hex");
        }
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        if (data.version === 2) {
            const multiSignature = { publicKeys: [], min: 0 };
            multiSignature.min = buf.readUint8();
            const count = buf.readUint8();
            for (let i = 0; i < count; i++) {
                const publicKey = buf.readBytes(33).toString("hex");
                multiSignature.publicKeys.push(publicKey);
            }
            data.asset = { multiSignature };
        }
        else {
            // Legacy
            const multiSignatureLegacy = { keysgroup: [], lifetime: 0, min: 0 };
            multiSignatureLegacy.min = buf.readUint8();
            const num = buf.readUint8();
            multiSignatureLegacy.lifetime = buf.readUint8();
            for (let index = 0; index < num; index++) {
                const key = buf.readBytes(33).toString("hex");
                multiSignatureLegacy.keysgroup.push(key);
            }
            data.asset = { multiSignatureLegacy };
        }
    }
}
exports.MultiSignatureRegistrationTransaction = MultiSignatureRegistrationTransaction;
MultiSignatureRegistrationTransaction.typeGroup = enums_1.TransactionTypeGroup.Core;
MultiSignatureRegistrationTransaction.type = enums_1.TransactionType.MultiSignature;
MultiSignatureRegistrationTransaction.key = "multiSignature";
MultiSignatureRegistrationTransaction.defaultStaticFee = bignum_1.BigNumber.make("500000000");
//# sourceMappingURL=multi-signature.js.map