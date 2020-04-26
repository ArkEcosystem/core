import "jest-extended";

import { Client } from "@packages/core-forger/src/client";
import { Application, Container } from "@packages/core-kernel";
import { NetworkStateStatus } from "@packages/core-p2p";

import { forgedBlockWithTransactions } from "./__utils__/create-block-with-transactions";

import Nes, { nesClient } from "./mocks/nes";

jest.mock("@hapi/nes", () => require("./mocks/nes"));

let app: Application;
const logger = {
    error: jest.fn(),
    debug: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.LogService).toConstantValue(logger);
});

afterEach(() => {
    //jest.resetAllMocks();
});

describe("Client", () => {
    let client: Client;

    const host = { hostname: "127.0.0.1", port: 4000, socket: undefined };
    const hosts = [ host ];

    beforeEach(() => {
        client = app.resolve<Client>(Client);

        logger.error.mockReset();
        logger.debug.mockReset();
    });

    describe("register", () => {
        it("should register hosts", async () => {
            client.register(hosts);
            expect(Nes.Client).toHaveBeenCalledWith(`ws://${host.hostname}:${host.port}`);
            expect(client.hosts).toEqual([ { ...host, socket: expect.anything() } ]);
        });

        it("on error the socket should call logger", () => {
            client.register(hosts);

            const fakeError = { message: "Fake Error" };
            client.hosts[0].socket.onError(fakeError);

            expect(logger.error).toHaveBeenCalledWith("Fake Error");
        });
    });

    describe("dispose", () => {
        it("should call disconnect on all sockets", () => {
            client.register([ host, { hostname: "127.0.0.5", port: 4000 }]);
            client.dispose();
            expect(client.hosts[0].socket.disconnect).toHaveBeenCalled();
            expect(client.hosts[1].socket.disconnect).toHaveBeenCalled();
            expect(nesClient.disconnect).toBeCalled();
        });
    });

    describe("broadcastBlock", () => {
        it("should log broadcast as debug message", async () => {
            client.register(hosts);

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(logger.debug).toHaveBeenCalledWith(
                `Broadcasting block ${forgedBlockWithTransactions.data.height.toLocaleString()} (${
                    forgedBlockWithTransactions.data.id
                }) with ${forgedBlockWithTransactions.data.numberOfTransactions} transactions to ${host.hostname}`,
            );
        });

        it("should not broadcast block when there is an issue with socket", async () => {
            client.register(hosts);

            host.socket = {};
            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();

            expect(logger.error).toHaveBeenCalledWith(
                `Broadcast block failed: Request to ${host.hostname}:${host.port}<p2p.peer.postBlock> failed, because of 'this.host.socket.request is not a function'.`,
            );
        });

        it("should broadcast valid blocks without error", async () => {
            client.register([host]);

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(nesClient.request).toHaveBeenCalledWith({
                path: "p2p.peer.postBlock",
                headers: {},
                method: "POST",
                payload: { block: expect.anything() }
            });
            expect(logger.error).not.toHaveBeenCalled();
        });

        it("should not broadcast blocks on socket.request error", async () => {
            client.register([host]);

            nesClient.request.mockRejectedValueOnce(new Error("oops"));

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(logger.error).toHaveBeenCalledWith(
                `Broadcast block failed: Request to ${host.hostname}:${host.port}<p2p.peer.postBlock> failed, because of 'oops'.`,
            );
        });
    });

    describe("selectHost", () => {
        let hosts;

        beforeEach(() => {
            hosts = [
                host,
                host,
                host,
                host,
                host,
                host,
                host,
                host,
                host,
                host,
            ];
        });

        it("should select the first open socket", async () => {
            hosts[4].socket._isReady = () => true;

            client.register(hosts);
            client.selectHost();
            expect((client as any).host).toEqual(hosts[4]);
        });

        it("should log debug message when no sockets are open", async () => {
            hosts.forEach((host) => (host.socket._isReady = () => false));

            client.register(hosts);
            await expect(client.selectHost()).rejects.toThrow(
                `${hosts.map((host) => host.hostname).join()} didn't respond. Trying again later.`,
            );
            expect(logger.debug).toHaveBeenCalledWith(
                `No open socket connection to any host: ${JSON.stringify(
                    hosts.map((host) => `${host.hostname}:${host.port}`),
                )}.`,
            );
        });
    });

    describe("getTransactions", () => {
        it("should call p2p.internal.getUnconfirmedTransactions endpoint", async () => {
            client.register([host]);
            await client.getTransactions();
            expect(nesClient.request).toHaveBeenCalledWith(
                {
                    path: "p2p.internal.getUnconfirmedTransactions",
                    headers: {},
                    method: "POST",
                    payload: {}
                }
            );
        });
    });

    describe("getRound", () => {
        it("should broadcast internal getRound transaction", async () => {
            client.register([host]);
            host.socket._isReady = () => true;

            await client.getRound();

            expect(nesClient.request).toHaveBeenCalledWith(
                {
                    path: "p2p.internal.getCurrentRound",
                    headers: {},
                    method: "POST",
                    payload: {}
                }
            );
        });
    });

    describe("syncWithNetwork", () => {
        it("should broadcast internal getRound transaction", async () => {
            client.register([host]);
            host.socket._isReady = () => true;
            await client.syncWithNetwork();

            expect(nesClient.request).toHaveBeenCalledWith(
                {
                    path: "p2p.internal.syncBlockchain",
                    headers: {},
                    method: "POST",
                    payload: {}
                }
            );
            expect(logger.debug).toHaveBeenCalledWith(`Sending wake-up check to relay node ${host.hostname}`);
        });

        it("should log error message if syncing fails", async () => {
            const errorMessage = "Fake Error";
            nesClient.request.mockRejectedValueOnce(new Error(errorMessage))
            host.socket._isReady = () => true;
            client.register([host]);
            await expect(client.syncWithNetwork()).toResolve();
            expect(logger.error).toHaveBeenCalledWith(`Could not sync check: Request to 127.0.0.1:4000<p2p.internal.syncBlockchain> failed, because of '${errorMessage}'.`);
        });
    });

    describe("getNetworkState", () => {
        it("should emit internal getNetworkState event", async () => {
            client.register([host]);
            await client.getNetworkState();

            expect(nesClient.request).toHaveBeenCalledWith(
                {
                    path: "p2p.internal.getNetworkState",
                    headers: {},
                    method: "POST",
                    payload: {}
                }
            );
        });

        it("should return valid network state on error", async () => {
            const errorMessage = "Fake Error";
            nesClient.request.mockRejectedValueOnce(new Error(errorMessage))

            client.register([host]);
            const networkState = await client.getNetworkState();

            expect(networkState.status).toEqual(NetworkStateStatus.Unknown);
        });
    });

    describe("emitEvent", () => {
        it("should emit events from localhost", async () => {
            host.hostname = "127.0.0.1";
            client.register([host]);

            const data = { activeDelegates: ["delegate-one"] };

            await client.emitEvent("test-event", data);

            expect(nesClient.request).toHaveBeenCalledWith(
                {
                    path: "p2p.internal.emitEvent",
                    headers: {},
                    method: "POST",
                    payload: {
                        body: data,
                        event: "test-event",
                    }
                }
            );
        });

        it("should not emit events which are not from localhost", async () => {
            host.hostname = "127.0.0.2";
            client.register([host]);

            const data = { activeDelegates: ["delegate-one"] };
            await client.emitEvent("test-event", data);

            expect(logger.error).toHaveBeenCalledWith("emitEvent: unable to find any local hosts.");
        });

        it("should log error if emitting fails", async () => {
            const errorMessage = "Fake Error";
            nesClient.request.mockRejectedValueOnce(new Error(errorMessage))

            host.hostname = "127.0.0.1";
            client.register([host]);

            const event = "test-event";
            const data = { activeDelegates: ["delegate-one"] };
            await client.emitEvent(event, data);

            expect(logger.error).toHaveBeenCalledWith(
                `Failed to emit "${event}" to "${host.hostname}:${host.port}"`,
            );
        });
    });
});
