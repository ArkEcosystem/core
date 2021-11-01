import "jest-extended";

import * as Hapi from "@hapi/hapi";
import * as Hoek from "@hapi/hoek";
import * as Teamwork from "@hapi/teamwork";
import { Client, plugin } from "@packages/core-p2p/src/hapi-nes";
import { stringifyNesMessage } from "@packages/core-p2p/src/hapi-nes/utils";

jest.setTimeout(60000);

const createServerWithPlugin = async (pluginOptions = {}, serverOptions = {}, withPreResponseHandler = false) => {
    const server = Hapi.server(serverOptions);
    await server.register({ plugin: plugin, options: pluginOptions });

    server.ext({
        type: "onPostAuth",
        async method(request, h) {
            request.payload = (request.payload || Buffer.from("")).toString();
            return h.continue;
        },
    });

    if (withPreResponseHandler) {
        server.ext({
            type: "onPreResponse",
            method: async (request, h) => {
                try {
                    if (request.response.source) {
                        request.response.source = Buffer.from(request.response.source);
                    } else {
                        const errorMessage =
                            request.response.output?.payload?.message ??
                            request.response.output?.payload?.error ??
                            "Error";
                        request.response.output.payload = Buffer.from(errorMessage, "utf-8");
                    }
                } catch (e) {
                    request.response.statusCode = 500; // Internal server error (serializing failed)
                    request.response.output = {
                        statusCode: 500,
                        payload: Buffer.from("Internal server error"),
                        headers: {},
                    };
                }
                return h.continue;
            },
        });
    }

    return server;
};

describe("Client", () => {
    it("defaults options.ws.maxPayload to 102400 (node) && perMessageDeflate to false", () => {
        const client = new Client("http://localhost");
        // @ts-ignore
        expect(client._settings.ws).toEqual({ maxPayload: 102400, perMessageDeflate: false });
    });

    it("allows setting options.ws.maxPayload (node)", () => {
        const client = new Client("http://localhost", { ws: { maxPayload: 100 } });
        // @ts-ignore
        expect(client._settings.ws).toEqual({ maxPayload: 100, perMessageDeflate: false });
    });

    it("prevents setting options.ws.perMessageDeflate (node)", () => {
        const client = new Client("http://localhost", { ws: { perMessageDeflate: true } });
        // @ts-ignore
        expect(client._settings.ws).toEqual({ maxPayload: 102400, perMessageDeflate: false });
    });

    it("does not reset maxPayload on socket after receiving ping message", async () => {
        const server = await createServerWithPlugin({ heartbeat: { interval: 20, timeout: 10 } });
        await server.start();

        const client = new Client("http://localhost:" + server.info.port);
        await client.connect({ reconnect: false });
        client.onError = Hoek.ignore;

        client.setMaxPayload(204800); // setting here after the initial "hello"

        await Hoek.wait(30);

        // @ts-ignore
        expect(client._ws._receiver._maxPayload).toEqual(204800);

        await client.disconnect();
        await server.stop();
    });

    describe("onError", () => {
        it("logs error to console by default", async () => {
            const server = await createServerWithPlugin();
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
            const server1 = await createServerWithPlugin();
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

            const server2 = await createServerWithPlugin({}, { port });
            server2.route({ path: "/", method: "POST", handler: () => "ok" });
            await server2.start();

            await team.work;

            expect(reconnecting).toBeTrue();

            const res = await client.request("/");
            // @ts-ignore
            expect(res.payload).toEqual(Buffer.from("ok"));

            client.disconnect();
            await server2.stop();
        });

        it("fails to connect", async () => {
            const client = new Client("http://0");

            await expect(client.connect()).rejects.toThrowError("Connection terminated while waiting to connect");
            await client.disconnect();
        });

        it("errors if already connected", async () => {
            const server = await createServerWithPlugin();
            await server.start();

            const client = new Client("http://localhost:" + server.info.port);

            await client.connect({ reconnect: false });
            await expect(client.connect()).rejects.toThrowError("Already connected");
            await client.disconnect();
            await server.stop();
        });

        it("errors if set to reconnect", async () => {
            const server = await createServerWithPlugin();
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
            const server = await createServerWithPlugin();
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
            const server = await createServerWithPlugin();

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            await client.disconnect();
            await Hoek.wait(5);
            await client.disconnect();
            await server.stop();
        });

        it("avoids closing a socket in closing state", async () => {
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

            server.route({
                method: "POST",
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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

            server.route({
                method: "POST",
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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
            const server = await createServerWithPlugin();

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
        it("defaults to POST", async () => {
            const server = await createServerWithPlugin({ headers: "*" });

            server.route({
                method: "POST",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            // @ts-ignore
            const { payload, statusCode } = await client.request({ path: "/" });
            expect(payload).toEqual(Buffer.from("hello"));
            expect(statusCode).toEqual(200);

            await client.disconnect();
            await server.stop();
        });

        it("errors when disconnected", async () => {
            const client = new Client(undefined);

            await expect(client.request("/")).rejects.toThrowError("Failed to send message - server disconnected");
        });

        it("errors on invalid payload", async () => {
            const server = await createServerWithPlugin();

            server.route({
                method: "POST",
                path: "/",
                handler: () => "hello",
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            const a = { b: 1 };

            await expect(client.request({ method: "POST", path: "/", payload: a })).rejects.toThrowError(
                /The first argument must be.*/,
            );
            await client.disconnect();
            await server.stop();
        });

        it("errors on invalid data", async () => {
            const server = await createServerWithPlugin();

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
                    expectedPayload: Buffer.alloc(0),
                },
                {
                    testName: "handles null, no content-type",
                    handler: () => null,
                    expectedPayload: Buffer.alloc(0),
                },
                {
                    testName: "handles null, application/json",
                    handler: (request, h) => h.response(null).type("application/json"),
                    expectedPayload: Buffer.alloc(0),
                },
                {
                    testName: "handles empty string, text/plain",
                    handler: (request, h) => h.response("").type("text/plain").code(200),
                    expectedPayload: Buffer.alloc(0),
                },
                {
                    testName: "handles null, text/plain",
                    handler: (request, h) => h.response(null).type("text/plain"),
                    expectedPayload: Buffer.alloc(0),
                },
            ].forEach(({ testName, handler, expectedPayload }) => {
                it(testName, async () => {
                    const server = await createServerWithPlugin({ headers: "*" });

                    server.route({
                        method: "POST",
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
                const server = await createServerWithPlugin();

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
                const server = await createServerWithPlugin({}, {}, true);

                server.route({
                    method: "POST",
                    path: "/",
                    handler: async (request) => {
                        request.server.plugins.nes._listener._sockets._forEach((socket) => {
                            socket._ws.send(Buffer.from("{"));
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
                expect(logged.message).toMatch(/Nes message is below minimum length/);
                expect(logged.type).toEqual("protocol");
                expect(logged.isNes).toEqual(true);

                await client.disconnect();
                await server.stop();
            });

            it("ignores incoming message with unknown id", async () => {
                const server = await createServerWithPlugin({}, {}, true);

                server.route({
                    method: "POST",
                    path: "/",
                    handler: async (request) => {
                        request.server.plugins.nes._listener._sockets._forEach((socket) => {
                            socket._ws.send(
                                stringifyNesMessage({
                                    id: 100,
                                    type: "request",
                                    statusCode: 200,
                                    payload: Buffer.from("hello"),
                                    path: "/",
                                    version: "1",
                                    socket: "socketid",
                                    heartbeat: {
                                        interval: 10000,
                                        timeout: 5000,
                                    },
                                }),
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

            it("ignores incoming message with undefined type", async () => {
                const server = await createServerWithPlugin({}, {}, true);

                server.route({
                    method: "POST",
                    path: "/",
                    handler: async (request) => {
                        request.server.plugins.nes._listener._sockets._forEach((socket) => {
                            socket._ws.send(
                                stringifyNesMessage({
                                    id: 2,
                                    type: "undefined",
                                    statusCode: 200,
                                    payload: Buffer.from("hello"),
                                    path: "/",
                                    version: "1",
                                    socket: "socketid",
                                    heartbeat: {
                                        interval: 10000,
                                        timeout: 5000,
                                    },
                                }),
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

                expect(logged[0].message).toEqual("Received unknown response type: undefined");
                expect(logged[0].type).toEqual("protocol");
                expect(logged[0].isNes).toEqual(true);

                expect(logged[1].message).toEqual("Received response for unknown request");
                expect(logged[1].type).toEqual("protocol");
                expect(logged[1].isNes).toEqual(true);

                await client.disconnect();
                await server.stop();
            });

            it("logs incoming message after timeout", async () => {
                const server = await createServerWithPlugin({}, {}, true);

                server.route({
                    method: "POST",
                    path: "/",
                    handler: async (request) => {
                        await Hoek.wait(200);
                        return "hello";
                    },
                });

                await server.start();
                const client = new Client("http://localhost:" + server.info.port, { timeout: 20 });

                let logged;
                client.onError = (err) => {
                    logged = err;
                };

                await client.connect();

                await expect(client.request("/")).rejects.toThrowError("Request timed out");

                await new Promise<void>((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 300);
                });

                // Message received after timeout
                expect(logged.message).toEqual("Received response for unknown request");
                expect(logged.type).toEqual("protocol");
                expect(logged.isNes).toEqual(true);

                await client.disconnect();
                await server.stop();
            });
        });

        describe("_beat()", () => {
            it("disconnects when server fails to ping", async () => {
                const server = await createServerWithPlugin({ heartbeat: { interval: 20, timeout: 10 } });

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
                const server = await createServerWithPlugin({ heartbeat: { interval: 20, timeout: 10 } });

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

        describe("ping / pong", () => {
            it.each([["ping"], ["pong"]])("terminates when receiving a ws.%s", async (method) => {
                const server = await createServerWithPlugin({}, {}, true);

                server.route({
                    method: "POST",
                    path: "/",
                    handler: async (request) => {
                        request.server.plugins.nes._listener._sockets._forEach((socket) => {
                            setTimeout(() => socket._ws[method](), 100);
                        });

                        return "hello";
                    },
                });

                await server.start();
                const client = new Client("http://localhost:" + server.info.port);

                await client.connect();

                await client.request("/");

                await Hoek.wait(500);

                //@ts-ignore
                expect(client._ws).toBeNull(); // null because _cleanup() in reconnect() method

                await client.disconnect();
                await server.stop();
            });
        });
    });
});
