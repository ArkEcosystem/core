"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
exports.conditions = [
    "between",
    "contains",
    "eq",
    "falsy",
    "gt",
    "gte",
    "lt",
    "lte",
    "ne",
    "not-between",
    "regexp",
    "truthy",
];
exports.show = {
    params: {
        id: joi_1.default.string().required(),
    },
};
exports.store = {
    payload: {
        event: joi_1.default.string().required(),
        target: joi_1.default.string()
            .uri()
            .required(),
        enabled: joi_1.default.boolean().default(true),
        conditions: joi_1.default.array()
            .items(joi_1.default.object({
            key: joi_1.default.string().required(),
            value: joi_1.default.any(),
            condition: joi_1.default.string()
                .valid(exports.conditions)
                .required(),
        }))
            .required(),
    },
};
exports.update = {
    params: {
        id: joi_1.default.string().required(),
    },
    payload: {
        event: joi_1.default.string().required(),
        target: joi_1.default.string()
            .uri()
            .required(),
        enabled: joi_1.default.boolean().required(),
        conditions: joi_1.default.array()
            .items(joi_1.default.object({
            key: joi_1.default.string().required(),
            value: joi_1.default.any(),
            condition: joi_1.default.string()
                .valid(exports.conditions)
                .required(),
        }))
            .required(),
    },
};
exports.destroy = {
    params: {
        id: joi_1.default.string().required(),
    },
};
//# sourceMappingURL=schema.js.map