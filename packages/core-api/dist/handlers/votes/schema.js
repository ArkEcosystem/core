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
            orderBy: schemas_1.orderBy(iteratees_1.transactionIteratees),
            id: joi_1.default.string()
                .hex()
                .length(64),
            blockId: schemas_1.blockId,
            version: joi_1.default.number()
                .integer()
                .positive(),
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
//# sourceMappingURL=schema.js.map