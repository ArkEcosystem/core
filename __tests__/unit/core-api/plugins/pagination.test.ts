import "jest-extended";

import { Application } from "@arkecosystem/core-kernel";
import { initApp } from "../__support__";
import { initServer } from "./__support__";

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
            },
        };

        customResponse = ["Item1", "Item2", "Item3"];

        customRoute = {
            method: 'GET',
            path: '/api/transactions',
            handler: () => {
                return customResponse
            }
        };

        injectOptions = {
            method: 'GET',
            url: '/api/transactions',
        };
    });

    it("should return paginated payload", async () => {
        let server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toEqual(customResponse);
        expect(payload.meta).toEqual(expect.objectContaining(
            {
                count: 3,
                pageCount: 1
            }
        ));
    });

    it("should not return paginated payload if disabled on route", async () => {
        customRoute.options = {
            plugins: {
                pagination: {
                    pagination: false
                }
            }
        };

        let server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});

        expect(payload).toEqual(customResponse);
        expect(payload.data).toBeUndefined();
        expect(payload.meta).toBeUndefined();
    });

    it("should return paginated payload when params are invalid", async () => {
        let server = await initServer(app, defaults, customRoute);

        injectOptions.url = '/api/transactions?page="invalid_values"&limit="invalid_value"';

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toEqual(customResponse);
        expect(payload.meta).toEqual(expect.objectContaining(
            {
                count: 3,
                pageCount: 1
            }
        ));
    });

    it("should return paginated payload with total count", async () => {
        let server = await initServer(app, defaults, customRoute);

        customResponse.totalCount = 5;

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.meta).toEqual(expect.objectContaining(
            {
                count: 3,
                pageCount: 1,
                totalCount: 5
            }
        ));
    });

    it("should return paginated payload with response object", async () => {
        let server = await initServer(app, defaults, customRoute);

        customResponse.response = {
            test: "test_value"
        };

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.meta).toEqual(expect.objectContaining(
            {
                count: 3,
                pageCount: 1
            }
        ));
        expect(payload.test).toEqual("test_value");
    });
});
