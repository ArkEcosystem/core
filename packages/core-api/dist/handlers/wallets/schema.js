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
            orderBy: schemas_1.orderBy(iteratees_1.walletIteratees),
            address: schemas_1.address,
            publicKey: schemas_1.publicKey,
            secondPublicKey: schemas_1.publicKey,
            vote: schemas_1.publicKey,
            username: schemas_1.username,
            balance: joi_1.default.number().integer(),
            voteBalance: joi_1.default.number()
                .integer()
                .min(0),
            producedBlocks: joi_1.default.number()
                .integer()
                .min(0),
        },
    },
};
exports.show = {
    params: {
        id: schemas_1.walletId,
    },
};
exports.transactions = {
    params: {
        id: schemas_1.walletId,
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
            typeGroup: joi_1.default.number()
                .integer()
                .min(0),
            version: joi_1.default.number()
                .integer()
                .positive(),
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
exports.transactionsSent = {
    params: {
        id: schemas_1.walletId,
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
            typeGroup: joi_1.default.number()
                .integer()
                .min(0),
            version: joi_1.default.number()
                .integer()
                .positive(),
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
exports.transactionsReceived = {
    params: {
        id: schemas_1.walletId,
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
            typeGroup: joi_1.default.number()
                .integer()
                .min(0),
            version: joi_1.default.number()
                .integer()
                .positive(),
            senderPublicKey: schemas_1.publicKey,
            senderId: schemas_1.address,
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
exports.votes = {
    params: {
        id: schemas_1.walletId,
    },
    query: {
        ...schemas_1.pagination,
        ...{
            transform: joi_1.default.bool().default(true),
        },
    },
};
exports.locks = {
    params: {
        id: schemas_1.walletId,
    },
    query: {
        ...schemas_1.pagination,
        ...{
            isExpired: joi_1.default.bool(),
            orderBy: schemas_1.orderBy(iteratees_1.lockIteratees),
        },
    },
};
exports.search = {
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.walletIteratees),
        },
    },
    payload: {
        address: schemas_1.address,
        addresses: joi_1.default.array()
            .unique()
            .min(1)
            .max(50)
            .items(schemas_1.address),
        publicKey: schemas_1.publicKey,
        secondPublicKey: schemas_1.publicKey,
        vote: schemas_1.publicKey,
        username: schemas_1.username,
        producedBlocks: joi_1.default.number()
            .integer()
            .min(0),
        balance: joi_1.default.object().keys({
            from: joi_1.default.number().integer(),
            to: joi_1.default.number().integer(),
        }),
        voteBalance: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        lockedBalance: joi_1.default.object().keys({
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