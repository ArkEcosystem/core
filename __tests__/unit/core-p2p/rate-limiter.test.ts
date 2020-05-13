import { RateLimiter } from "@arkecosystem/core-p2p/src/rate-limiter";

describe("RateLimiter", () => {
    let rateLimiter: RateLimiter;

    const rateLimitConfig = {
        whitelist: ["127.0.0.1"],
        configurations: {
            global: {
                rateLimit: 20,
            },
            endpoints: [
                {
                    endpoint: "endpoint.1",
                    rateLimit: 5,
                    blockDuration: 10
                },
                {
                    endpoint: "endpoint.2",
                    rateLimit: 2,
                    duration: 10,
                    blockDuration: 15
                }
            ]
        }
    };

    beforeEach(() => {
        rateLimiter = new RateLimiter(rateLimitConfig);
    });

    describe("hasExceededRateLimit", () => {

    });

    describe("getRateLimitedEndpoints", () => {
        it("should return the rate limited endpoints", () => {
            expect(rateLimiter.getRateLimitedEndpoints()).toEqual(
                rateLimitConfig.configurations.endpoints.map(e => e.endpoint)
            );
        })
    });

    describe("isBlocked", () => {

    });
});