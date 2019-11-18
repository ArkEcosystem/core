import { Crypto } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import NodeCache from "node-cache";

const generateCacheKey = (request: Hapi.Request): string =>
    Crypto.HashAlgorithms.sha256(
        JSON.stringify({
            pathname: request.url.pathname,
            params: request.params || {},
            payload: request.payload || {},
            query: request.query || {},
        }),
    ).toString("hex");

export = {
    name: "node-cache",
    version: "1.0.0",
    once: true,
    async register(
        server: Hapi.Server,
        options: { enabled: boolean; stdTTL: number; checkperiod: number },
    ): Promise<void> {
        if (options.enabled === false) {
            return;
        }

        const cache: NodeCache = new NodeCache({ stdTTL: options.stdTTL, checkperiod: options.checkperiod });

        // const lastModified = cached ? new Date(cached.stored) : new Date();
        // return h.response(arg).header("Last-modified", lastModified.toUTCString());

        server.ext({
            type: "onPreHandler",
            async method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
                const cacheKey: string = generateCacheKey(request);

                if (cache.has(cacheKey)) {
                    const value: { isBoom: boolean; data: Record<string, any> } | undefined = cache.get(cacheKey);

                    if (value === undefined || value === null) {
                        return h.continue;
                    }

                    if (value.isBoom) {
                        return h
                            .response(value.data.payload)
                            .code(value.data.statusCode)
                            .takeover();
                    }

                    return h
                        .response(value.data)
                        .code(200)
                        .takeover();
                }

                return h.continue;
            },
        });

        server.ext({
            type: "onPreResponse",
            async method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
                const cacheKey: string = generateCacheKey(request);

                if (!cache.has(cacheKey)) {
                    cache.set(cacheKey, {
                        isBoom: request.response.isBoom === true,
                        data: request.response.isBoom ? request.response.output : request.response.source,
                    });
                }

                return h.continue;
            },
        });
    },
};
