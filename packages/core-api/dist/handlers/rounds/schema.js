"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
exports.delegates = {
    params: {
        id: joi_1.default.number()
            .integer()
            .min(1),
    },
};
//# sourceMappingURL=schema.js.map