import "jest-extended";

import { blockSortingSchema } from "@packages/core-api/src/resources-new";
import * as Schemas from "@packages/core-api/src/schemas.ts";
import { Application } from "@packages/core-kernel";
import Joi from "joi";

import { initApp, initServer } from "../__support__";

let app: Application;

beforeEach(() => {
    app = initApp();
});

describe("Semaphore", () => {
    let defaults: any;
    let customResponse: any;
    let customRoute: any;
    let injectOptions: any;

    let resolve: () => void;
    let promise: Promise<void>;

    beforeEach(() => {
        defaults = {
            plugins: {
                pagination: {
                    limit: 100,
                },
                socketTimeout: 5000,
                semaphore: {
                    enabled: true,
                    levelOne: {
                        concurrency: 2,
                        queueLimit: 0,
                    },
                    levelTwo: {
                        concurrency: 1,
                        queueLimit: 0,
                    },
                },
            },
        };

        customResponse = {
            results: [],
            totalCount: 0,
            meta: { totalCountIsEstimate: false },
        };

        promise = new Promise<void>((res) => {
            resolve = res;
        });

        customRoute = {
            method: "GET",
            path: "/test",
            handler: jest.fn().mockImplementation(async () => {
                await promise;
                return customResponse;
            }),
            options: {
                validate: {
                    query: Joi.object({
                        ...Schemas.blockCriteriaSchemas,
                        orderBy: Schemas.blocksOrderBy,
                        transform: Joi.bool().default(true),
                    })
                        .concat(blockSortingSchema)
                        .concat(Schemas.pagination),
                },
                plugins: {
                    pagination: {
                        enabled: true,
                    },
                    semaphore: {
                        levelTwoFields: ["payloadLength", "payloadHash", "payloadSignature"],
                    },
                },
            },
        };

        injectOptions = {
            method: "GET",
            url: "/test",
        };
    });

    it("should not use semaphore if semaphore plugin is not on route", async () => {
        customRoute.options.plugins = {};

        const server = await initServer(app, defaults, customRoute);

        const responses: Promise<any>[] = [server.inject(injectOptions), server.inject(injectOptions)];

        resolve();

        for (let i = 0; i < 2; i++) {
            expect((await responses[i]).statusCode).toBe(200);
        }
        expect(customRoute.handler).toHaveBeenCalledTimes(2);
    });

    it("should not use semaphore if levelTwoFields fields are not in semaphore options", async () => {
        customRoute.options.plugins.semaphore = {};

        const server = await initServer(app, defaults, customRoute);

        const responses: Promise<any>[] = [server.inject(injectOptions), server.inject(injectOptions)];

        resolve();

        for (let i = 0; i < 2; i++) {
            expect((await responses[i]).statusCode).toBe(200);
        }
        expect(customRoute.handler).toHaveBeenCalledTimes(2);
    });

    it("should use level 1 semaphore by default", async () => {
        const server = await initServer(app, defaults, customRoute);

        const responses: Promise<any>[] = [
            server.inject(injectOptions),
            server.inject(injectOptions),
            server.inject(injectOptions),
        ];

        resolve();

        for (let i = 0; i < 2; i++) {
            expect((await responses[i]).statusCode).toBe(200);
        }
        expect((await responses[2]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(2);
    });

    it("should use level 1 semaphore when level two field is not used in order by", async () => {
        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            method: "GET",
            url: "/test?orderBy=version:asc",
        };
        const responses: Promise<any>[] = [
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
        ];

        resolve();

        for (let i = 0; i < 2; i++) {
            expect((await responses[i]).statusCode).toBe(200);
        }
        expect((await responses[2]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(2);
    });

    it("should use level 2 semaphore when level two field is used in order by", async () => {
        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            method: "GET",
            url: "/test?orderBy=payloadHash:asc",
        };

        const responses: Promise<any>[] = [server.inject(customInjectOptions), server.inject(customInjectOptions)];

        resolve();

        expect((await responses[0]).statusCode).toBe(200);
        expect((await responses[1]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(1);
    });

    // TODO: Second order by

    it("should use level 1 semaphore when level two field is not used in query", async () => {
        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            method: "GET",
            url: "/test?version=1",
        };

        const responses: Promise<any>[] = [
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
        ];

        resolve();

        for (let i = 0; i < 2; i++) {
            expect((await responses[i]).statusCode).toBe(200);
        }
        expect((await responses[2]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(2);
    });

    it("should use level 2 semaphore when level two field is used in query", async () => {
        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            method: "GET",
            url: "/test?payloadHash=1",
        };

        const responses: Promise<any>[] = [server.inject(customInjectOptions), server.inject(customInjectOptions)];

        resolve();

        expect((await responses[0]).statusCode).toBe(200);
        expect((await responses[1]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(1);
    });

    it("should use level 1 semaphore when offset is < 10_000", async () => {
        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            method: "GET",
            url: "/test?limit=100&page=99", // 9_900
        };

        const responses: Promise<any>[] = [
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
        ];

        resolve();

        for (let i = 0; i < 2; i++) {
            expect((await responses[i]).statusCode).toBe(200);
        }
        expect((await responses[2]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(2);
    });

    it("should use level 2 semaphore when offset is > 10_000", async () => {
        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            method: "GET",
            url: "/test?limit=100&page=101", // 10_100
        };

        const responses: Promise<any>[] = [server.inject(customInjectOptions), server.inject(customInjectOptions)];

        resolve();

        expect((await responses[0]).statusCode).toBe(200);
        expect((await responses[1]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(1);
    });

    it("should should respond with 429 when queue is full", async () => {
        const server = await initServer(
            app,
            (defaults = {
                plugins: {
                    pagination: {
                        limit: 100,
                    },
                    socketTimeout: 5000,
                    semaphore: {
                        enabled: true,
                        levelOne: {
                            concurrency: 2,
                            queueLimit: 2,
                        },
                        levelTwo: {
                            concurrency: 1,
                            queueLimit: 0,
                        },
                    },
                },
            }),
            customRoute,
        );

        const customInjectOptions = {
            method: "GET",
            url: "/test",
        };

        const responses: Promise<any>[] = [
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
        ];

        resolve();

        // 2 x concurrent + 2x queue
        for (let i = 0; i < 4; i++) {
            expect((await responses[i]).statusCode).toBe(200);
        }
        expect((await responses[4]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(2);
    });
});
