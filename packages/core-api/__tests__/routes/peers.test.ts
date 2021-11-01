import { Container } from "@arkecosystem/core-kernel";
import { PeersController } from "@packages/core-api/src/controllers/peers";
import { register } from "@packages/core-api/src/routes/peers";
import { Server } from "@packages/core-api/src/server";

import { initApp, initServer } from "../__support__";
import { paginatedResult, serverDefaults } from "./__fixtures__";

Container.decorate(Container.injectable(), PeersController);
jest.mock("@packages/core-api/src/controllers/peers");

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
            const spyOnMethod = jest.spyOn(PeersController.prototype, "index").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/peers",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Show", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(PeersController.prototype, "show").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/peers/127.0.0.1",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
