import { Crypto } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import NodeCache from "node-cache";

type CachedResponse = {
    code: number;
    headers: Record<string, string>;
    payload: Hapi.ResponseValue | undefined;
};

const generateCacheKey = (request: Hapi.Request): string => {
    const json = JSON.stringify({
        pathname: request.url.pathname,
        params: request.params || {},
        payload: request.payload || {},
        query: request.query,
        method: request.method,
    });

    return Crypto.HashAlgorithms.sha256(json).toString("hex");
};

export type CacheOptions = {
    enabled: boolean;
    stdTTL: number;
    checkperiod: number;
};

export const cache: Hapi.Plugin<CacheOptions> = {
    name: "node-cache",
    version: "1.0.0",
    once: true,
    async register(server: Hapi.Server, options: CacheOptions): Promise<void> {
        if (!options.enabled) {
            return;
        }

        const cache: NodeCache = new NodeCache({ stdTTL: options.stdTTL, checkperiod: options.checkperiod });

        // const lastModified = cached ? new Date(cached.stored) : new Date();
        // return h.response(arg).header("Last-modified", lastModified.toUTCString());

        server.ext({
            type: "onPreHandler",
            async method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
                const cacheKey: string = generateCacheKey(request);
                const cachedResponse: CachedResponse | undefined = cache.get(cacheKey);

                if (cachedResponse) {
                    const newResponse = h.response(cachedResponse.payload).code(cachedResponse.code);

                    for (const [headerName, headerValue] of Object.entries(cachedResponse.headers)) {
                        newResponse.header(headerName, headerValue);
                    }

                    return newResponse.takeover();
                } else {
                    return h.continue;
                }
            },
        });

        server.ext({
            type: "onPreResponse",
            async method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
                let code: number;
                let headers: Boom.Output["headers"] | Hapi.ResponseObject["headers"];
                let payload: Boom.Payload | Hapi.Lifecycle.ReturnValue;

                if (Boom.isBoom(request.response)) {
                    code = request.response.output.statusCode;
                    headers = request.response.output.headers;
                    payload = request.response.output.payload;
                } else {
                    code = request.response.statusCode;
                    headers = request.response.headers;
                    payload = request.response.source;
                }

                // https://github.com/hapijs/hapi/blob/v20/lib/toolkit.js#L190-L192
                if (payload && typeof payload === "object" && typeof payload["then"] === "function") return h.continue;
                if (payload instanceof Error) return h.continue;
                if (typeof payload === "symbol") return h.continue;

                const cachedResponse: CachedResponse = {
                    code,
                    headers: {},
                    payload: payload as Hapi.ResponseValue, // checks above
                };

                if (code >= 300 && code < 400 && typeof headers["location"] === "string") {
                    cachedResponse.headers["location"] = headers["location"];
                }

                if (typeof headers["content-type"] === "string") {
                    cachedResponse.headers["content-type"] = headers["content-type"];
                }

                cache.set(generateCacheKey(request), cachedResponse);

                return h.continue;
            },
        });
    },
};
