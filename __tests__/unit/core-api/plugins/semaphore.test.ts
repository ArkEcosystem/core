import "jest-extended";

import { blockQueryLevelOptions, blockSortingSchema } from "@packages/core-api/src/resources-new";
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
                    database: {
                        levelOne: {
                            concurrency: 2,
                            queueLimit: 0,
                            maxOffset: 10_000,
                        },
                        levelTwo: {
                            concurrency: 1,
                            queueLimit: 0,
                        },
                    },
                    memory: {
                        levelOne: {
                            concurrency: 2,
                            queueLimit: 0,
                            maxOffset: 100,
                        },
                        levelTwo: {
                            concurrency: 3,
                            queueLimit: 0,
                        },
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
                        enabled: true,
                        queryLevelOptions: blockQueryLevelOptions,
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

    it("should not use semaphore if not enabled", async () => {
        customRoute.options.plugins.semaphore = {
            ...customRoute.options.plugins.semaphore,
            enabled: false,
        };

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

    const levelOneQueries = [
        "/test", // Default
        "/test?timestamp=1", // Indexed field value
        "/test?timestamp.from=1", // Indexed field from
        "/test?timestamp.to=1", // Indexed field to
        "/test?version=0", // Indexed field value
        "/test?version=0,1,2", // Indexed field from
        "/test?orderBy=version:asc", // Indexed field asc = true
        "/test?orderBy=version:desc", // Indexed field desc = true
        "/test?orderBy=timestamp:asc,version:asc", // allowSecondOrderBy = true
        "/test?orderBy=payloadHash:asc&height=2", // Uses diverse index direct value
    ];

    const levelTwoOffsetQueries = [
        "/test?page=101&limit=100", // Offset is > 10_000
        "/test?offset=10001", // Offset is > 10_000
    ];

    const levelTwoQueries = [
        "/test?payloadLength=1", // Non indexed field value
        "/test?payloadLength.from=1", // Non indexed field from
        "/test?payloadLength.to=1", // Non indexed field to
        "/test?payloadHash=abc", // Non indexed field to
        "/test?payloadHash=abc,def", // Non indexed field to
        "/test?orderBy=id:asc", // Indexed field asc = false
        "/test?orderBy=id:desc", // Indexed field desc = false
        "/test?orderBy=payloadHash:asc", // Non indexed field orderBy asc
        "/test?orderBy=payloadHash:desc", // Non indexed field orderBy desc,
        "/test?orderBy=version:asc,timestamp:asc", // allowSecondOrderBy = false
        "/test?orderBy=payloadHash:asc&height.from=2", // Uses diverse index indirect value
        "/test?orderBy=payloadHash:asc&version=0", // Uses non-diverse index
    ];

    it.each(levelOneQueries)("should use level 1 semaphore", async (url) => {
        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            ...injectOptions,
            url: url,
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

    it.each([...levelTwoOffsetQueries, ...levelTwoQueries])("should use level 2 semaphore", async (url) => {
        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            ...injectOptions,
            url: url,
        };

        const responses: Promise<any>[] = [server.inject(customInjectOptions), server.inject(customInjectOptions)];

        resolve();

        expect((await responses[0]).statusCode).toBe(200);
        expect((await responses[1]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(1);
    });

    // Skip offsets
    it.each(levelTwoQueries)("should use level 1 semaphore when queryLevelSchema is not defined", async (url) => {
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
                        enabled: true,
                    },
                },
            },
        };

        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            ...injectOptions,
            url: url,
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

    it("should use memory semaphore when type = memory", async () => {
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
                        enabled: true,
                        type: "memory",
                    },
                },
            },
        };

        const server = await initServer(app, defaults, customRoute);

        const customInjectOptions = {
            ...injectOptions,
            url: "/test?page=10&limit=11", // Offset is > 100,
        };

        const responses: Promise<any>[] = [
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
            server.inject(customInjectOptions),
        ];

        resolve();

        expect((await responses[0]).statusCode).toBe(200);
        expect((await responses[1]).statusCode).toBe(200);
        expect((await responses[2]).statusCode).toBe(200);
        expect((await responses[3]).statusCode).toBe(429);
        expect(customRoute.handler).toHaveBeenCalledTimes(3);
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
                        database: {
                            levelOne: {
                                concurrency: 2,
                                queueLimit: 2,
                                maxOffset: 10_000,
                            },
                            levelTwo: {
                                concurrency: 1,
                                queueLimit: 0,
                            },
                        },
                        memory: {
                            levelOne: {
                                concurrency: 2,
                                queueLimit: 2,
                                maxOffset: 100,
                            },
                            levelTwo: {
                                concurrency: 1,
                                queueLimit: 0,
                            },
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
