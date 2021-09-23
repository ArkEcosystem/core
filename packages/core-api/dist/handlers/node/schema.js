"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
exports.fees = {
    query: {
        days: joi_1.default
            .number()
            .integer()
            .min(1)
            .max(30)
            .default(7),
    },
};
exports.debug = {
    query: {
        lines: joi_1.default
            .number()
            .integer()
            .min(1)
            .max(10000)
            .default(1000),
    },
};
//# sourceMappingURL=schema.js.map