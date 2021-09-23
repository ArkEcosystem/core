"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const joi_1 = __importDefault(require("@hapi/joi"));
exports.pagination = {
    page: joi_1.default.number()
        .integer()
        .positive(),
    offset: joi_1.default.number()
        .integer()
        .min(0),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(core_container_1.app.resolveOptions("api").pagination.limit),
};
//# sourceMappingURL=pagination.js.map