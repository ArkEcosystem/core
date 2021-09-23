"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
exports.genericName = joi_1.default.string()
    .regex(/^[a-zA-Z0-9]+(( - |[ ._-])[a-zA-Z0-9]+)*[.]?$/)
    .min(1)
    .max(40);
//# sourceMappingURL=generic-name.js.map