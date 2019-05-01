import { createServer, mountServer } from "@arkecosystem/core-http-utils";
import Boom from "@hapi/boom";
import Joi from "@hapi/joi";
import { client } from "./client";

export const startServer = async config => {
    const server = await createServer({
        host: config.host,
        port: config.port,
        routes: {
            validate: {
                async failAction(request, h, err) {
                    throw err;
                },
            },
        },
    });

    server.route([
        {
            method: "POST",
            path: "/",
            async handler(request) {
                try {
                    const { hits } = await client.search(request.payload);

                    return {
                        meta: {
                            count: hits.total,
                        },
                        data: hits.hits.map(result => result._source),
                    };
                } catch (error) {
                    return Boom.badRequest(error.message);
                }
            },
            options: {
                validate: {
                    payload: {
                        _source: Joi.any(),
                        _sourceExclude: Joi.any(),
                        _sourceInclude: Joi.any(),
                        allowNoIndices: Joi.boolean(),
                        analyzer: Joi.string(),
                        analyzeWildcard: Joi.boolean(),
                        batchedReduceSize: Joi.number(),
                        body: Joi.object(),
                        defaultOperator: Joi.string(),
                        df: Joi.string(),
                        docvalueFields: Joi.any(),
                        expandWildcards: Joi.string(),
                        explain: Joi.boolean(),
                        from: Joi.number(),
                        index: Joi.any(),
                        lenient: Joi.boolean(),
                        maxConcurrentShardRequests: Joi.number(),
                        preference: Joi.string(),
                        preFilterShardSize: Joi.number(),
                        q: Joi.string(),
                        requestCache: Joi.boolean(),
                        routing: Joi.any(),
                        scroll: Joi.string(),
                        searchType: Joi.string(),
                        size: Joi.number().default(10),
                        sort: Joi.any(),
                        stats: Joi.any(),
                        storedFields: Joi.any(),
                        suggestField: Joi.string(),
                        suggestMode: Joi.string(),
                        suggestSize: Joi.number(),
                        suggestText: Joi.string(),
                        terminateAfter: Joi.number(),
                        timeout: Joi.string(),
                        trackScores: Joi.boolean(),
                        trackTotalHits: Joi.boolean(),
                        type: Joi.any(),
                        typedKeys: Joi.boolean(),
                        version: Joi.boolean(),
                    },
                },
            },
        },
    ]);

    return mountServer("Elasticsearch API", server);
};
