import "jest-extended";

import * as Hapi from "@hapi/hapi";
import * as Hoek from "@hapi/hoek";
import * as Teamwork from "@hapi/teamwork";
import { Client, plugin } from "@packages/core-p2p/src/hapi-nes";
import { stringifyNesMessage, parseNesMessage } from "@packages/core-p2p/src/hapi-nes/utils";
import { default as Ws } from "ws";
import delay from "delay";

describe("Socket", () => {
    it("exposes app namespace", async () => {
        const server = Hapi.server();

        const bufHello = Buffer.from("hello");
        const onConnection = (socket) => {
            socket.app.x = bufHello;
        };

        await server.register({ plugin: plugin, options: { onConnection } });

        server.route({
            method: "POST",
            path: "/",
            handler: (request) => {
                expect(request.socket.server).toBeDefined();
                return request.socket.app.x;
            },
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

    it("includes socket info", async () => {
        const team = new Teamwork.Team();
        const server = Hapi.server();

        const onConnection = (socket) => {
            expect(socket.info.remoteAddress).toEqual("127.0.0.1");
            expect(socket.info.remotePort).toBeNumber();

            team.attend();
        };

        await server.register({ plugin: plugin, options: { onConnection } });

        await server.start();
        const client = new Client("http://localhost:" + server.info.port);
        await client.connect();

        await client.disconnect();
        await team.work;
        await server.stop();
    });

    describe("_send()", () => {
        it("errors on invalid message", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            const log = server.events.once("log");

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            client.onError = Hoek.ignore;
            await client.connect();

            const a = { payload: 11111111, type: "other" };

            server.plugins.nes._listener._sockets._forEach(async (socket) => {
                try { await socket._send(a, null, Hoek.ignore) } catch {};
            });

            const [event] = await log;
            expect(event.data).toEqual("other");
            await client.disconnect();
            await server.stop();
        });

        it("reuses previously stringified value", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            const bufResponse = Buffer.from(JSON.stringify({ a: 1, b: 2 }));
            server.route({
                method: "POST",
                path: "/",
                handler: (request, h) => {
                    return h.response(bufResponse);
                },
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload, statusCode } = await client.request("/");
            expect(payload).toEqual(bufResponse);
            expect(statusCode).toEqual(200);

            await client.disconnect();
            await server.stop();
        });
    });

    describe("_flush()", () => {
        it("errors on socket send error", async () => {
            const server = Hapi.server();

            const onConnection = (socket) => {
                socket._ws.send = (message, next) => next(new Error());
            };

            await server.register({ plugin: plugin, options: { payload: { maxChunkChars: 5 }, onConnection } });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            client.onError = Hoek.ignore;

            await expect(client.connect({ timeout: 100 })).rejects.toThrowError("Request failed - server disconnected");

            await client.disconnect();
            await server.stop();
        });
    });

    describe("_onMessage()", () => {
        it("supports route id", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            const bufHello = Buffer.from("hello");
            server.route({
                method: "POST",
                path: "/",
                config: {
                    id: "resource",
                    handler: () => bufHello,
                },
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload, statusCode } = await client.request("resource");
            expect(payload).toEqual(bufHello);
            expect(statusCode).toEqual(200);

            await client.disconnect();
            await server.stop();
        });

        it("errors on unknown route id", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "POST",
                path: "/",
                config: {
                    id: "resource",
                    handler: () => "hello",
                },
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            await expect(client.request("something")).toReject();

            await client.disconnect();
            await server.stop();
        });

        it("errors on wildcard method route id", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "*",
                path: "/",
                config: {
                    id: "resource",
                    handler: () => "hello",
                },
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            await expect(client.request("resource")).toReject();

            await client.disconnect();
            await server.stop();
        });

        it("terminates on invalid request message", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "POST",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const sendInvalid = async () => new Promise((resolve, reject) => {
                client.on("open", () => {
                    client.send("{", {} as any, () => resolve());
                });
            })

            await sendInvalid();
            await delay(1000);

            expect(client.readyState).toEqual(client.CLOSED);

            client.close();
            await server.stop();
        });

        it("errors on uninitialized connection", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "POST",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = parseNesMessage(data);
                expect(JSON.parse(message.payload.toString()).message).toEqual("Connection is not initialized");

                team.attend();
            });

            client.on("open", () => client.send(stringifyNesMessage({ id: 1, type: "request", path: "/" }), Hoek.ignore));

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on missing path", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "POST",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = parseNesMessage(data);
                if (message.id !== 2) {
                    client.send(stringifyNesMessage({ id: 2, type: "request" }), Hoek.ignore);
                    return;
                }

                expect(JSON.parse(message.payload.toString())).toEqual({
                    error: "Bad Request",
                    message: "Message missing path",
                });

                expect(message.statusCode).toEqual(400);
                expect(message.type).toEqual("request");

                team.attend();
            });

            client.on("open", () => client.send(stringifyNesMessage({ id: 1, type: "hello", version: "2" }), Hoek.ignore));

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on unknown type", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "POST",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = parseNesMessage(data);
                if (message.id !== 2) {
                    client.send(stringifyNesMessage({ id: 2, type: "unknown" }), Hoek.ignore);
                    return;
                }

                expect(JSON.parse(message.payload.toString())).toEqual({
                    error: "Bad Request",
                    message: "Unknown message type",
                });

                expect(message.statusCode).toEqual(400);
                expect(message.type).toEqual("undefined");

                team.attend();
            });

            client.on("open", () => client.send(stringifyNesMessage({ id: 1, type: "hello", version: "2" }), Hoek.ignore));

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on incorrect version", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = parseNesMessage(data);
                expect(JSON.parse(message.payload.toString())).toEqual({
                    error: "Bad Request",
                    message: "Incorrect protocol version (expected 2 but received 1)",
                });

                expect(message.statusCode).toEqual(400);

                team.attend();
            });

            client.on("open", () => client.send(stringifyNesMessage({ id: 1, type: "hello", version: "1" }), Hoek.ignore));

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on missing version", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = parseNesMessage(data);
                expect(JSON.parse(message.payload.toString())).toEqual({
                    error: "Bad Request",
                    message: "Incorrect protocol version (expected 2 but received 0)",
                });

                expect(message.statusCode).toEqual(400);

                team.attend();
            });

            client.on("open", () => client.send(stringifyNesMessage({ id: 1, type: "hello" }), Hoek.ignore));

            await team.work;
            client.close();
            await server.stop();
        });
    });

    describe("_processRequest()", () => {
        it("exposes socket to request", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "POST",
                path: "/",
                handler: (request) => request.socket.id,
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload } = await client.request("/");
            expect(payload).toEqual(Buffer.from(client.id));

            await client.disconnect();
            await server.stop();
        });
    });
});
