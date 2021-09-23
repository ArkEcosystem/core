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
            orderBy: schemas_1.orderBy(iteratees_1.businessIteratees),
            publicKey: schemas_1.publicKey,
            isResigned: joi_1.default.bool(),
            transform: joi_1.default.bool().default(true),
        },
    },
};
exports.show = {
    params: {
        id: schemas_1.walletId,
    },
    query: {
        transform: joi_1.default.bool().default(true),
    },
};
exports.bridgechains = {
    params: {
        id: schemas_1.walletId,
    },
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.bridgechainIteratees),
            isResigned: joi_1.default.bool(),
        },
    },
};
exports.bridgechain = {
    params: {
        businessId: schemas_1.walletId,
        bridgechainId: joi_1.default.string()
            .hex()
            .length(64),
    },
};
exports.search = {
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.businessIteratees),
        },
    },
    payload: {
        address: schemas_1.address,
        publicKey: schemas_1.publicKey,
        name: schemas_1.genericName,
        website: joi_1.default.string().max(80),
        vat: joi_1.default.string()
            .alphanum()
            .max(15),
        repository: joi_1.default.string().max(80),
        isResigned: joi_1.default.bool(),
        transform: joi_1.default.bool().default(true),
    },
};
//# sourceMappingURL=schema.js.map