"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const joi_1 = __importDefault(require("@hapi/joi"));
const iteratees_1 = require("../shared/iteratees");
const schemas_1 = require("../shared/schemas");
exports.index = {
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.transactionIteratees),
            id: joi_1.default.string()
                .hex()
                .length(64),
            blockId: schemas_1.blockId,
            type: joi_1.default.number()
                .integer()
                .min(0),
            typeGroup: joi_1.default.number()
                .integer()
                .min(0),
            version: joi_1.default.number()
                .integer()
                .positive(),
            senderPublicKey: schemas_1.publicKey,
            senderId: schemas_1.address,
            recipientId: schemas_1.address,
            timestamp: joi_1.default.number()
                .integer()
                .min(0),
            nonce: joi_1.default.number()
                .integer()
                .min(0),
            amount: joi_1.default.number()
                .integer()
                .min(0),
            fee: joi_1.default.number()
                .integer()
                .min(0),
            vendorField: joi_1.default.string().max(255, "utf8"),
            transform: joi_1.default.bool().default(true),
        },
    },
};
exports.store = {
    type: "object",
    required: ["transactions"],
    additionalProperties: false,
    properties: {
        transactions: {
            $ref: "transactions",
            minItems: 1,
            maxItems: core_container_1.app.resolveOptions("transaction-pool").maxTransactionsPerRequest,
        },
    },
};
exports.show = {
    params: {
        id: joi_1.default.string()
            .hex()
            .length(64),
    },
    query: {
        transform: joi_1.default.bool().default(true),
    },
};
exports.unconfirmed = {
    query: {
        ...schemas_1.pagination,
        ...{
            transform: joi_1.default.bool().default(true),
        },
    },
};
exports.showUnconfirmed = {
    params: {
        id: joi_1.default.string()
            .hex()
            .length(64),
    },
};
exports.search = {
    query: {
        ...schemas_1.pagination,
        ...{
            transform: joi_1.default.bool().default(true),
        },
    },
    payload: {
        orderBy: schemas_1.orderBy(iteratees_1.transactionIteratees),
        id: joi_1.default.string()
            .hex()
            .length(64),
        blockId: schemas_1.blockId,
        type: joi_1.default.number()
            .integer()
            .min(0),
        typeGroup: joi_1.default.number()
            .integer()
            .min(0),
        version: joi_1.default.number()
            .integer()
            .positive(),
        senderPublicKey: schemas_1.publicKey,
        senderId: schemas_1.address,
        recipientId: schemas_1.address,
        addresses: joi_1.default.array()
            .unique()
            .min(1)
            .max(50)
            .items(schemas_1.address),
        vendorField: joi_1.default.string().max(255, "utf8"),
        timestamp: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        nonce: joi_1.default.number()
            .integer()
            .min(0),
        amount: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        fee: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        asset: joi_1.default.object(),
    },
};
//# sourceMappingURL=schema.js.map