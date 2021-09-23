"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const ip_1 = __importDefault(require("ip"));
exports.validateJSON = (data, schema) => {
    crypto_1.Validation.validator.addFormat("ip", {
        type: "string",
        validate: value => ip_1.default.isV4Format(value) || ip_1.default.isV6Format(value),
    });
    return crypto_1.Validation.validator.validate(schema, data);
};
//# sourceMappingURL=validate-json.js.map