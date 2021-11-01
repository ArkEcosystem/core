import "jest-extended";

import { Application } from "@packages/core-kernel";

import { initApp, initServer } from "../__support__";

let app: Application;

beforeEach(() => {
    app = initApp();
});

describe("Pagination", () => {
    let defaults: any;
    let injectOptions: any;
    let customResponse: any;
    let customRoute: any;

    beforeEach(() => {
        defaults = {
            plugins: {
                pagination: {
                    limit: 100,
                },
                socketTimeout: 5000,
            },
        };

        customResponse = ["Item1", "Item2", "Item3"];

        customRoute = {
            method: "GET",
            path: "/api/transactions",
            handler: () => {
                return customResponse;
            },
            options: {
                plugins: {
                    pagination: {
                        enabled: true,
                    },
                },
            },
        };

        injectOptions = {
            method: "GET",
            url: "/api/transactions",
        };
    });

    it("should return paginated payload", async () => {
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toEqual(customResponse);
        expect(payload.meta).toEqual(
            expect.objectContaining({
                count: 3,
                pageCount: 1,
            }),
        );
    });

    it("should return paginated payload - with query limit 1", async () => {
        injectOptions.url = injectOptions.url + "?limit=1";

        customResponse = {
            totalCount: 100,
            results: customResponse,
        };

        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toEqual(customResponse.results);
        expect(payload.meta).toEqual(
            expect.objectContaining({
                count: 3,
                pageCount: 100,
            }),
        );
    });

    it("should return paginated payload with data in results", async () => {
        customResponse = {
            results: customResponse,
        };

        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toEqual(customResponse.results);
        expect(payload.meta).toEqual(
            expect.objectContaining({
                count: 3,
                pageCount: 1,
            }),
        );
    });

    it("should return paginated payload with data in results if pagination have not enabled property", async () => {
        customResponse = {
            results: customResponse,
        };

        customRoute.options = {
            plugins: {
                pagination: {},
            },
        };

        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toEqual(customResponse.results);
        expect(payload.meta).toEqual(
            expect.objectContaining({
                count: 3,
                pageCount: 1,
            }),
        );
    });

    it("should not return paginated payload if disabled on route", async () => {
        customRoute.options = {
            plugins: {
                pagination: {
                    enabled: false,
                },
            },
        };

        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});

        expect(payload).toEqual(customResponse);
        expect(payload.data).toBeUndefined();
        expect(payload.meta).toBeUndefined();
    });

    it("should return paginated payload when params are invalid", async () => {
        const server = await initServer(app, defaults, customRoute);

        injectOptions.url = '/api/transactions?page="invalid_values"&limit="invalid_value"';

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toEqual(customResponse);
        expect(payload.meta).toEqual(
            expect.objectContaining({
                count: 3,
                pageCount: 1,
            }),
        );
    });

    it("should return paginated payload with total count", async () => {
        const server = await initServer(app, defaults, customRoute);

        customResponse.totalCount = 5;

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.meta).toEqual(
            expect.objectContaining({
                count: 3,
                pageCount: 1,
                totalCount: 5,
            }),
        );
    });

    it("should return paginated payload with previous url", async () => {
        const server = await initServer(app, defaults, customRoute);

        injectOptions.url = "/api/transactions?page=2";

        customResponse.totalCount = 5;

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.meta).toEqual(
            expect.objectContaining({
                count: 3,
                pageCount: 1,
                totalCount: 5,
            }),
        );
        expect(payload.meta.previous).toBeDefined();
    });

    it("should return paginated payload with response object", async () => {
        const server = await initServer(app, defaults, customRoute);

        customResponse.response = {
            test: "test_value",
        };

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.meta).toEqual(
            expect.objectContaining({
                count: 3,
                pageCount: 1,
            }),
        );
        expect(payload.test).toEqual("test_value");
    });
});
