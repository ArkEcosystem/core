"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identities_1 = require("../../../identities");
const utils_1 = require("../../../utils");
const types_1 = require("../../types");
const transaction_1 = require("./transaction");
class SecondSignatureBuilder extends transaction_1.TransactionBuilder {
    constructor() {
        super();
        this.data.type = types_1.SecondSignatureRegistrationTransaction.type;
        this.data.typeGroup = types_1.SecondSignatureRegistrationTransaction.typeGroup;
        this.data.fee = types_1.SecondSignatureRegistrationTransaction.staticFee();
        this.data.amount = utils_1.BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { signature: {} };
    }
    signatureAsset(secondPassphrase) {
        this.data.asset.signature.publicKey = identities_1.Keys.fromPassphrase(secondPassphrase).publicKey;
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}
exports.SecondSignatureBuilder = SecondSignatureBuilder;
//# sourceMappingURL=second-signature.js.map