import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Server } from "@packages/core-webhooks/src/server";
import { setGracefulCleanup } from "tmp";
import { initApp, initServer, request } from "../__support__";

let app: Application;
let server: Server;
let serverOptions: any;

beforeEach(async () => {
    app = initApp();

    serverOptions = {
        host: "0.0.0.0",
        port: 4004,
        whitelist: ["127.0.0.1"],
    };
});

afterEach(async () => server.dispose());

afterAll(() => setGracefulCleanup());

describe("Whitelist", () => {
    it("should GET all the webhooks if whitelisted", async () => {
        server = await initServer(app, serverOptions);

        const response = await request(server, "GET", "webhooks");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should GET error if not whitelisted", async () => {
        serverOptions.whitelist = ["128.0.0.1"];
        server = await initServer(app, serverOptions);

        const response = await request(server, "GET", "webhooks");

        expect(response.status).toBe(403);
    });
});
