import { Container } from "@arkecosystem/core-kernel";
import { LocksController } from "@packages/core-api/src/controllers/locks";
import { register } from "@packages/core-api/src/routes/locks";
import { Server } from "@packages/core-api/src/server";

import { initApp, initServer } from "../__support__";
import { paginatedResult, serverDefaults } from "./__fixtures__";

Container.decorate(Container.injectable(), LocksController);
jest.mock("@packages/core-api/src/controllers/locks");

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

describe("Locks", () => {
    describe("Index", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(LocksController.prototype, "index").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "GET",
                url: "/locks",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Show", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(LocksController.prototype, "show").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/locks/bc3ee5fe72cb4c73521aef576d6d53ba3323dd9cb652f33bf613d22e7f7185a8",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Unlocked", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(LocksController.prototype, "unlocked").mockResolvedValue(paginatedResult);

            const injectOptions = {
                method: "POST",
                url: "/locks/unlocked",
                payload: { ids: ["bc3ee5fe72cb4c73521aef576d6d53ba3323dd9cb652f33bf613d22e7f7185a8"] },
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
