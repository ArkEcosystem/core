"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_http_utils_1 = require("@arkecosystem/core-http-utils");
const boom_1 = __importDefault(require("@hapi/boom"));
const joi_1 = __importDefault(require("@hapi/joi"));
const client_1 = require("./client");
exports.startServer = async (config) => {
    const server = await core_http_utils_1.createServer({
        host: config.host,
        port: config.port,
    });
    server.route([
        {
            method: "POST",
            path: "/",
            async handler(request) {
                try {
                    const { body } = await client_1.client.search(request.payload);
                    return {
                        meta: {
                            count: body.hits.total,
                        },
                        data: body.hits.hits.map(result => result._source),
                    };
                }
                catch (error) {
                    return boom_1.default.badRequest(error.message);
                }
            },
            options: {
                validate: {
                    payload: {
                        _source: joi_1.default.any(),
                        _sourceExclude: joi_1.default.any(),
                        _sourceInclude: joi_1.default.any(),
                        allowNoIndices: joi_1.default.boolean(),
                        analyzer: joi_1.default.string(),
                        analyzeWildcard: joi_1.default.boolean(),
                        batchedReduceSize: joi_1.default.number(),
                        body: joi_1.default.object(),
                        defaultOperator: joi_1.default.string(),
                        df: joi_1.default.string(),
                        docvalueFields: joi_1.default.any(),
                        expandWildcards: joi_1.default.string(),
                        explain: joi_1.default.boolean(),
                        from: joi_1.default.number(),
                        index: joi_1.default.any(),
                        lenient: joi_1.default.boolean(),
                        maxConcurrentShardRequests: joi_1.default.number(),
                        preference: joi_1.default.string(),
                        preFilterShardSize: joi_1.default.number(),
                        q: joi_1.default.string(),
                        requestCache: joi_1.default.boolean(),
                        routing: joi_1.default.any(),
                        scroll: joi_1.default.string(),
                        searchType: joi_1.default.string(),
                        size: joi_1.default.number().default(10),
                        sort: joi_1.default.any(),
                        stats: joi_1.default.any(),
                        storedFields: joi_1.default.any(),
                        suggestField: joi_1.default.string(),
                        suggestMode: joi_1.default.string(),
                        suggestSize: joi_1.default.number(),
                        suggestText: joi_1.default.string(),
                        terminateAfter: joi_1.default.number(),
                        timeout: joi_1.default.string(),
                        trackScores: joi_1.default.boolean(),
                        trackTotalHits: joi_1.default.boolean(),
                        type: joi_1.default.any(),
                        typedKeys: joi_1.default.boolean(),
                        version: joi_1.default.boolean(),
                    },
                },
            },
        },
    ]);
    return core_http_utils_1.mountServer("Elasticsearch API", server);
};
//# sourceMappingURL=server.js.map