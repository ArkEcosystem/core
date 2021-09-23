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
const bstring_1 = require("bstring");
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const enums_1 = require("../../enums");
const managers_1 = require("../../managers");
const bignum_1 = require("../../utils/bignum");
const schemas = __importStar(require("./schemas"));
const transaction_1 = require("./transaction");
class IpfsTransaction extends transaction_1.Transaction {
    static getSchema() {
        return schemas.ipfs;
    }
    verify() {
        return managers_1.configManager.getMilestone().aip11 && super.verify();
    }
    serialize(options) {
        const { data } = this;
        const ipfsBuffer = bstring_1.base58.decode(data.asset.ipfs);
        const buffer = new bytebuffer_1.default(ipfsBuffer.length, true);
        buffer.append(ipfsBuffer, "hex");
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        const hashFunction = buf.readUint8();
        const ipfsHashLength = buf.readUint8();
        const ipfsHash = buf.readBytes(ipfsHashLength).toBuffer();
        const buffer = Buffer.alloc(ipfsHashLength + 2);
        buffer.writeUInt8(hashFunction, 0);
        buffer.writeUInt8(ipfsHashLength, 1);
        buffer.fill(ipfsHash, 2);
        data.asset = {
            ipfs: bstring_1.base58.encode(buffer),
        };
    }
}
exports.IpfsTransaction = IpfsTransaction;
IpfsTransaction.typeGroup = enums_1.TransactionTypeGroup.Core;
IpfsTransaction.type = enums_1.TransactionType.Ipfs;
IpfsTransaction.key = "ipfs";
IpfsTransaction.defaultStaticFee = bignum_1.BigNumber.make("500000000");
//# sourceMappingURL=ipfs.js.map