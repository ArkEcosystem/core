"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const enums_1 = require("../enums");
const { schemas } = crypto_1.Transactions;
const bridgechainResignationType = enums_1.MagistrateTransactionType.BridgechainResignation;
class BridgechainResignationTransaction extends crypto_1.Transactions.Transaction {
    static getSchema() {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainResignation",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: bridgechainResignationType },
                typeGroup: { const: enums_1.MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["bridgechainResignation"],
                    properties: {
                        bridgechainResignation: {
                            type: "object",
                            required: ["bridgechainId"],
                            properties: {
                                bridgechainId: {
                                    $ref: "transactionId",
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    serialize() {
        const { data } = this;
        const buffer = new bytebuffer_1.default(32, true);
        buffer.append(data.asset.bridgechainResignation.bridgechainId, "hex");
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        const bridgechainId = buf.readBytes(32).toString("hex");
        data.asset = {
            bridgechainResignation: {
                bridgechainId,
            },
        };
    }
}
exports.BridgechainResignationTransaction = BridgechainResignationTransaction;
BridgechainResignationTransaction.typeGroup = enums_1.MagistrateTransactionGroup;
BridgechainResignationTransaction.type = bridgechainResignationType;
BridgechainResignationTransaction.key = "bridgechainResignation";
BridgechainResignationTransaction.defaultStaticFee = crypto_1.Utils.BigNumber.make(enums_1.MagistrateTransactionStaticFees.BridgechainResignation);
//# sourceMappingURL=bridgechain-resignation.js.map