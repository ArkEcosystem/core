import { Container } from "@arkecosystem/core-kernel";
import { RoundsController } from "@packages/core-api/src/controllers/rounds";
import { register } from "@packages/core-api/src/routes/rounds";
import { Server } from "@packages/core-api/src/server";

import { initApp, initServer } from "../__support__";
import { serverDefaults } from "./__fixtures__";

Container.decorate(Container.injectable(), RoundsController);
jest.mock("@packages/core-api/src/controllers/rounds");

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

describe("Rounds", () => {
    describe("Delegates", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(RoundsController.prototype, "delegates").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/rounds/2/delegates",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
