import "jest-extended";

import { Application } from "@packages/core-kernel";
import { RLWrapperBlackAndWhite } from "rate-limiter-flexible";

import { initApp, initServer } from "../__support__";
let app: Application;

beforeEach(() => {
    app = initApp();
});

describe("Rate limit", () => {
    let defaults: any;
    let customResponse: any;
    let customRoute: any;
    let injectOptions: any;

    beforeEach(() => {
        defaults = {
            plugins: {
                pagination: {
                    limit: 100,
                },
                socketTimeout: 5000,
                rateLimit: {
                    enabled: true,
                    points: 1,
                    duration: 1,
                },
            },
        };

        customResponse = {
            data: "ok",
        };

        customRoute = {
            method: "GET",
            path: "/test",
            handler: () => {
                return customResponse;
            },
        };

        injectOptions = {
            method: "GET",
            url: "/test",
        };
    });

    it("should resolve if rate limit is disabled", async () => {
        defaults.plugins.rateLimit.enabled = false;
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });

    it("should return error if rate limit is exceeded", async () => {
        defaults.plugins.rateLimit.whitelist = [];
        defaults.plugins.rateLimit.blacklist = [];
        const server = await initServer(app, defaults, customRoute);

        let response = await server.inject(injectOptions);
        let payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");

        response = await server.inject(injectOptions);
        payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(429);
    });

    it("should resolve if whitelisted", async () => {
        defaults.plugins.rateLimit.whitelist = ["127.0.0.1"];
        defaults.plugins.rateLimit.blacklist = ["*"];
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });

    it("should resolve if whitelisted as pattern", async () => {
        defaults.plugins.rateLimit.whitelist = ["*"];
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });

    it("should return error if blacklisted", async () => {
        defaults.plugins.rateLimit.whitelist = [];
        defaults.plugins.rateLimit.blacklist = ["127.0.0.1"];
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(429);
    });

    it("should return error if blacklisted with *", async () => {
        defaults.plugins.rateLimit.whitelist = ["127.0.0.2", "127.0.0.3"];
        defaults.plugins.rateLimit.blacklist = ["*"];
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(429);
    });

    it("should return boom if consume throws error", async () => {
        RLWrapperBlackAndWhite.prototype.consume = (key, pointsToConsume) => {
            throw new Error();
        };

        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(500);
    });
});
