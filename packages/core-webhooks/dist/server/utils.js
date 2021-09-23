"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
exports.transformResource = (model) => {
    return {
        id: model.id,
        event: model.event,
        target: model.target,
        token: model.token,
        enabled: model.enabled,
        conditions: model.conditions,
    };
};
exports.respondWithResource = data => {
    return data ? { data: exports.transformResource(data) } : boom_1.default.notFound();
};
//# sourceMappingURL=utils.js.map