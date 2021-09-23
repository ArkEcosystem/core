"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const joi_1 = __importDefault(require("@hapi/joi"));
const iteratees_1 = require("../shared/iteratees");
const schemas_1 = require("../shared/schemas");
const config = core_container_1.app.getConfig();
const schemaIntegerBetween = joi_1.default.object().keys({
    from: joi_1.default.number()
        .integer()
        .min(0),
    to: joi_1.default.number()
        .integer()
        .min(0),
});
const schemaPercentage = joi_1.default.object().keys({
    from: joi_1.default.number()
        .precision(2)
        .min(0)
        .max(100),
    to: joi_1.default.number()
        .precision(2)
        .min(0)
        .max(100),
});
exports.index = {
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.delegateIteratees),
            type: joi_1.default.string().valid("resigned", "never-forged"),
            address: schemas_1.address,
            publicKey: schemas_1.publicKey,
            secondPublicKey: schemas_1.publicKey,
            vote: schemas_1.publicKey,
            username: schemas_1.username,
            balance: joi_1.default.number()
                .integer()
                .min(0),
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
exports.search = {
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.delegateIteratees),
        },
    },
    payload: {
        address: schemas_1.address,
        publicKey: schemas_1.publicKey,
        username: schemas_1.username,
        usernames: joi_1.default.array()
            .unique()
            .min(1)
            .max(config.getMilestone().activeDelegates)
            .items(schemas_1.username),
        approval: schemaPercentage,
        forgedFees: schemaIntegerBetween,
        forgedRewards: schemaIntegerBetween,
        forgedTotal: schemaIntegerBetween,
        producedBlocks: schemaIntegerBetween,
        voteBalance: schemaIntegerBetween,
    },
};
exports.blocks = {
    params: {
        id: schemas_1.walletId,
    },
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
            payloadLength: joi_1.default.number()
                .integer()
                .min(0),
            payloadHash: joi_1.default.string().hex(),
            generatorPublicKey: schemas_1.publicKey,
            blockSignature: joi_1.default.string().hex(),
            transform: joi_1.default.bool().default(true),
        },
    },
};
exports.voters = {
    params: {
        id: schemas_1.walletId,
    },
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.walletIteratees),
            address: schemas_1.address,
            publicKey: schemas_1.publicKey,
            secondPublicKey: schemas_1.publicKey,
            vote: schemas_1.publicKey,
            username: schemas_1.username,
            balance: joi_1.default.number()
                .integer()
                .min(0),
            voteBalance: joi_1.default.number()
                .integer()
                .min(0),
            producedBlocks: joi_1.default.number()
                .integer()
                .min(0),
            transform: joi_1.default.bool().default(true),
        },
    },
};
//# sourceMappingURL=schema.js.map