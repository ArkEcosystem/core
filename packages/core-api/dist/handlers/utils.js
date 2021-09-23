"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const boom_1 = __importDefault(require("@hapi/boom"));
const transformer_1 = require("../services/transformer");
exports.paginate = (request) => {
    const pagination = {
        // @ts-ignore
        offset: (request.query.page - 1) * request.query.limit || 0,
        // @ts-ignore
        limit: request.query.limit || 100,
    };
    // @ts-ignore
    if (request.query.offset) {
        // @ts-ignore
        pagination.offset = request.query.offset;
    }
    return pagination;
};
exports.respondWithResource = (data, transformer, transform = true) => {
    return data ? { data: transformer_1.transformerService.toResource(data, transformer, transform) } : boom_1.default.notFound();
};
exports.respondWithCollection = (data, transformer, transform = true) => {
    return {
        data: transformer_1.transformerService.toCollection(data, transformer, transform),
    };
};
exports.respondWithCache = (data, h) => {
    if (!core_container_1.app.resolveOptions("api").cache.enabled) {
        return data;
    }
    const { value, cached } = data;
    const lastModified = cached ? new Date(cached.stored) : new Date();
    if (value.isBoom) {
        return h.response(value.output.payload).code(value.output.statusCode);
    }
    let arg;
    if (value.results && value.totalCount !== undefined && value.totalCountIsEstimate !== undefined) {
        arg = {
            results: value.results,
            totalCount: value.totalCount,
            response: { meta: { totalCountIsEstimate: value.totalCountIsEstimate } },
        };
    }
    else {
        arg = value;
    }
    return h.response(arg).header("Last-modified", lastModified.toUTCString());
};
exports.toResource = (data, transformer, transform = true) => {
    return transformer_1.transformerService.toResource(data, transformer, transform);
};
exports.toCollection = (data, transformer, transform = true) => {
    return transformer_1.transformerService.toCollection(data, transformer, transform);
};
exports.toPagination = (data, transformer, transform = true) => {
    return {
        results: transformer_1.transformerService.toCollection(data.rows, transformer, transform),
        totalCount: data.count,
        meta: { totalCountIsEstimate: data.countIsEstimate },
    };
};
//# sourceMappingURL=utils.js.map