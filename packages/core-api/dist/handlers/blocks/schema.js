"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
const iteratees_1 = require("../shared/iteratees");
const schemas_1 = require("../shared/schemas");
exports.index = {
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.blockIteratees),
            id: schemas_1.blockId,
            version: joi_1.default.number()
                .integer()
                .min(0),
            timestamp: joi_1.default.number()
                .integer()
                .min(0),
            previousBlock: schemas_1.blockId,
            height: joi_1.default.number()
                .integer()
                .positive(),
            numberOfTransactions: joi_1.default.number()
                .integer()
                .min(0),
            totalAmount: joi_1.default.number()
                .integer()
                .min(0),
            totalFee: joi_1.default.number()
                .integer()
                .min(0),
            reward: joi_1.default.number()
                .integer()
                .min(0),
            generatorPublicKey: schemas_1.publicKey,
            transform: joi_1.default.bool().default(true),
        },
    },
};
exports.first = {
    query: {
        transform: joi_1.default.bool().default(true),
    },
};
exports.last = {
    query: {
        transform: joi_1.default.bool().default(true),
    },
};
exports.show = {
    params: {
        id: schemas_1.blockId,
    },
    query: {
        transform: joi_1.default.bool().default(true),
    },
};
exports.transactions = {
    params: {
        id: joi_1.default.string(),
    },
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
            version: joi_1.default.number()
                .integer()
                .min(0),
            senderPublicKey: schemas_1.publicKey,
            senderId: schemas_1.address,
            recipientId: schemas_1.address,
            timestamp: joi_1.default.number()
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
exports.search = {
    query: {
        ...schemas_1.pagination,
        ...{
            transform: joi_1.default.bool().default(true),
        },
    },
    payload: {
        orderBy: schemas_1.orderBy(iteratees_1.blockIteratees),
        id: schemas_1.blockId,
        version: joi_1.default.number()
            .integer()
            .min(0),
        previousBlock: schemas_1.blockId,
        generatorPublicKey: schemas_1.publicKey,
        timestamp: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        height: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .positive(),
            to: joi_1.default.number()
                .integer()
                .positive(),
        }),
        numberOfTransactions: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        totalAmount: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        totalFee: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        reward: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
    },
};
//# sourceMappingURL=schema.js.map