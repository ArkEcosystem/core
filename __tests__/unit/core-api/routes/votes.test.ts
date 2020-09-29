import { Container } from "@arkecosystem/core-kernel";
import { VotesController } from "@packages/core-api/src/controllers/votes";
import { register } from "@packages/core-api/src/routes/votes";
import { Server } from "@packages/core-api/src/server";

import { initApp, initServer } from "../__support__";
import { paginatedResult, serverDefaults } from "./__fixtures__";

Container.decorate(Container.injectable(), VotesController);
jest.mock("@packages/core-api/src/controllers/votes");

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
            const spyOnMethod = jest.spyOn(VotesController.prototype, "index").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/votes",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Show", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(VotesController.prototype, "show").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/votes/39751df982e597556a5ca2cd9bcfe5aa07fac5bf55913fed0195e7661d04220d",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
