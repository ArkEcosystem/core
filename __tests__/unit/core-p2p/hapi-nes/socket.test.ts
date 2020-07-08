import "jest-extended";

import * as Hapi from "@hapi/hapi";
import * as Hoek from "@hapi/hoek";
import * as Teamwork from "@hapi/teamwork";
import { Client, plugin } from "@packages/core-p2p/src/hapi-nes";
import { default as Ws } from "ws";

describe("Socket", () => {
    it("exposes app namespace", async () => {
        const server = Hapi.server();

        const onConnection = (socket) => {
            socket.app.x = "hello";
        };

        await server.register({ plugin: plugin, options: { onConnection } });

        server.route({
            method: "GET",
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
        expect(payload).toEqual("hello");
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

    describe("send()", () => {
        it("sends custom message", async () => {
            const server = Hapi.server();
            const onConnection = (socket) => socket.send("goodbye");
            await server.register({ plugin: plugin, options: { onConnection } });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);

            const team = new Teamwork.Team();
            client.onUpdate = (message) => {
                expect(message).toEqual("goodbye");
                team.attend();
            };

            await client.connect();

            await team.work;
            await client.disconnect();
            await server.stop();
        });

        it("sends custom message (callback)", async () => {
            let sent = false;
            const onConnection = async (socket) => {
                await socket.send("goodbye");
                sent = true;
            };

            const server = Hapi.server();
            await server.register({ plugin: plugin, options: { onConnection } });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);

            const team = new Teamwork.Team();
            client.onUpdate = (message) => {
                expect(message).toEqual("goodbye");
                expect(sent).toBeTrue();
                team.attend();
            };

            await client.connect();

            await team.work;
            await client.disconnect();
            await server.stop();
        });
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

            const a = { id: 1, type: "other" };
            // @ts-ignore
            a.c = a; // Circular reference

            server.plugins.nes._listener._sockets._forEach((socket) => {
                socket._send(a, null, Hoek.ignore);
            });

            const [event] = await log;
            expect(event.data).toEqual("other");
            await client.disconnect();
            await server.stop();
        });

        it("reuses previously stringified value", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: (request, h) => {
                    return h.response(JSON.stringify({ a: 1, b: 2 })).type("application/json");
                },
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload, statusCode } = await client.request("/");
            expect(payload).toEqual({ a: 1, b: 2 });
            expect(statusCode).toEqual(200);

            await client.disconnect();
            await server.stop();
        });

        it("ignores previously stringified value when no content-type header", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: () => JSON.stringify({ a: 1, b: 2 }),
            });

            server.ext("onPreResponse", (request, h) => {
                request.response._contentType = null;
                return h.continue;
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload, statusCode } = await client.request("/");
            expect(payload).toEqual('{"a":1,"b":2}');
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

            server.route({
                method: "GET",
                path: "/",
                config: {
                    id: "resource",
                    handler: () => "hello",
                },
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload, statusCode } = await client.request("resource");
            expect(payload).toEqual("hello");
            expect(statusCode).toEqual(200);

            await client.disconnect();
            await server.stop();
        });

        it("errors on unknown route id", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
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

        it("errors on invalid request message", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = JSON.parse(data);
                expect(message.payload).toEqual({
                    error: "Bad Request",
                    message: "Cannot parse message",
                });

                expect(message.statusCode).toEqual(400);

                team.attend();
            });

            client.on("open", () => {
                client.send("{", (err) => {
                    expect(err).toBeUndefined();
                });
            });

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on missing id", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = JSON.parse(data);
                expect(message.payload).toEqual({
                    error: "Bad Request",
                    message: "Message missing id",
                });

                expect(message.statusCode).toEqual(400);
                expect(message.type).toEqual("request");

                team.attend();
            });

            client.on("open", () =>
                client.send(JSON.stringify({ type: "request", method: "GET", path: "/" }), Hoek.ignore),
            );

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on uninitialized connection", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = JSON.parse(data);
                expect(message.payload.message).toEqual("Connection is not initialized");

                team.attend();
            });

            client.on("open", () => client.send(JSON.stringify({ id: 1, type: "request", path: "/" }), Hoek.ignore));

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on missing method", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = JSON.parse(data);
                if (message.id !== 2) {
                    client.send(JSON.stringify({ id: 2, type: "request", path: "/" }), Hoek.ignore);
                    return;
                }

                expect(message.payload).toEqual({
                    error: "Bad Request",
                    message: "Message missing method",
                });

                expect(message.statusCode).toEqual(400);
                expect(message.type).toEqual("request");

                team.attend();
            });

            client.on("open", () => client.send(JSON.stringify({ id: 1, type: "hello", version: "2" }), Hoek.ignore));

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on missing path", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = JSON.parse(data);
                if (message.id !== 2) {
                    client.send(JSON.stringify({ id: 2, type: "request", method: "GET" }), Hoek.ignore);
                    return;
                }

                expect(message.payload).toEqual({
                    error: "Bad Request",
                    message: "Message missing path",
                });

                expect(message.statusCode).toEqual(400);
                expect(message.type).toEqual("request");

                team.attend();
            });

            client.on("open", () => client.send(JSON.stringify({ id: 1, type: "hello", version: "2" }), Hoek.ignore));

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on unknown type", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = JSON.parse(data);
                if (message.id !== 2) {
                    client.send(JSON.stringify({ id: 2, type: "unknown" }), Hoek.ignore);
                    return;
                }

                expect(message.payload).toEqual({
                    error: "Bad Request",
                    message: "Unknown message type",
                });

                expect(message.statusCode).toEqual(400);
                expect(message.type).toEqual("unknown");

                team.attend();
            });

            client.on("open", () => client.send(JSON.stringify({ id: 1, type: "hello", version: "2" }), Hoek.ignore));

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
                const message = JSON.parse(data);
                expect(message.payload).toEqual({
                    error: "Bad Request",
                    message: "Incorrect protocol version (expected 2 but received 1)",
                });

                expect(message.statusCode).toEqual(400);

                team.attend();
            });

            client.on("open", () => client.send(JSON.stringify({ id: 1, type: "hello", version: "1" }), Hoek.ignore));

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
                const message = JSON.parse(data);
                expect(message.payload).toEqual({
                    error: "Bad Request",
                    message: "Incorrect protocol version (expected 2 but received none)",
                });

                expect(message.statusCode).toEqual(400);

                team.attend();
            });

            client.on("open", () => client.send(JSON.stringify({ id: 1, type: "hello" }), Hoek.ignore));

            await team.work;
            client.close();
            await server.stop();
        });

        it("errors on missing type", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Ws("http://localhost:" + server.info.port);
            client.onerror = Hoek.ignore;

            const team = new Teamwork.Team();
            client.on("message", (data) => {
                const message = JSON.parse(data);
                expect(message.payload).toEqual({
                    error: "Bad Request",
                    message: "Cannot parse message",
                });

                expect(message.statusCode).toEqual(400);
                team.attend();
            });

            client.on("open", () => client.send(JSON.stringify({ id: 1 }), Hoek.ignore));

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
                method: "GET",
                path: "/",
                handler: (request) => request.socket.id,
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload } = await client.request("/");
            expect(payload).toEqual(client.id);

            await client.disconnect();
            await server.stop();
        });

        it("passed headers", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: { headers: "*" } });

            server.route({
                method: "GET",
                path: "/",
                handler: (request) => "hello " + request.headers.a,
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload, statusCode, headers } = await client.request({ path: "/", headers: { a: "b" } });
            expect(payload).toEqual("hello b");
            expect(statusCode).toEqual(200);
            expect(headers["content-type"]).toEqual("text/html; charset=utf-8");

            await client.disconnect();
            await server.stop();
        });

        it("errors on authorization header", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            await expect(client.request({ path: "/", headers: { Authorization: "something" } })).rejects.toThrowError(
                "Cannot include an Authorization header",
            );

            await client.disconnect();
            await server.stop();
        });
    });
});
