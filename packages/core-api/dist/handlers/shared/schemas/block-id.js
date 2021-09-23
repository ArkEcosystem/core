"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
exports.blockId = joi_1.default.alternatives().try(joi_1.default.string()
    .min(1)
    .max(20)
    .regex(/^[0-9]+$/, "decimal non-negative integer"), joi_1.default.string()
    .length(64)
    .hex());
//# sourceMappingURL=block-id.js.map