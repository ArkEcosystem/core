import { Container } from "@arkecosystem/core-kernel";
import { DelegatesController } from "@packages/core-api/src/controllers/delegates";
import { register } from "@packages/core-api/src/routes/delegates";
import { Server } from "@packages/core-api/src/server";

import { initApp, initServer } from "../__support__";
import { serverDefaults, paginatedResult } from "./__fixtures__";

Container.decorate(Container.injectable(), DelegatesController);
jest.mock("@packages/core-api/src/controllers/delegates");

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

describe("Delegates", () => {
    describe("Index", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(DelegatesController.prototype, "index").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/delegates",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Show", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(DelegatesController.prototype, "show").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/delegates/027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Voters", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(DelegatesController.prototype, "voters").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/delegates/027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582/voters",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Blocks", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(DelegatesController.prototype, "blocks").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/delegates/027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582/blocks",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
