"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
const customJoi = joi_1.default.extend(joi => ({
    base: joi.any(),
    name: "orderBy",
    language: {
        format: "needs to match format <iteratee>:<direction>",
        iteratee: "needs to have an iteratee included in: [{{valid}}]",
        direction: 'needs to have a direction of either "asc" or "desc"',
    },
    rules: [
        {
            name: "valid",
            params: {
                validIteratees: joi
                    .array()
                    .min(1)
                    .items(joi_1.default.string())
                    .required(),
            },
            validate(params, value, state, options) {
                const orderBy = value.split(":");
                if (orderBy.length !== 2) {
                    return this.createError("orderBy.format", { v: value }, state, options);
                }
                const [iteratee, direction] = orderBy;
                if (!["asc", "desc"].includes(direction)) {
                    return this.createError("orderBy.direction", { v: value }, state, options);
                }
                if (!params.validIteratees.includes(iteratee)) {
                    return this.createError("orderBy.iteratee", { v: value, valid: params.validIteratees.join(", ") }, state, options);
                }
                return value;
            },
        },
    ],
}));
exports.orderBy = validIteratees => customJoi.orderBy().valid(validIteratees);
//# sourceMappingURL=order-by.js.map