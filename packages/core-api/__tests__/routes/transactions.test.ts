import { Container } from "@arkecosystem/core-kernel";
import { TransactionsController } from "@packages/core-api/src/controllers/transactions";
import { register } from "@packages/core-api/src/routes/transactions";
import { Server } from "@packages/core-api/src/server";
import { Managers } from "@packages/crypto";

import { initApp, initServer } from "../__support__";
import { paginatedResult, serverDefaults } from "./__fixtures__";

Container.decorate(Container.injectable(), TransactionsController);
jest.mock("@packages/core-api/src/controllers/transactions");

let app;
let server: Server;

beforeAll(async () => {
    Managers.configManager.setFromPreset("testnet");

    app = initApp();
    server = await initServer(app, serverDefaults);
    // @ts-ignore
    register(server.server);
});

afterAll(async () => {
    await server.dispose();
});

describe("Transactions", () => {
    describe("Index", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest
                .spyOn(TransactionsController.prototype, "index")
                .mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/transactions",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Store", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(TransactionsController.prototype, "store").mockResolvedValue({});

            const injectOptions = {
                method: "POST",
                url: "/transactions",
                payload: {
                    transactions: [
                        {
                            version: 1,
                            network: 23,
                            type: 0,
                            timestamp: 110695900,
                            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                            fee: "10000000",
                            amount: "1",
                            vendorField: "0.976265670159258",
                            expiration: 0,
                            recipientId: "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
                            signature:
                                "304502210091f1c4e069fcc6db9ccc2d6be83941bd5f53c9b1a7a0cb6b66a638a82f3a289e02202edbb580d4f7c269fe451ef3e0039f0dcde5e91477956fabacf7da5e1a443d8b",
                            id: "93242680c57bd298ae1a149072f101eccf87515e1d5d5a30132dd2eee44d73ca",
                        },
                    ],
                },
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Show", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(TransactionsController.prototype, "show").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/transactions/39751df982e597556a5ca2cd9bcfe5aa07fac5bf55913fed0195e7661d04220d",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Unconfirmed", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest
                .spyOn(TransactionsController.prototype, "unconfirmed")
                .mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/transactions/unconfirmed",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Show Unconfirmed", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(TransactionsController.prototype, "showUnconfirmed").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/transactions/unconfirmed/39751df982e597556a5ca2cd9bcfe5aa07fac5bf55913fed0195e7661d04220d",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Types", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(TransactionsController.prototype, "types").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/transactions/types",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Schemas", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(TransactionsController.prototype, "schemas").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/transactions/schemas",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Fees", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(TransactionsController.prototype, "fees").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/transactions/fees",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
