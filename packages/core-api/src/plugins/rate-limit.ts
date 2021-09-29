import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import mm from "nanomatch";
import { RateLimiterMemory, RateLimiterRes, RLWrapperBlackAndWhite } from "rate-limiter-flexible";

import { getIp } from "../utils";

type RateLimitPluginData = {
    remaining: number;
    reset: number;
};

const isListed = (ip: string, patterns: string[]): boolean => {
    if (!Array.isArray(patterns)) {
        return true;
    }

    for (const pattern of patterns) {
        if (mm.isMatch(ip, pattern)) {
            return true;
        }
    }

    return false;
};

export = {
    name: "rate-limit",
    version: "1.0.0",
    once: true,
    async register(
        server: Hapi.Server,
        options: {
            enabled: boolean;
            points: number;
            duration: number;
            whitelist: string[];
            blacklist: string[];
            trustProxy: boolean;
        },
    ): Promise<void> {
        if (options.enabled === false) {
            return;
        }

        const rateLimiter = new RLWrapperBlackAndWhite({
            limiter: new RateLimiterMemory({ points: options.points, duration: options.duration }),
            whiteList: options.whitelist || ["*"],
            blackList: options.blacklist || [],
            isWhite: (ip: string) => {
                return isListed(ip, options.whitelist);
            },
            isBlack: (ip: string) => {
                return isListed(ip, options.blacklist);
            },
            runActionAnyway: false,
        });

        server.ext({
            type: "onPostAuth",
            async method(request, h) {
                try {
                    const rateLimitRes: RateLimiterRes = await rateLimiter.consume(
                        getIp(request, options.trustProxy),
                        1,
                    );

                    request.plugins["rate-limit"] = {
                        remaining: rateLimitRes.remainingPoints,
                        reset: Date.now() + rateLimitRes.msBeforeNext,
                    } as RateLimitPluginData;
                } catch (rateLimitRes) {
                    if (rateLimitRes instanceof Error) {
                        return Boom.internal(rateLimitRes.message);
                    }

                    request.plugins["rate-limit"] = {
                        remaining: rateLimitRes.remainingPoints,
                        reset: Date.now() + rateLimitRes.msBeforeNext,
                    } as RateLimitPluginData;

                    return Boom.tooManyRequests();
                }

                return h.continue;
            },
        });

        server.ext({
            type: "onPreResponse",
            async method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
                if (request.plugins["rate-limit"]) {
                    const data = request.plugins["rate-limit"] as RateLimitPluginData;

                    if (request.response.isBoom) {
                        request.response.output.headers["X-RateLimit-Limit"] = String(options.points);
                        request.response.output.headers["X-RateLimit-Remaining"] = String(data.remaining);
                        request.response.output.headers["X-RateLimit-Reset"] = new Date(data.reset).toUTCString();
                        request.response.output.headers["Retry-After"] = Math.max(0, (data.reset - Date.now()) / 1000);
                    } else {
                        request.response.header("X-RateLimit-Limit", String(options.points));
                        request.response.header("X-RateLimit-Remaining", String(data.remaining));
                        request.response.header("X-RateLimit-Reset", new Date(data.reset).toUTCString());
                    }
                }

                return h.continue;
            },
        });
    },
};
