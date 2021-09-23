"use strict";
// Based on https://github.com/fknop/hapi-pagination
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
exports.getConfig = options => {
    const { error, value } = joi_1.default.validate(options, {
        query: joi_1.default.object({
            limit: joi_1.default.object({
                default: joi_1.default.number()
                    .integer()
                    .positive()
                    .default(100),
            }),
        }),
    });
    return { error: error || undefined, config: error ? undefined : value };
};
//# sourceMappingURL=config.js.map