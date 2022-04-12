import "jest-extended";

import Joi from "joi";
import { Controller } from "@packages/core-api/src/controllers/controller";
import { Resource } from "@packages/core-api/src/interfaces";
import { Application, Container } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Transactions } from "@packages/crypto";

import { initApp } from "../__support__";

@Container.injectable()
class Transformer implements Resource {
    public raw(resource): object {
        return resource;
    }
    public transform(resource): object {
        return resource;
    }
}

let app: Application;
let controller: Controller;

beforeEach(() => {
    app = initApp();
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(null);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<Controller>(Controller);
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BridgechainRegistrationTransaction,
        );
    } catch {}
});

describe("Controller", () => {
    describe("getQueryPagination", () => {
        // TODO: What if limit is missing
        // TODO: getQueryPagination and getListingPage are duplicates
        it("should return pagination if limit is defined", async () => {
            const query = {
                limit: 10,
            };

            // @ts-ignore
            expect(controller.getQueryPagination(query)).toEqual({
                offset: 0,
                limit: 10,
            });
        });

        it("should return pagination if limit and page are defined", async () => {
            const query = {
                page: 2,
                limit: 10,
            };

            // @ts-ignore
            expect(controller.getQueryPagination(query)).toEqual({
                offset: 10,
                limit: 10,
            });
        });

        it("should return pagination if limit and offset are defined", async () => {
            const query = {
                offset: 15,
                limit: 10,
            };

            // @ts-ignore
            expect(controller.getQueryPagination(query)).toEqual({
                offset: 15,
                limit: 10,
            });
        });
    });

    describe("getQueryCriteria", () => {
        it("should return criteria", async () => {
            const schemaObject = {
                username: Joi.string(),
            };

            const query = {
                limit: 10,
                username: "Alice",
                excludedField: "Bob",
            };

            // @ts-ignore
            expect(controller.getQueryCriteria(query, schemaObject)).toEqual({
                username: "Alice",
            });
        });
    });

    describe("getListingPage", () => {
        it("should return pagination if query is empty", async () => {
            const request = {
                query: {},
            };

            // @ts-ignore
            expect(controller.getListingPage(request)).toEqual({
                offset: 0,
                limit: 100,
            });
        });

        it("should return pagination if limit is defined", async () => {
            const request = {
                query: {
                    limit: 20,
                },
            };

            // @ts-ignore
            expect(controller.getListingPage(request)).toEqual({
                offset: 0,
                limit: 20,
            });
        });

        it("should return pagination if limit and page are defined", async () => {
            const request = {
                query: {
                    page: 2,
                    limit: 20,
                },
            };

            // @ts-ignore
            expect(controller.getListingPage(request)).toEqual({
                offset: 20,
                limit: 20,
            });
        });

        it("should return pagination if offset is defined", async () => {
            const request = {
                query: {
                    offset: 15,
                },
            };

            // @ts-ignore
            expect(controller.getListingPage(request)).toEqual({
                offset: 15,
                limit: 100,
            });
        });
    });

    describe("getListingOrder", () => {
        it("should parse order", async () => {
            const request = {
                query: {
                    orderBy: "test:desc,test2:asc",
                },
            };

            // @ts-ignore
            expect(controller.getListingOrder(request)).toEqual([
                { direction: "desc", property: "test" },
                { direction: "asc", property: "test2" },
            ]);
        });

        it("should return empty array if orderBy is not present", async () => {
            const request = {
                query: {},
            };

            // @ts-ignore
            expect(controller.getListingOrder(request)).toEqual([]);
        });
    });

    describe("getListingOptions", () => {
        it("should return listing options", async () => {
            // @ts-ignore
            expect(controller.getListingOptions()).toEqual({
                estimateTotalCount: expect.toBeBoolean(),
            });
        });
    });

    describe("respondWithResource", () => {
        it("should respond with resource", () => {
            const data = { test: "test" };

            // @ts-ignore
            expect(controller.respondWithResource(data, Transformer)).toEqual({
                data,
            });
        });

        it("should return error if data is undefined", async () => {
            // @ts-ignore
            expect(controller.respondWithResource(undefined, Transformer)).toBeInstanceOf(Error);
        });
    });

    describe("respondWithCollection", () => {
        it("should respond with collection", () => {
            const data = [{ test: "test" }];

            // @ts-ignore
            expect(controller.respondWithCollection(data, Transformer)).toEqual({
                data,
            });
        });
    });

    describe("toResource", () => {
        it("should return raw item", () => {
            const spyOnRaw = jest.spyOn(Transformer.prototype, "raw");

            const data = { test: "test" };
            // @ts-ignore
            expect(controller.toResource(data, Transformer, false)).toEqual(data);

            expect(spyOnRaw).toHaveBeenCalled();
        });

        it("should return transformed item", () => {
            const spyOnRaw = jest.spyOn(Transformer.prototype, "transform");

            const data = { test: "test" };
            // @ts-ignore
            expect(controller.toResource(data, Transformer)).toEqual(data);

            expect(spyOnRaw).toHaveBeenCalled();
        });
    });

    describe("toCollection", () => {
        it("should return raw item", () => {
            const spyOnRaw = jest.spyOn(Transformer.prototype, "raw");

            const data = [{ test: "test" }];
            // @ts-ignore
            expect(controller.toCollection(data, Transformer, false)).toEqual(data);

            expect(spyOnRaw).toHaveBeenCalled();
        });

        it("should return transformed item", () => {
            const spyOnRaw = jest.spyOn(Transformer.prototype, "transform");

            const data = [{ test: "test" }];
            // @ts-ignore
            expect(controller.toCollection(data, Transformer)).toEqual(data);

            expect(spyOnRaw).toHaveBeenCalled();
        });
    });

    describe("toPagination", () => {
        it("should return result page", () => {
            const spyOnRaw = jest.spyOn(Transformer.prototype, "transform");

            const data = [{ test: "test" }];

            const resultsPage = {
                results: data,
                totalCount: 1,
                meta: {
                    totalCountIsEstimate: true,
                },
            };

            // @ts-ignore
            expect(controller.toPagination(resultsPage, Transformer)).toEqual(resultsPage);
            expect(spyOnRaw).toHaveBeenCalled();
        });
    });
});
