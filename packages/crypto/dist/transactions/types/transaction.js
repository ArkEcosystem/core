"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("../../enums");
const errors_1 = require("../../errors");
const config_1 = require("../../managers/config");
const bignum_1 = require("../../utils/bignum");
const verifier_1 = require("../verifier");
class Transaction {
    get id() {
        return this.data.id;
    }
    get type() {
        return this.data.type;
    }
    get typeGroup() {
        return this.data.typeGroup;
    }
    get verified() {
        return this.isVerified;
    }
    get key() {
        return this.__proto__.constructor.key;
    }
    get staticFee() {
        return this.__proto__.constructor.staticFee({ data: this.data });
    }
    static getSchema() {
        throw new errors_1.NotImplementedError();
    }
    static staticFee(feeContext = {}) {
        const milestones = config_1.configManager.getMilestone(feeContext.height);
        if (milestones.fees && milestones.fees.staticFees) {
            const fee = milestones.fees.staticFees[this.key];
            if (fee !== undefined) {
                return bignum_1.BigNumber.make(fee);
            }
        }
        return this.defaultStaticFee;
    }
    verify() {
        return verifier_1.Verifier.verify(this.data);
    }
    verifySecondSignature(publicKey) {
        return verifier_1.Verifier.verifySecondSignature(this.data, publicKey);
    }
    verifySchema() {
        return verifier_1.Verifier.verifySchema(this.data);
    }
    toJson() {
        const data = JSON.parse(JSON.stringify(this.data));
        if (data.typeGroup === enums_1.TransactionTypeGroup.Core) {
            delete data.typeGroup;
        }
        if (data.version === 1) {
            delete data.nonce;
        }
        else {
            delete data.timestamp;
        }
        return data;
    }
    hasVendorField() {
        return false;
    }
}
exports.Transaction = Transaction;
Transaction.type = undefined;
Transaction.typeGroup = undefined;
Transaction.key = undefined;
Transaction.defaultStaticFee = bignum_1.BigNumber.ZERO;
//# sourceMappingURL=transaction.js.map