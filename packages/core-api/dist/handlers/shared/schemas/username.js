"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
exports.username = joi_1.default.string()
    .regex(/^[a-z0-9!@$&_.]+$/)
    .min(1)
    .max(20);
//# sourceMappingURL=username.js.map