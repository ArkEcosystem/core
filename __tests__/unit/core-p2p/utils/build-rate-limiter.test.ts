import { buildRateLimiter } from "@packages/core-p2p/src/utils/build-rate-limiter";
import { RateLimiter } from "@packages/core-p2p/src/rate-limiter";

describe("buildRateLimiter", () => {
    it("should return instance of RateLimiter", () => {
        const rateLimiter = buildRateLimiter({ whitelist: [], remoteAccess: [] });

        expect(rateLimiter).toBeInstanceOf(RateLimiter);
    });
});
