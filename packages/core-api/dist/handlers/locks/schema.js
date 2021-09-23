"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const joi_1 = __importDefault(require("@hapi/joi"));
const iteratees_1 = require("../shared/iteratees");
const schemas_1 = require("../shared/schemas");
exports.index = {
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.lockIteratees),
            recipientId: schemas_1.address,
            senderPublicKey: schemas_1.publicKey,
            lockId: joi_1.default.string()
                .hex()
                .length(64),
            secretHash: joi_1.default.string()
                .hex()
                .length(64),
            amount: joi_1.default.number()
                .integer()
                .min(0),
            expirationValue: joi_1.default.number()
                .integer()
                .min(0),
            expirationType: joi_1.default.number().only(...Object.values(crypto_1.Enums.HtlcLockExpirationType)),
            isExpired: joi_1.default.bool(),
        },
    },
};
exports.show = {
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
            orderBy: schemas_1.orderBy(iteratees_1.lockIteratees),
        },
    },
    payload: {
        recipientId: schemas_1.address,
        senderPublicKey: schemas_1.publicKey,
        lockId: joi_1.default.string()
            .hex()
            .length(64),
        secretHash: joi_1.default.string()
            .hex()
            .length(64),
        amount: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        timestamp: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        vendorField: joi_1.default.string()
            .min(1)
            .max(255),
        expirationType: joi_1.default.number().only(...Object.values(crypto_1.Enums.HtlcLockExpirationType)),
        expirationValue: joi_1.default.object().keys({
            from: joi_1.default.number()
                .integer()
                .min(0),
            to: joi_1.default.number()
                .integer()
                .min(0),
        }),
        isExpired: joi_1.default.bool(),
    },
};
exports.unlocked = {
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.transactionIteratees),
        },
    },
    payload: {
        ids: joi_1.default.array()
            .unique()
            .min(1)
            .max(25)
            .items(joi_1.default.string()
            .hex()
            .length(64)),
    },
};
//# sourceMappingURL=schema.js.map