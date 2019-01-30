import "../__support__/mocks/core-kernel";

import axios from "axios";
import { contentType } from "../../src/plugins/content-type";
import { createServer } from "../../src/server/create";
import { mountServer } from "../../src/server/mount";

let server;
beforeAll(async () => {
    server = await createServer({
        host: "0.0.0.0",
        port: 3000,
    });

    await server.register({ plugin: contentType });

    server.route({
        method: "GET",
        path: "/",
        handler: (request, h) => "Hello!",
    });

    await mountServer("Dummy", server);
});

afterAll(async () => {
    await server.stop();
});

describe("Plugins - Content-Type", () => {
    describe("GET /", () => {
        it("should return code 200", async () => {
            const response = await axios.get("http://0.0.0.0:3000/", {
                headers: { "Content-Type": "application/json" },
            });

            expect(response.status).toBe(200);
        });

        it("should return code 415", async () => {
            try {
                await axios.get("http://0.0.0.0:3000/", {
                    headers: { "Content-Type": "application/text" },
                });
            } catch (e) {
                expect(e.response.status).toBe(415);
            }
        });
    });
});
