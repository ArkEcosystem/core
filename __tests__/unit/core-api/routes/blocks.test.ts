import { Container } from "@arkecosystem/core-kernel";
import { BlocksController } from "@packages/core-api/src/controllers/blocks";
import { register } from "@packages/core-api/src/routes/blocks";
import { Server } from "@packages/core-api/src/server";

import { initApp, initServer } from "../__support__";
import { paginatedResult, serverDefaults } from "./__fixtures__";

Container.decorate(Container.injectable(), BlocksController);
jest.mock("@packages/core-api/src/controllers/blocks");

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
            const spyOnMethod = jest.spyOn(BlocksController.prototype, "index").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/blocks",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("First", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(BlocksController.prototype, "first").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/blocks/first",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Last", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(BlocksController.prototype, "last").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/blocks/last",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Show", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(BlocksController.prototype, "show").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/blocks/6130173a45d10bf450ca64d210d7f910cb3f673ba582fa919eed7808e1c9eebe",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Transactions", () => {
        it("should be called", async () => {
            const spyOnMethod = jest
                .spyOn(BlocksController.prototype, "transactions")
                .mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/blocks/6130173a45d10bf450ca64d210d7f910cb3f673ba582fa919eed7808e1c9eebe/transactions",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
