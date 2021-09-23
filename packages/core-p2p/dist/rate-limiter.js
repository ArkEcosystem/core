"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
class RateLimiter {
    constructor({ whitelist, configurations, }) {
        configurations.endpoints = configurations.endpoints || [];
        this.global = this.buildRateLimiter(configurations.global, whitelist);
        this.endpoints = new Map();
        for (const configuration of configurations.endpoints) {
            this.endpoints.set(configuration.endpoint, this.buildRateLimiter(configuration, whitelist));
        }
    }
    async hasExceededRateLimit(ip, endpoint) {
        try {
            await this.global.consume(ip);
            if (endpoint && this.endpoints.has(endpoint)) {
                await this.endpoints.get(endpoint).consume(ip);
            }
        }
        catch (_a) {
            return true;
        }
        return false;
    }
    getRateLimitedEndpoints() {
        return Array.from(this.endpoints.keys());
    }
    async isBlocked(ip) {
        const res = await this.global.get(ip);
        return res !== null && res.remainingPoints <= 0;
    }
    buildRateLimiter(configuration, whitelist) {
        return new rate_limiter_flexible_1.RLWrapperBlackAndWhite({
            limiter: new rate_limiter_flexible_1.RateLimiterMemory({
                points: configuration.rateLimit,
                duration: configuration.duration || 1,
                blockDuration: configuration.blockDuration,
            }),
            whiteList: whitelist,
        });
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map