import "jest-extended";

import { Client } from "@packages/core-forger/src/client";
import { Application, Container } from "@packages/core-kernel";
import { NetworkStateStatus } from "@packages/core-p2p";
import { codec } from "@packages/core-p2p";
import socketCluster from "socketcluster-client";

import { forgedBlockWithTransactions } from "./__utils__/create-block-with-transactions";

jest.mock("socketcluster-client");

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
    jest.restoreAllMocks();
    jest.resetAllMocks();
});

describe("Client", () => {
    let spySocketDisconnect;
    let spySocketOn;
    let spySocketCluster;
    let spyEmit;

    let mockHost;
    let client: Client;

    beforeEach(() => {
        client = app.resolve<Client>(Client);
        spySocketOn = jest.fn();
        spySocketDisconnect = jest.fn();
        spyEmit = jest.fn((__, data, cb) => cb(undefined, data));

        mockHost = {
            socket: {
                on: spySocketOn,
                disconnect: spySocketDisconnect,
                emit: spyEmit,
                getState: () => "open",
                OPEN: "open",
            },
            hostname: "mock-1",
        };
        // @ts-ignore
        spySocketCluster = jest.spyOn(socketCluster, "create").mockImplementation(() => mockHost.socket);
    });

    describe("register", () => {
        it("should register hosts", async () => {
            const expected = {
                ...mockHost,
                autoReconnectOptions: {
                    initialDelay: 1000,
                    maxDelay: 1000,
                },
                codecEngine: codec,
            };

            client.register([mockHost]);
            expect(spySocketCluster).toHaveBeenCalledWith(expected);
            expect(client.hosts).toEqual([mockHost]);
        });

        it("on error the socket should call logger", () => {
            let onErrorCallBack;
            spySocketOn.mockImplementation((...data) => (onErrorCallBack = data[1]));

            client.register([mockHost]);

            const fakeError = { message: "Fake Error" };
            onErrorCallBack(fakeError);

            expect(logger.error).toHaveBeenCalledWith("Fake Error");
        });

        it("should not call logger if the socket hangs up", () => {
            let onErrorCallBack;
            spySocketOn.mockImplementationOnce((...data) => (onErrorCallBack = data[1]));

            client.register([mockHost]);

            const socketHangupError = { message: "Socket hung up" };
            onErrorCallBack(socketHangupError);

            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe("dispose", () => {
        it("should call disconnect on all sockets", () => {
            client.register([mockHost]);
            client.dispose();
            expect(spySocketDisconnect).toHaveBeenCalled();
        });

        it("should do nothing if a hosts socket doesn't exist", () => {
            client.register([mockHost]);
            delete mockHost.socket;

            client.dispose();
            expect(spySocketDisconnect).not.toHaveBeenCalledWith();
        });
    });

    describe("broadcastBlock", () => {
        it("should log broadcast as debug message", async () => {
            client.register([mockHost]);

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(logger.debug).toHaveBeenCalledWith(
                `Broadcasting block ${forgedBlockWithTransactions.data.height.toLocaleString()} (${
                    forgedBlockWithTransactions.data.id
                }) with ${forgedBlockWithTransactions.data.numberOfTransactions} transactions to ${mockHost.hostname}`,
            );
        });

        it("should not broadcast block when there is an issue with socket", async () => {
            client.register([mockHost]);

            mockHost.socket = {};
            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();

            expect(logger.error).toHaveBeenCalledWith(
                `Broadcast block failed: Request to ${mockHost.hostname}:${mockHost.port}<p2p.peer.postBlock> failed, because of 'socket.getState is not a function'.`,
            );
        });

        it("should not broadcast block when there the socket is closed", async () => {
            client.register([mockHost]);

            mockHost.socket.getState = () => "closed";

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(spyEmit).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalledWith(
                `Broadcast block failed: Request to ${mockHost.hostname}:${
                    mockHost.port
                }<p2p.peer.postBlock> failed, because of 'Peer ${
                    mockHost.hostname
                } socket is not connected. State: ${mockHost.socket.getState()}'.`,
            );
        });

        it("should broadcast valid blocks without error", async () => {
            client.register([mockHost]);

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(spyEmit).toHaveBeenCalledWith("p2p.peer.postBlock", expect.anything(), expect.anything());
            expect(logger.error).not.toHaveBeenCalled();
        });

        it("should not broadcast blocks on socketEmit error", async () => {
            client.register([mockHost]);

            spyEmit.mockImplementation((__, data, cb) => cb("Error", data));

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(logger.error).toHaveBeenCalledWith(
                `Broadcast block failed: Request to ${mockHost.hostname}:${mockHost.port}<p2p.peer.postBlock> failed, because of 'undefined'.`,
            );
        });
    });

    describe("selectHost", () => {
        let hosts;

        beforeEach(() => {
            hosts = [
                mockHost,
                mockHost,
                mockHost,
                mockHost,
                mockHost,
                mockHost,
                mockHost,
                mockHost,
                mockHost,
                mockHost,
            ];
        });

        it("should select the first open socket", async () => {
            hosts[4].socket.getState = () => "open";

            client.register(hosts);
            client.selectHost();
            expect((client as any).host).toEqual(hosts[4]);
        });

        it("should log debug message when no sockets are open", async () => {
            hosts.forEach(host => (host.socket.getState = () => "closed"));

            client.register(hosts);
            await expect(client.selectHost()).rejects.toThrow(
                `${hosts.map(host => host.hostname).join()} didn't respond. Trying again later.`,
            );
            expect(logger.debug).toHaveBeenCalledWith(
                `No open socket connection to any host: ${JSON.stringify(
                    hosts.map(host => `${host.hostname}:${host.port}`),
                )}.`,
            );
        });
    });

    describe("getTransactions", () => {
        it("should broadcast get transactions internal event using socket emitter", async () => {
            client.register([mockHost]);
            await client.getTransactions();
            expect(spyEmit).toHaveBeenCalledWith(
                "p2p.internal.getUnconfirmedTransactions",
                {
                    data: {},
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
                expect.anything(),
            );
        });
    });

    describe("getRound", () => {
        it("should broadcast internal getRound transaction", async () => {
            client.register([mockHost]);
            await client.getRound();
            expect(spyEmit).toHaveBeenCalledWith(
                "p2p.internal.getCurrentRound",
                {
                    data: {},
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
                expect.anything(),
            );
        });
    });

    describe("syncWithNetwork", () => {
        it("should broadcast internal getRound transaction", async () => {
            client.register([mockHost]);
            await client.syncWithNetwork();
            expect(spyEmit).toHaveBeenCalledWith(
                "p2p.internal.syncBlockchain",
                {
                    data: {},
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
                expect.anything(),
            );
            expect(logger.debug).toHaveBeenCalledWith(`Sending wake-up check to relay node ${mockHost.hostname}`);
        });

        it("should log error message if syncing fails", async () => {
            const errorMessage = "Fake Error";
            const emitSpy = jest.spyOn(client as any, "emit");
            emitSpy.mockImplementationOnce(() => {
                throw new Error(errorMessage);
            });
            client.register([mockHost]);
            await expect(client.syncWithNetwork()).toResolve();
            expect(logger.error).toHaveBeenCalledWith(`Could not sync check: ${errorMessage}`);
        });
    });

    describe("getNetworkState", () => {
        it("should emit internal getNetworkState event", async () => {
            client.register([mockHost]);
            await client.getNetworkState();

            expect(spyEmit).toHaveBeenCalledWith(
                "p2p.internal.getNetworkState",
                {
                    data: {},
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
                expect.anything(),
            );
        });

        it("should return valid network state on error", async () => {
            const errorMessage = "Fake Error";
            const emitSpy = jest.spyOn(client as any, "emit");
            emitSpy.mockImplementationOnce(() => {
                throw new Error(errorMessage);
            });

            client.register([mockHost]);
            const networkState = await client.getNetworkState();

            expect(networkState.status).toEqual(NetworkStateStatus.Unknown);
        });
    });

    describe("emitEvent", () => {
        it("should emit events from localhost", async () => {
            mockHost.hostname = "127.0.0.1";
            client.register([mockHost]);

            const data = { activeDelegates: ["delegate-one"] };

            client.emitEvent("test-event", data);
            expect(spyEmit).toHaveBeenCalledWith(
                "p2p.internal.emitEvent",
                {
                    data: {
                        body: data,
                        event: "test-event",
                    },
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
                expect.anything(),
            );
        });

        it("should not emit events which are not from localhost", async () => {
            mockHost.hostname = "127.0.0.2";
            client.register([mockHost]);

            const data = { activeDelegates: ["delegate-one"] };
            client.emitEvent("test-event", data);

            expect(logger.error).toHaveBeenCalledWith("emitEvent: unable to find any local hosts.");
        });

        it("should log error if emitting fails", async () => {
            const errorMessage = "Fake Error";
            const emitSpy = jest.spyOn(client as any, "emit");
            emitSpy.mockImplementationOnce(() => {
                throw new Error(errorMessage);
            });
            mockHost.hostname = "127.0.0.1";
            client.register([mockHost]);
            const event = "test-event";

            const data = { activeDelegates: ["delegate-one"] };
            client.emitEvent(event, data);

            expect(logger.error).toHaveBeenCalledWith(
                `Failed to emit "${event}" to "${mockHost.hostname}:${mockHost.port}"`,
            );
        });
    });
});
