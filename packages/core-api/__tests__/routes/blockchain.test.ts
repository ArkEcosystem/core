import { Container } from "@arkecosystem/core-kernel";
import { BlockchainController } from "@packages/core-api/src/controllers/blockchain";
import { register } from "@packages/core-api/src/routes/blockchain";
import { Server } from "@packages/core-api/src/server";

import { initApp, initServer } from "../__support__";
import { serverDefaults } from "./__fixtures__";

Container.decorate(Container.injectable(), BlockchainController);
jest.mock("@packages/core-api/src/controllers/blockchain");

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
            const spyOnMethod = jest.spyOn(BlockchainController.prototype, "index").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/blockchain",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
