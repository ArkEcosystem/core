import "jest-extended";

import * as Hapi from "@hapi/hapi";
import * as Hoek from "@hapi/hoek";
import * as Teamwork from "@hapi/teamwork";
import { Client, plugin } from "@packages/core-p2p/src/hapi-nes";

describe.skip("Client", () => {
    it("defaults options.ws.maxPayload to zero (node)", () => {
        const client = new Client("http://localhost");
        // @ts-ignore
        expect(client._settings.ws).toEqual({ maxPayload: 0 });
    });

    it("allows setting options.ws.maxPayload (node)", () => {
        const client = new Client("http://localhost", { ws: { maxPayload: 100 } });
        // @ts-ignore
        expect(client._settings.ws).toEqual({ maxPayload: 100 });
    });

    describe("onError", () => {
        it("logs error to console by default", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });
            await server.start();

            const client = new Client("http://localhost:" + server.info.port);

            const team = new Teamwork.Team();
            const orig = console.error;
            console.error = (err) => {
                expect(err).toBeDefined();
                console.error = orig;
                client.disconnect();
                team.attend();
            };

            await client.connect({ reconnect: false });
            // @ts-ignore
            client._ws.emit("error", new Error("test"));
            await team.work;
        });
    });

    describe("connect()", () => {
        it("reconnects when server initially down", async () => {
            const server1 = Hapi.server();
            await server1.register({ plugin: plugin, options: {} });
            await server1.start();
            const port = server1.info.port;
            await server1.stop();

            const client = new Client("http://localhost:" + port);
            client.onError = Hoek.ignore;

            const team = new Teamwork.Team({ meetings: 2 });

            client.onConnect = () => {
                team.attend();
            };

            let reconnecting = false;
            client.onDisconnect = (willReconnect, log) => {
                reconnecting = willReconnect;
                team.attend();
            };

            await expect(client.connect({ delay: 10 })).rejects.toThrowError(
                "Connection terminated while waiting to connect",
            );

            const server2 = Hapi.server({ port });
            server2.route({ path: "/", method: "GET", handler: () => "ok" });
            await server2.register({ plugin: plugin, options: {} });
            await server2.start();

            await team.work;

            expect(reconnecting).toBeTrue();

            const res = await client.request("/");
            // @ts-ignore
            expect(res.payload).toEqual("ok");

            client.disconnect();
            await server2.stop();
        });

        it("fails to connect", async () => {
            const client = new Client("http://0");

            await expect(client.connect()).rejects.toThrowError("Connection terminated while waiting to connect");
            await client.disconnect();
        });

        it("errors if already connected", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });
            await server.start();

            const client = new Client("http://localhost:" + server.info.port);

            await client.connect({ reconnect: false });
            await expect(client.connect()).rejects.toThrowError("Already connected");
            await client.disconnect();
            await server.stop();
        });

        it("errors if set to reconnect", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });
            await server.start();

            const client = new Client("http://localhost:" + server.info.port);

            await client.connect();
            await expect(client.connect()).rejects.toThrowError("Cannot connect while client attempts to reconnect");
            await client.disconnect();
            await server.stop();
        });
    });

    describe("_connect()", () => {
        it("handles unknown error code", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });
            await server.start();

            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            const team = new Teamwork.Team();
            client.onError = Hoek.ignore;
            client.onDisconnect = (willReconnect, log) => {
                expect(log.explanation).toEqual("Unknown");
                client.disconnect();
                team.attend();
            };

            // @ts-ignore
            client._ws.onclose({ code: 9999, reason: "bug", wasClean: false });
            await team.work;
            await server.stop();
        });
    });

    describe("disconnect()", () => {
        it("ignores when client not connected", () => {
            const client = new Client(undefined);
            client.disconnect();
        });

        it("ignores when client is disconnecting", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            await client.disconnect();
            await Hoek.wait(5);
            await client.disconnect();
            await server.stop();
        });

        it("avoids closing a socket in closing state", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            client._ws.close();
            await client.disconnect();
            await server.stop();
        });

        // it("closes socket while connecting", async () => {
        // });

        it("disconnects once", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            let disconnected = 0;
            client.onDisconnect = (willReconnect, log) => ++disconnected;

            client.disconnect();
            client.disconnect();
            await client.disconnect();

            await Hoek.wait(50);

            expect(disconnected).toEqual(1);
            await server.stop();
        });

        it("logs manual disconnection request", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            const team = new Teamwork.Team();
            client.onDisconnect = (willReconnect, log) => {
                expect(log.wasRequested).toBeTrue();
                team.attend();
            };

            client.disconnect();

            await team.work;
            await server.stop();
        });

        it("logs error disconnection request as not requested", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            client.onError = Hoek.ignore;
            await client.connect();

            const team = new Teamwork.Team();
            client.onDisconnect = (willReconnect, log) => {
                expect(log.wasRequested).toBeFalse();
                team.attend();
            };

            // @ts-ignore
            client._ws.close();

            await team.work;
            await server.stop();
        });

        it("logs error disconnection request as not requested after manual disconnect while already disconnected", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            client.onError = Hoek.ignore;
            client.disconnect();
            await client.connect();

            const team = new Teamwork.Team();
            client.onDisconnect = (willReconnect, log) => {
                expect(log.wasRequested).toBeFalse();
                team.attend();
            };

            // @ts-ignore
            client._ws.close();

            await team.work;
            await server.stop();
        });

        it("allows closing from inside request callback", async () => {
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

            await client.request("/");
            client.disconnect();
            await Hoek.wait(100);
            await server.stop();
        });
    });

    describe("_cleanup()", () => {
        it("ignores when client not connected", () => {
            const client = new Client(undefined);
            // @ts-ignore
            client._cleanup();
        });
    });

    describe("_reconnect()", () => {
        it("reconnects automatically", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);

            let e = 0;
            client.onError = (err) => {
                expect(err).toBeDefined();
                ++e;
            };

            const team = new Teamwork.Team();

            let c = 0;
            client.onConnect = () => {
                ++c;
                if (c === 2) {
                    expect(e).toEqual(0);
                    team.attend();
                }
            };

            expect(c).toEqual(0);
            expect(e).toEqual(0);
            await client.connect({ delay: 10 });

            expect(c).toEqual(1);
            expect(e).toEqual(0);

            // @ts-ignore
            client._ws.close();

            await team.work;
            await client.disconnect();
            await server.stop();
        });

        it("aborts reconnecting", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            client.onError = Hoek.ignore;

            let c = 0;
            client.onConnect = () => ++c;

            await client.connect({ delay: 100 });

            // @ts-ignore
            client._ws.close();
            await Hoek.wait(50);
            await client.disconnect();

            expect(c).toEqual(1);
            await server.stop();
        });

        it("does not reconnect automatically", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);

            let e = 0;
            client.onError = (err) => {
                expect(err).toBeDefined();
                ++e;
            };

            let c = 0;
            client.onConnect = () => ++c;

            let r = "";
            client.onDisconnect = (willReconnect, log) => {
                r += willReconnect ? "t" : "f";
            };

            expect(c).toEqual(0);
            expect(e).toEqual(0);
            await client.connect({ reconnect: false, delay: 10 });

            expect(c).toEqual(1);
            expect(e).toEqual(0);

            // @ts-ignore
            client._ws.close();
            await Hoek.wait(15);

            expect(c).toEqual(1);
            expect(r).toEqual("f");
            await client.disconnect();
            await server.stop();
        });

        it("overrides max delay", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);

            let c = 0;
            const now = Date.now();
            const team = new Teamwork.Team();
            client.onConnect = () => {
                ++c;

                if (c < 6) {
                    // @ts-ignore
                    client._ws.close();
                    return;
                }

                expect(Date.now() - now).toBeLessThan(150);

                team.attend();
            };

            await client.connect({ delay: 10, maxDelay: 11 });

            await team.work;
            await client.disconnect();
            await server.stop();
        });

        it("reconnects automatically (with errors)", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const url = "http://localhost:" + server.info.port;
            const client = new Client(url);

            let e = 0;
            client.onError = (err) => {
                expect(err).toBeDefined();
                expect(err.message).toEqual("Connection terminated while waiting to connect");
                expect(err.type).toEqual("ws");
                expect(err.isNes).toEqual(true);

                ++e;
                // @ts-ignore
                client._url = "http://localhost:" + server.info.port;
            };

            let r = "";
            client.onDisconnect = (willReconnect, log) => {
                r += willReconnect ? "t" : "f";
            };

            const team = new Teamwork.Team();

            let c = 0;
            client.onConnect = () => {
                ++c;

                if (c < 5) {
                    // @ts-ignore
                    client._ws.close();

                    if (c === 3) {
                        // @ts-ignore
                        client._url = "http://0";
                    }

                    return;
                }

                expect(e).toEqual(1);
                expect(r).toEqual("ttttt");

                team.attend();
            };

            expect(e).toEqual(0);
            await client.connect({ delay: 10, maxDelay: 15 });

            await team.work;
            await client.disconnect();
            await server.stop();
        });

        it("errors on pending request when closed", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "GET",
                path: "/",
                handler: async () => {
                    await Hoek.wait(10);
                    return "hello";
                },
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            const request = client.request("/");
            await client.disconnect();

            await expect(request).rejects.toThrowError("Request failed - server disconnected");
            await server.stop();
        });

        it("times out", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();

            const client = new Client("http://localhost:" + server.info.port);
            // @ts-ignore
            const orig = client._connect;
            // @ts-ignore
            client._connect = (...args) => {
                orig.apply(client, args);
                // @ts-ignore
                client._ws.onopen = null;
            };

            let c = 0;
            client.onConnect = () => ++c;

            let e = 0;
            client.onError = async (err) => {
                ++e;
                expect(err).toBeDefined();
                expect(err.message).toEqual("Connection timed out");
                expect(err.type).toEqual("timeout");
                expect(err.isNes).toEqual(true);

                if (e < 4) {
                    return;
                }

                expect(c).toEqual(0);
                await client.disconnect();
                await server.stop({ timeout: 1 });
            };

            await expect(client.connect({ delay: 50, maxDelay: 50, timeout: 50 })).rejects.toThrowError(
                "Connection timed out",
            );
        });

        it("limits retries", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);

            let c = 0;
            client.onConnect = () => {
                ++c;
                // @ts-ignore
                client._ws.close();
            };

            let r = "";
            client.onDisconnect = (willReconnect, log) => {
                r += willReconnect ? "t" : "f";
            };

            await client.connect({ delay: 5, maxDelay: 10, retries: 2 });

            await Hoek.wait(100);

            expect(c).toEqual(3);
            expect(r).toEqual("ttf");
            await client.disconnect();
            await server.stop();
        });

        it("aborts reconnect if disconnect is called in between attempts", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);

            const team = new Teamwork.Team();

            let c = 0;
            client.onConnect = async () => {
                ++c;
                // @ts-ignore
                client._ws.close();

                if (c === 1) {
                    setTimeout(() => client.disconnect(), 5);
                    await Hoek.wait(15);

                    expect(c).toEqual(1);
                    team.attend();
                }
            };

            await client.connect({ delay: 10 });

            await team.work;
            await server.stop();
        });
    });

    describe("request()", () => {
        it("defaults to GET", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: { headers: "*" } });

            server.route({
                method: "GET",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload, statusCode, headers } = await client.request({ path: "/" });
            expect(payload).toEqual("hello");
            expect(statusCode).toEqual(200);
            expect(headers["content-type"]).toEqual("text/html; charset=utf-8");

            await client.disconnect();
            await server.stop();
        });

        it("errors when disconnected", async () => {
            const client = new Client(undefined);

            await expect(client.request("/")).rejects.toThrowError("Failed to send message - server disconnected");
        });

        it("errors on invalid payload", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "POST",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            const a = { b: 1 };
            // @ts-ignore
            a.a = a;

            await expect(client.request({ method: "POST", path: "/", payload: a })).rejects.toThrowError(
                /Converting circular structure to JSON/,
            );
            await client.disconnect();
            await server.stop();
        });

        it("errors on invalid data", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            server.route({
                method: "POST",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            client._ws.send = () => {
                throw new Error("boom");
            };

            await expect(client.request({ method: "POST", path: "/", payload: "a" })).rejects.toThrowError("boom");
            await client.disconnect();
            await server.stop();
        });

        describe("empty response handling", () => {
            [
                {
                    testName: "handles empty string, no content-type",
                    handler: (request, h) => h.response("").code(200),
                    expectedPayload: "",
                },
                {
                    testName: "handles null, no content-type",
                    handler: () => null,
                    expectedPayload: null,
                },
                {
                    testName: "handles null, application/json",
                    handler: (request, h) => h.response(null).type("application/json"),
                    expectedPayload: null,
                },
                {
                    testName: "handles empty string, text/plain",
                    handler: (request, h) => h.response("").type("text/plain").code(200),
                    expectedPayload: "",
                },
                {
                    testName: "handles null, text/plain",
                    handler: (request, h) => h.response(null).type("text/plain"),
                    expectedPayload: null,
                },
            ].forEach(({ testName, handler, expectedPayload }) => {
                it(testName, async () => {
                    const server = Hapi.server();
                    await server.register({ plugin: plugin, options: { headers: "*" } });

                    server.route({
                        method: "GET",
                        path: "/",
                        handler,
                    });

                    await server.start();
                    const client = new Client("http://localhost:" + server.info.port);
                    await client.connect();

                    // @ts-ignore
                    const { payload } = await client.request({ path: "/" });
                    expect(payload).toEqual(expectedPayload);

                    await client.disconnect();
                    await server.stop();
                });
            });
        });

        describe("_send()", () => {
            it("catches send error without tracking", async () => {
                const server = Hapi.server();
                await server.register({ plugin: plugin, options: {} });

                await server.start();
                const client = new Client("http://localhost:" + server.info.port);
                await client.connect();

                // @ts-ignore
                client._ws.send = () => {
                    throw new Error("failed");
                };

                // @ts-ignore
                await expect(client._send({}, false)).rejects.toThrowError("failed");

                await client.disconnect();
                await server.stop();
            });
        });

        describe("_onMessage", () => {
            it("ignores invalid incoming message", async () => {
                const server = Hapi.server();
                await server.register({ plugin: plugin, options: {} });

                server.route({
                    method: "GET",
                    path: "/",
                    handler: async (request) => {
                        request.server.plugins.nes._listener._sockets._forEach((socket) => {
                            socket._ws.send("{");
                        });

                        await Hoek.wait(10);
                        return "hello";
                    },
                });

                await server.start();
                const client = new Client("http://localhost:" + server.info.port);

                let logged;
                client.onError = (err) => {
                    logged = err;
                };

                await client.connect();

                await client.request("/");
                expect(logged.message).toMatch(/Unexpected end of(?: JSON)? input/);
                expect(logged.type).toEqual("protocol");
                expect(logged.isNes).toEqual(true);

                await client.disconnect();
                await server.stop();
            });

            it("reports incomplete message", async () => {
                const server = Hapi.server();
                await server.register({ plugin: plugin, options: {} });

                server.route({
                    method: "GET",
                    path: "/",
                    handler: async (request) => {
                        request.server.plugins.nes._listener._sockets._forEach((socket) => {
                            socket._ws.send("+abc");
                        });

                        await Hoek.wait(10);
                        return "hello";
                    },
                });

                await server.start();
                const client = new Client("http://localhost:" + server.info.port);

                let logged;
                client.onError = (err) => {
                    logged = err;
                };

                await client.connect();

                await client.request("/");
                expect(logged.message).toEqual("Received an incomplete message");
                expect(logged.type).toEqual("protocol");
                expect(logged.isNes).toEqual(true);

                await client.disconnect();
                await server.stop();
            });

            it("ignores incoming message with unknown id", async () => {
                const server = Hapi.server();
                await server.register({ plugin: plugin, options: {} });

                server.route({
                    method: "GET",
                    path: "/",
                    handler: async (request) => {
                        request.server.plugins.nes._listener._sockets._forEach((socket) => {
                            socket._ws.send(
                                '{"id":100,"type":"response","statusCode":200,"payload":"hello","headers":{}}',
                            );
                        });

                        await Hoek.wait(10);
                        return "hello";
                    },
                });

                await server.start();
                const client = new Client("http://localhost:" + server.info.port);

                let logged;
                client.onError = (err) => {
                    logged = err;
                };

                await client.connect();

                await client.request("/");
                expect(logged.message).toEqual("Received response for unknown request");
                expect(logged.type).toEqual("protocol");
                expect(logged.isNes).toEqual(true);

                await client.disconnect();
                await server.stop();
            });

            it("ignores incoming message with unknown type", async () => {
                const server = Hapi.server();
                await server.register({ plugin: plugin, options: {} });

                server.route({
                    method: "GET",
                    path: "/",
                    handler: async (request) => {
                        request.server.plugins.nes._listener._sockets._forEach((socket) => {
                            socket._ws.send(
                                '{"id":2,"type":"unknown","statusCode":200,"payload":"hello","headers":{}}',
                            );
                        });

                        await Hoek.wait(10);
                        return "hello";
                    },
                });

                await server.start();
                const client = new Client("http://localhost:" + server.info.port);

                const team = new Teamwork.Team({ meetings: 2 });

                const logged: any[] = [];
                client.onError = (err) => {
                    logged.push(err);
                    team.attend();
                };

                await client.connect();
                await expect(client.request("/")).rejects.toThrowError("Received invalid response");
                await team.work;

                expect(logged[0].message).toEqual("Received unknown response type: unknown");
                expect(logged[0].type).toEqual("protocol");
                expect(logged[0].isNes).toEqual(true);

                expect(logged[1].message).toEqual("Received response for unknown request");
                expect(logged[1].type).toEqual("protocol");
                expect(logged[1].isNes).toEqual(true);

                await client.disconnect();
                await server.stop();
            });
        });

        describe("_beat()", () => {
            it("disconnects when server fails to ping", async () => {
                const server = Hapi.server();
                await server.register({ plugin: plugin, options: { heartbeat: { interval: 20, timeout: 10 } } });

                await server.start();
                const client = new Client("http://localhost:" + server.info.port);
                client.onError = Hoek.ignore;

                const team = new Teamwork.Team({ meetings: 2 });

                client.onHeartbeatTimeout = (willReconnect) => {
                    expect(willReconnect).toEqual(true);
                    team.attend();
                };

                client.onDisconnect = (willReconnect, log) => {
                    expect(willReconnect).toEqual(true);
                    team.attend();
                };

                await client.connect();
                clearTimeout(server.plugins.nes._listener._heartbeat);

                await team.work;
                await client.disconnect();
                await server.stop();
            });

            it("disconnects when server fails to ping (after a few pings)", async () => {
                const server = Hapi.server();
                await server.register({ plugin: plugin, options: { heartbeat: { interval: 20, timeout: 10 } } });

                await server.start();
                const client = new Client("http://localhost:" + server.info.port);
                client.onError = Hoek.ignore;

                const team = new Teamwork.Team();
                client.onDisconnect = (willReconnect, log) => {
                    team.attend();
                };

                await client.connect();
                await Hoek.wait(50);
                clearTimeout(server.plugins.nes._listener._heartbeat);

                await team.work;
                await client.disconnect();
                await server.stop();
            });
        });
    });
});
