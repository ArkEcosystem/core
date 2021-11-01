import "jest-extended";

import Boom from "@hapi/boom";
import { Application } from "@packages/core-kernel";
import NodeCache from "node-cache";

import { initApp, initServer } from "../__support__";

let app: Application;

beforeEach(() => {
    app = initApp();
});

describe("Cache", () => {
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
                cache: {
                    enabled: true,
                    stdTTL: 0, // unlimited
                    checkperiod: 0, // no periodic check
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

    it("should not cache if cache is disabled", async () => {
        defaults.plugins.cache.enabled = false;
        const server = await initServer(app, defaults, customRoute);

        let response = await server.inject(injectOptions);
        let payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");

        customResponse = {
            data: "dummy",
        };

        response = await server.inject(injectOptions);
        payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("dummy");
    });

    it("shod resolve if cache is enabled", async () => {
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });

    it("should cache respone if cache is enabled", async () => {
        const server = await initServer(app, defaults, customRoute);

        let response = await server.inject(injectOptions);
        let payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");

        customResponse = {
            data: "dummy",
        };

        response = await server.inject(injectOptions);
        payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });

    it("should cache boom if cache is enabled", async () => {
        const server = await initServer(app, defaults, customRoute);

        customResponse = Boom.badData("Bad data");

        let response = await server.inject(injectOptions);
        let payload = JSON.parse(response.payload || {});
        expect(payload.message).toBe("Bad data");

        customResponse = Boom.badData("Dummy Bad data");

        response = await server.inject(injectOptions);
        payload = JSON.parse(response.payload || {});
        expect(payload.message).toBe("Bad data");
    });

    it("should not cache response if cache response not cached", async () => {
        NodeCache.prototype.get = (cacheKey: any) => {
            return undefined;
        };

        const server = await initServer(app, defaults, customRoute);

        let response = await server.inject(injectOptions);
        let payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");

        customResponse = {
            data: "dummy",
        };

        response = await server.inject(injectOptions);
        payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("dummy");
    });
});
