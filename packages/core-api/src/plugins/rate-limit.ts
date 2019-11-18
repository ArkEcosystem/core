import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import mm from "micromatch";
import { RateLimiterMemory, RLWrapperBlackAndWhite } from "rate-limiter-flexible";

interface RateLimitResult {
    msBeforeNext: number;
    remainingPoints: number;
    consumedPoints: number;
    isFirstInDuration: boolean;
}

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
        options: { enabled: boolean; points: number; duration: number; whitelist: string[]; blacklist: string[] },
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
                    const result: RateLimitResult = await rateLimiter.consume(request.info.remoteAddress, 1);

                    request.headers["Retry-After"] = result.msBeforeNext / 1000;
                    request.headers["X-RateLimit-Limit"] = options.points;
                    request.headers["X-RateLimit-Remaining"] = result.remainingPoints;
                    request.headers["X-RateLimit-Reset"] = new Date(Date.now() + result.msBeforeNext);
                } catch (error) {
                    if (error instanceof Error) {
                        return Boom.internal(error.message);
                    }

                    const tooManyRequests = Boom.tooManyRequests();
                    tooManyRequests.output.headers["Retry-After"] = `${Math.round(error.msBeforeNext / 1000) || 1}`;

                    return tooManyRequests;
                }

                return h.continue;
            },
        });
    },
};
