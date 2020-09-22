import "jest-extended";

import { Application } from "@packages/core-kernel";

import { initApp, initServer } from "../__support__";

let app: Application;

beforeEach(() => {
    app = initApp();
});

describe("Hapi Ajv", () => {
    let defaults: any;
    let customResponse: any;
    let customRoute: any;
    let customRouteOptions: any;
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

        customRouteOptions = {
            plugins: {
                "hapi-ajv": {
                    payloadSchema: {
                        type: "object",
                        required: ["test"],
                        properties: {
                            test: {
                                minItems: 1,
                                maxItems: 1,
                            },
                        },
                    },
                    querySchema: {
                        type: "object",
                        required: ["test"],
                    },
                },
            },
        };

        customRoute = {
            method: "POST",
            path: "/test",
            handler: () => {
                return customResponse;
            },
            options: customRouteOptions,
        };

        injectOptions = {
            method: "POST",
            url: "/test?test=0",
            payload: {
                test: ["Item1"],
            },
        };
    });

    it("should return ok if payload is valid", async () => {
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });

    it("should return error if payload is not valid", async () => {
        const server = await initServer(app, defaults, customRoute);

        injectOptions.payload.test = ["Item1", "Item2"];

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(422);
    });

    it("should return error if query is not valid", async () => {
        const server = await initServer(app, defaults, customRoute);

        injectOptions.url = "/test";

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(422);
    });
});
