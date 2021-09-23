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
            orderBy: schemas_1.orderBy(iteratees_1.bridgechainIteratees),
            publicKey: schemas_1.publicKey,
            isResigned: joi_1.default.bool(),
        },
    },
};
exports.search = {
    query: {
        ...schemas_1.pagination,
        ...{
            orderBy: schemas_1.orderBy(iteratees_1.bridgechainIteratees),
        },
    },
    payload: {
        address: schemas_1.address,
        publicKey: schemas_1.publicKey,
        bridgechainRepository: joi_1.default.string().max(80),
        genesisHash: joi_1.default.string()
            .hex()
            .length(64),
        name: schemas_1.genericName,
        seedNodes: joi_1.default.array()
            .unique()
            .min(1)
            .max(10)
            .items(joi_1.default.string().ip()),
        isResigned: joi_1.default.bool(),
    },
};
//# sourceMappingURL=schema.js.map