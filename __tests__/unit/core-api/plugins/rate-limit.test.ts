import "jest-extended";

import { RLWrapperBlackAndWhite } from "rate-limiter-flexible";
import { Application } from "@arkecosystem/core-kernel";
import { initApp } from "../__support__";
import { initServer } from "./__support__";

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
                rateLimit: {
                    enabled: true,
                    points: 1,
                    duration: 1,
                }
            },
        };

        customResponse = {
            data: "ok"
        };

        customRoute = {
            method: 'GET',
            path: '/test',
            handler: () => {
                return customResponse
            },
        };

        injectOptions = {
            method: 'GET',
            url: '/test',
        };
    });


    it("shod resolve if rate limit is disabled", async () => {
        defaults.plugins.rateLimit.enabled = false;
        let server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });

    it("shod return error if rate limit is exceeded", async () => {
        defaults.plugins.rateLimit.whitelist = [];
        defaults.plugins.rateLimit.blacklist = [];
        let server = await initServer(app, defaults, customRoute);

        let response = await server.inject(injectOptions);
        let payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");

        response = await server.inject(injectOptions);
        payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(429);
    });

    it("shod resolve if whitelisted", async () => {
        defaults.plugins.rateLimit.whitelist = ["127.0.0.1"];
        let server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });

    it("shod resolve if whitelisted as pattern", async () => {
        defaults.plugins.rateLimit.whitelist = ["*"];
        let server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });


    it("shod return error if blacklisted", async () => {
        defaults.plugins.rateLimit.whitelist = [];
        defaults.plugins.rateLimit.blacklist = ["127.0.0.1"];
        let server = await initServer(app, defaults, customRoute);

        let response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(429);
    });

    it("shod return boom if consume throws error", async () => {
        RLWrapperBlackAndWhite.prototype.consume = (key, pointsToConsume) => {
            throw new Error();
        };

        let server = await initServer(app, defaults, customRoute);

        let response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(500);
    });
});
