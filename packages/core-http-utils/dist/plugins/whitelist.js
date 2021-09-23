"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
const boom_1 = __importDefault(require("@hapi/boom"));
exports.whitelist = {
    name: "whitelist",
    version: "0.1.0",
    register(server, options) {
        server.ext({
            type: "onRequest",
            async method(request, h) {
                if (core_utils_1.isWhitelisted(options.whitelist, request.info.remoteAddress)) {
                    return h.continue;
                }
                return boom_1.default.forbidden();
            },
        });
    },
};
//# sourceMappingURL=whitelist.js.map