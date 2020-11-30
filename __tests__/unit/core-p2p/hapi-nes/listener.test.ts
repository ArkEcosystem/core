import "jest-extended";

import * as Hapi from "@hapi/hapi";
import * as Hoek from "@hapi/hoek";
import * as Teamwork from "@hapi/teamwork";
import { Client, plugin } from "@packages/core-p2p/src/hapi-nes";
import { Socket } from "@packages/core-p2p/src/hapi-nes/socket";
import { parseNesMessage } from "@packages/core-p2p/src/hapi-nes/utils";

jest.setTimeout(60000);

describe("Listener", () => {
    it("refuses connection while stopping", async () => {
        const server = Hapi.server();

        const onConnection = (socket) => {
            const orig = socket.disconnect;
            socket.disconnect = async () => {
                await Hoek.wait(50);
                return orig.call(socket);
            };
        };

        await server.register({ plugin: plugin, options: { onConnection } });

        await server.start();

        const team = new Teamwork.Team({ meetings: 20 });

        const clients = [];
        for (let i = 0; i < 20; ++i) {
            const client = new Client("http://localhost:" + server.info.port);
            client.onDisconnect = () => team.attend();
            client.onError = Hoek.ignore;
            await client.connect();
            // @ts-ignore
            clients.push(client);
        }

        const client2 = new Client("http://localhost:" + server.info.port);
        client2.onError = Hoek.ignore;

        server.stop();
        await expect(client2.connect()).toReject();
        await team.work;
    });

    it("limits number of connections", async () => {
        const server = Hapi.server();
        await server.register({ plugin: plugin, options: { maxConnections: 1 } });

        await server.start();
        const client = new Client("http://localhost:" + server.info.port);
        await client.connect();

        const client2 = new Client("http://localhost:" + server.info.port);
        client2.onError = Hoek.ignore;

        await expect(client2.connect()).toReject();

        await client.disconnect();
        await client2.disconnect();
        await server.stop();
    });

    it("rejects unknown origin", async () => {
        const server = Hapi.server();
        await server.register({ plugin: plugin, options: { origin: ["http://localhost:12345"] } });

        await server.start();
        const client = new Client("http://localhost:" + server.info.port);
        await expect(client.connect()).toReject();
        await client.disconnect();
        await server.stop();
    });

    it("accepts known origin", async () => {
        const server = Hapi.server();
        await server.register({ plugin: plugin, options: { origin: ["http://localhost:12345"] } });

        await server.start();
        const client = new Client("http://localhost:" + server.info.port, { ws: { origin: "http://localhost:12345" } });
        await client.connect();
        await client.disconnect();
        await server.stop();
    });

    it("handles socket errors", async () => {
        const server = Hapi.server();

        const onConnection = (socket) => {
            socket._ws.emit("error", new Error());
        };

        await server.register({ plugin: plugin, options: { onConnection } });

        await server.start();
        const client = new Client("http://localhost:" + server.info.port, { ws: { origin: "http://localhost:12345" } });
        client.onError = Hoek.ignore;
        await client.connect();
        await server.stop();
    });

    describe("maxPayload", () => {
        let server;
        let response;
        let payload;

        beforeEach(async () => {
            response = Buffer.from("a".repeat(10));
            payload = Buffer.from("b".repeat(10));

            server = Hapi.server();
            await server.register({ plugin: plugin, options: { maxPayload: 100 } });
            server.route({
                method: "POST",
                path: "/",
                handler: async () => {
                    return response;
                },
            });
        });

        it("should resolve if payload and response are less than maxPayload", async () => {
            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            await expect(client.request({ path: "/", payload })).resolves.toEqual({
                payload: response,
                statusCode: 200,
            });

            await client.disconnect();
            await server.stop();
        });

        it("should resolve if response is greater than maxPayload", async () => {
            response = Buffer.from("a".repeat(200));

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            await expect(client.request({ path: "/", payload })).resolves.toEqual({
                payload: response,
                statusCode: 200,
            });

            await client.disconnect();
            await server.stop();
        });

        it("should throw if payload is greater than maxPayload", async () => {
            payload = "b".repeat(110);

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();

            await expect(client.request({ path: "/", payload })).rejects.toThrowError(
                "Request failed - server disconnected",
            );

            await client.disconnect();
            await server.stop();
        });
    });

    describe("_beat()", () => {
        it("disconnects client after timeout", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: { heartbeat: { interval: 20, timeout: 10 } } });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            client.onError = Hoek.ignore;

            const team = new Teamwork.Team();
            client.onDisconnect = () => team.attend();

            await client.connect();
            // @ts-ignore
            expect(client._heartbeatTimeout).toEqual(30);

            // @ts-ignore
            client._onMessage = Hoek.ignore; // Stop processing messages

            await team.work;
            await client.disconnect();
            await server.stop();
        });

        it("disables heartbeat", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: { heartbeat: false } });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            await client.connect();
            // @ts-ignore
            expect(client._heartbeatTimeout).toBeFalse();

            await client.disconnect();
            await server.stop();
        });

        it("pauses heartbeat timeout while replying to client", async () => {
            const server = Hapi.server();
            await server.register({
                plugin: plugin,
                options: { heartbeat: { interval: 1200, timeout: 1180 } },
            });

            server.route({
                method: "POST",
                path: "/",
                handler: async () => {
                    await Hoek.wait(1440);
                    return "hello";
                },
            });

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            let e = 0;
            client.onError = (err) => {
                ++e;

                if (e === 1) {
                    expect(err.message).toEqual("Disconnecting due to heartbeat timeout");
                }
            };

            let d = 0;
            client.onDisconnect = (willReconnect, log) => ++d;

            await client.connect();
            // @ts-ignore
            expect(client._heartbeatTimeout).toEqual(2380);

            await client.request("/");
            await Hoek.wait(2520);

            expect(d).toEqual(0);

            // @ts-ignore
            client._onMessage = Hoek.ignore; // Stop processing messages
            await Hoek.wait(2480);

            expect(d).toEqual(1);

            await client.disconnect();
            await server.stop();
        });

        it("does not disconnect newly connecting sockets", async () => {
            const server = Hapi.server();
            let disconnected = 0;
            const onDisconnection = () => disconnected++;
            await server.register({
                plugin: plugin,
                options: { onDisconnection, heartbeat: { timeout: 1050, interval: 1055 } },
            });
            await server.start();

            const client = new Client("http://localhost:" + server.info.port);
            const canary = new Client("http://localhost:" + server.info.port);
            await canary.connect();

            const helloTeam = new Teamwork.Team();
            // @ts-ignore
            const socketOnMessage = Socket.prototype._onMessage;
            // @ts-ignore
            Socket.prototype._onMessage = async function (message) {
                if (parseNesMessage(message).type === "hello") {
                    await helloTeam.work;
                }

                return socketOnMessage.call(this, message);
            };

            const pingTeam = new Teamwork.Team();
            // @ts-ignore
            const _onMessage = canary._onMessage.bind(canary);
            // @ts-ignore
            canary._onMessage = function (message) {
                if (parseNesMessage(message.data).type === "ping") {
                    pingTeam.attend();
                }

                return _onMessage(message);
            };

            // wait for the next ping
            await pingTeam.work;

            await Hoek.wait(1030);
            const connectPromise = client.connect().catch((message) => {
                throw new Error(message);
            });

            // client should not time out for another 50 milliseconds

            await Hoek.wait(1040);

            // release "hello" message before the timeout hits
            helloTeam.attend();
            await connectPromise;

            await Hoek.wait(1060); // ping should have been answered and connection still active

            expect(disconnected).toEqual(0);

            // @ts-ignore
            Socket.prototype._onMessage = socketOnMessage;
            await canary.disconnect();
            await client.disconnect();
            await server.stop();
        });

        it("disconnects sockets that have not fully connected in a long time", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: { heartbeat: { interval: 20, timeout: 10 } } });

            // @ts-ignore
            const socketOnMessage = Socket.prototype._onMessage;
            // @ts-ignore
            Socket.prototype._onMessage = Hoek.ignore; // Do not process messages

            await server.start();
            const client = new Client("http://localhost:" + server.info.port);
            client.onError = Hoek.ignore;

            const team = new Teamwork.Team();
            client.onDisconnect = () => team.attend();

            client.connect().catch(Hoek.ignore);

            await team.work;
            // @ts-ignore
            Socket.prototype._onMessage = socketOnMessage;
            await client.disconnect();
            await server.stop();
        });
    });

    describe("_generateId()", () => {
        it("rolls over when reached max sockets per millisecond", async () => {
            const server = Hapi.server();
            await server.register({ plugin: plugin, options: {} });

            const listener = server.plugins.nes._listener;
            listener._socketCounter = 99999;
            let id = listener._generateId();
            expect(id.split(":")[4]).toEqual("99999");
            id = listener._generateId();
            expect(id.split(":")[4]).toEqual("10000");
        });
    });
});
