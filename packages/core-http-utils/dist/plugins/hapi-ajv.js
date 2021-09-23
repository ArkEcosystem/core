"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const boom_1 = __importDefault(require("@hapi/boom"));
const name = "hapi-ajv";
exports.hapiAjv = {
    name,
    version: "1.0.0",
    register: async (server, options) => {
        if (options.registerFormats) {
            options.registerFormats(crypto_1.Validation.validator.getInstance());
        }
        const createErrorResponse = (request, h, errors) => {
            if (request.pre.apiVersion === 1) {
                return h
                    .response({
                    path: errors[0].dataPath,
                    error: errors[0].message,
                    success: false,
                })
                    .takeover();
            }
            return boom_1.default.badData(errors.map(error => error.message).join(","));
        };
        server.ext({
            type: "onPreHandler",
            method: (request, h) => {
                const config = request.route.settings.plugins[name] || {};
                if (config.payloadSchema) {
                    const { error, errors } = crypto_1.Validation.validator.validate(config.payloadSchema, request.payload);
                    if (error) {
                        return createErrorResponse(request, h, errors);
                    }
                }
                if (config.querySchema) {
                    const { error, errors } = crypto_1.Validation.validator.validate(config.querySchema, request.query);
                    if (error) {
                        return createErrorResponse(request, h, errors);
                    }
                }
                return h.continue;
            },
        });
    },
};
//# sourceMappingURL=hapi-ajv.js.map