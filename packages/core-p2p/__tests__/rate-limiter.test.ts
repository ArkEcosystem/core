import { RateLimiter } from "@arkecosystem/core-p2p/src/rate-limiter";
import { cloneDeep } from "lodash";

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
                    blockDuration: 10,
                },
                {
                    endpoint: "endpoint.2",
                    rateLimit: 2,
                    duration: 10,
                    blockDuration: 15,
                },
            ],
        },
    };

    beforeEach(() => {
        rateLimiter = new RateLimiter(rateLimitConfig);
    });

    describe("constructor", () => {
        it("should create RateLimiter if configurations.endpoints is empty", async () => {
            const tmpRateLimitConfig = cloneDeep(rateLimitConfig);
            delete tmpRateLimitConfig.configurations.endpoints;

            rateLimiter = new RateLimiter(tmpRateLimitConfig);
        });
    });

    describe("hasExceededRateLimit", () => {
        it("should return true until it hits global rate limit", async () => {
            const ip = "187.155.66.55";
            for (let i = 0; i < 20; i++) {
                expect(await rateLimiter.hasExceededRateLimit(ip)).toBeFalse();
            }
            expect(await rateLimiter.hasExceededRateLimit(ip)).toBeTrue();
        });

        it("should return true until it hits endpoint rate limit", async () => {
            const ip = "187.155.66.55";
            const endpoint = "endpoint.1";
            for (let i = 0; i < 5; i++) {
                expect(await rateLimiter.hasExceededRateLimit(ip, endpoint)).toBeFalse();
            }
            expect(await rateLimiter.hasExceededRateLimit(ip, endpoint)).toBeTrue();
        });
    });

    describe("getRateLimitedEndpoints", () => {
        it("should return the rate limited endpoints", () => {
            expect(rateLimiter.getRateLimitedEndpoints()).toEqual(
                rateLimitConfig.configurations.endpoints.map((e) => e.endpoint),
            );
        });
    });

    describe("isBlocked", () => {
        it("should return true when ip is blocked, false when it is not", async () => {
            const ip = "187.155.66.55";
            for (let i = 0; i < 19; i++) {
                expect(await rateLimiter.hasExceededRateLimit(ip)).toBeFalse();
                expect(await rateLimiter.isBlocked(ip)).toBeFalse();
            }

            expect(await rateLimiter.hasExceededRateLimit(ip)).toBeFalse();
            expect(await rateLimiter.isBlocked(ip)).toBeTrue(); // no remaining points

            expect(await rateLimiter.hasExceededRateLimit(ip)).toBeTrue();
            expect(await rateLimiter.isBlocked(ip)).toBeTrue();
        });
    });
});
