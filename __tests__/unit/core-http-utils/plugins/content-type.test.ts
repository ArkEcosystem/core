import "../mocks/core-container";

import got from "got";
import { contentType } from "../../../../packages/core-http-utils/src/plugins/content-type";
import { createServer } from "../../../../packages/core-http-utils/src/server/create";
import { mountServer } from "../../../../packages/core-http-utils/src/server/mount";

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
        handler: () => "Hello!",
    });

    await mountServer("Dummy", server);
});

afterAll(async () => {
    await server.stop();
});

describe("Plugins - Content-Type", () => {
    describe("GET /", () => {
        it("should return code 200", async () => {
            const response = await got.get("http://0.0.0.0:3000/", {
                headers: { "Content-Type": "application/json" },
            });

            expect(response.statusCode).toBe(200);
        });

        it("should return code 415", async () => {
            try {
                await got.get("http://0.0.0.0:3000/", {
                    headers: { "Content-Type": "application/text" },
                });
            } catch (e) {
                expect(e.response.statusCode).toBe(415);
            }
        });
    });
});
