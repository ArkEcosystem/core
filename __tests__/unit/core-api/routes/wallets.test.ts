import { Container } from "@arkecosystem/core-kernel";
import { WalletsController } from "@packages/core-api/src/controllers/wallets";
import { register } from "@packages/core-api/src/routes/wallets";
import { Server } from "@packages/core-api/src/server";

import { initApp, initServer } from "../__support__";
import { paginatedResult, serverDefaults } from "./__fixtures__";

Container.decorate(Container.injectable(), WalletsController);
jest.mock("@packages/core-api/src/controllers/wallets");

let app;
let server: Server;

beforeAll(async () => {
    app = initApp();
    server = await initServer(app, serverDefaults);
    // @ts-ignore
    register(server.server);
});

afterAll(async () => {
    await server.dispose();
});

describe("Blockchain", () => {
    describe("Index", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(WalletsController.prototype, "index").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/wallets",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Top", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(WalletsController.prototype, "top").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/wallets/top",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Show", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(WalletsController.prototype, "show").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/wallets/027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Locks", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(WalletsController.prototype, "locks").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/wallets/027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582/locks",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Transactions", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(WalletsController.prototype, "transactions").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/wallets/027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582/transactions",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Transactions Sent", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(WalletsController.prototype, "transactionsSent").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/wallets/027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582/transactions/sent",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Transactions Received", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(WalletsController.prototype, "transactionsReceived").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/wallets/027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582/transactions/received",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Votes", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(WalletsController.prototype, "votes").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/wallets/027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582/votes",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
