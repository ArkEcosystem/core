import { Container } from "@arkecosystem/core-kernel";
import { NodeController } from "@packages/core-api/src/controllers/node";
import { register } from "@packages/core-api/src/routes/node";
import { Server } from "@packages/core-api/src/server";

import { initApp, initServer } from "../__support__";
import { serverDefaults } from "./__fixtures__";

Container.decorate(Container.injectable(), NodeController);
jest.mock("@packages/core-api/src/controllers/node");

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
    describe("Status", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(NodeController.prototype, "status").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/node/status",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Syncing", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(NodeController.prototype, "syncing").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/node/syncing",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Configuration", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(NodeController.prototype, "configuration").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/node/configuration",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Configuration Crypto", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(NodeController.prototype, "configurationCrypto").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/node/configuration/crypto",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });

    describe("Fees", () => {
        it("should be called", async () => {
            // @ts-ignore
            const spyOnMethod = jest.spyOn(NodeController.prototype, "fees").mockResolvedValue({});

            const injectOptions = {
                method: "GET",
                url: "/node/fees",
            };

            const result = await server.inject(injectOptions);

            expect(result.statusCode).toEqual(200);
            expect(spyOnMethod).toHaveBeenCalled();
        });
    });
});
