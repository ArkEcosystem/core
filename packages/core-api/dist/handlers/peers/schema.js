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
            ip: joi_1.default.string().ip(),
            version: joi_1.default.string(),
            orderBy: schemas_1.orderBy(iteratees_1.peerIteratees),
        },
    },
};
exports.show = {
    params: {
        ip: joi_1.default.string().ip(),
    },
};
//# sourceMappingURL=schema.js.map