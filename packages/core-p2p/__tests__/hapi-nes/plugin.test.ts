import "jest-extended";

import * as Hapi from "@hapi/hapi";
import * as Teamwork from "@hapi/teamwork";
import { Client, plugin } from "@packages/core-p2p/src/hapi-nes";

describe("register()", () => {
    it("adds websocket support", async () => {
        const server = Hapi.server();
        await server.register({ plugin });

        const bufHello = Buffer.from("hello");
        server.route({
            method: "POST",
            path: "/",
            handler: () => bufHello,
        });

        await server.start();
        const client = new Client("http://localhost:" + server.info.port);
        await client.connect();

        // @ts-ignore
        const { payload, statusCode } = await client.request("/");
        expect(payload).toEqual(bufHello);
        expect(statusCode).toEqual(200);

        await client.disconnect();
        await server.stop();
    });

    it("calls onConnection callback", async () => {
        const server = Hapi.server();
        const team = new Teamwork.Team();
        const onConnection = (ws) => {
            expect(ws).toBeDefined();
            client.disconnect();
            team.attend();
        };

        await server.register({ plugin: plugin, options: { onConnection } });

        server.route({
            method: "POST",
            path: "/",
            handler: () => "hello",
        });

        await server.start();
        const client = new Client("http://localhost:" + server.info.port);
        await client.connect();
        await team.work;
        await server.stop();
    });

    it("calls onDisconnection callback", async () => {
        const server = Hapi.server();
        const team = new Teamwork.Team();
        const onDisconnection = (ws) => {
            expect(ws).toBeDefined();
            client.disconnect();
            team.attend();
        };

        await server.register({ plugin: plugin, options: { onDisconnection } });

        server.route({
            method: "POST",
            path: "/",
            handler: () => "hello",
        });

        await server.start();
        const client = new Client("http://localhost:" + server.info.port);
        await client.connect();
        await client.disconnect();
        await team.work;
        await server.stop();
    });
});
