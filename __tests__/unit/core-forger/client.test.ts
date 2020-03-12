import "jest-extended";

import { Client } from "@packages/core-forger/src/client";
import { Application, Container } from "@packages/core-kernel";
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

    let mockHosts;
    let client: Client;

    beforeEach(() => {
        client = app.resolve<Client>(Client);
        spySocketOn = jest.fn();
        spySocketDisconnect = jest.fn();
        spyEmit = jest.fn((__, data, cb) => cb(undefined, data));

        mockHosts = [
            {
                socket: {
                    on: spySocketOn,
                    disconnect: spySocketDisconnect,
                    emit: spyEmit,
                    getState: () => "open",
                    OPEN: "open",
                },
                hostname: "mock-1",
            },
            {
                socket: {},
                hostname: "mock-2",
            },
        ];
        // @ts-ignore
        spySocketCluster = jest.spyOn(socketCluster, "create").mockImplementation(() => mockHosts[0].socket);
    });

    describe("register", () => {
        it("should register hosts", async () => {
            const expected = {
                ...mockHosts[0],
                autoReconnectOptions: {
                    initialDelay: 1000,
                    maxDelay: 1000,
                },
                codecEngine: codec,
            };

            client.register([mockHosts[0]]);
            expect(spySocketCluster).toHaveBeenCalledWith(expected);
            expect(client.hosts).toEqual([mockHosts[0]]);
        });

        it("on error the socket should call logger", () => {
            let onErrorCallBack;
            spySocketOn.mockImplementation((...data) => (onErrorCallBack = data[1]));

            client.register(mockHosts);

            const fakeError = { message: "Fake Error" };
            onErrorCallBack(fakeError);

            expect(logger.error).toHaveBeenCalledWith("Fake Error");
        });

        it("should not call logger if the socket hangs up", () => {
            let onErrorCallBack;
            spySocketOn.mockImplementationOnce((...data) => (onErrorCallBack = data[1]));

            client.register(mockHosts);

            const socketHangupError = { message: "Socket hung up" };
            onErrorCallBack(socketHangupError);

            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe("dispose", () => {
        it("should call disconnect on all sockets", () => {
            client.register(mockHosts);
            client.dispose();
            expect(spySocketDisconnect).toHaveBeenCalledTimes(2);
        });

        it("should do nothing if a hosts socket doesn't exist", () => {
            client.register(mockHosts);
            for (const host of mockHosts) {
                delete host.socket;
            }
            client.dispose();
            expect(spySocketDisconnect).not.toHaveBeenCalledWith();
        });
    });

    describe("broadcastBlock", () => {
        it("should log broadcast as debug message", async () => {
            client.register(mockHosts);

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(logger.debug).toHaveBeenCalledWith(
                `Broadcasting block ${forgedBlockWithTransactions.data.height.toLocaleString()} (${
                    forgedBlockWithTransactions.data.id
                }) with ${forgedBlockWithTransactions.data.numberOfTransactions} transactions to ${
                    mockHosts[0].hostname
                }`,
            );
        });

        it("should not broadcast block when there is an issue with socket", async () => {
            client.register(mockHosts);

            mockHosts[0].socket = {};
            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();

            expect(logger.error).toHaveBeenCalledWith(
                `Broadcast block failed: Request to ${mockHosts[0].hostname}:${mockHosts[0].port}<p2p.peer.postBlock> failed, because of 'socket.getState is not a function'.`,
            );
        });

        it("should not broadcast block when there the socket is closed", async () => {
            client.register(mockHosts);

            mockHosts[0].socket = {
                ...mockHosts[0].socket,
                getState: () => "closed",
            };

            mockHosts[1].socket = {
                ...mockHosts[1].socket,
                getState: () => "closed",
            };

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(spyEmit).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalledWith(
                `Broadcast block failed: Request to ${mockHosts[0].hostname}:${
                    mockHosts[0].port
                }<p2p.peer.postBlock> failed, because of 'Peer ${
                    mockHosts[0].hostname
                } socket is not connected. State: ${mockHosts[0].socket.getState()}'.`,
            );
        });

        it("should broadcast valid blocks without error", async () => {
            client.register(mockHosts);

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(spyEmit).toHaveBeenCalledWith("p2p.peer.postBlock", expect.anything(), expect.anything());
            expect(logger.error).not.toHaveBeenCalled();
        });

        it("should not broadcast blocks on socketEmit error", async () => {
            client.register(mockHosts);

            spyEmit.mockImplementation((__, data, cb) => cb("Error", data));

            await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
            expect(logger.error).toHaveBeenCalledWith(
                `Broadcast block failed: Request to ${mockHosts[0].hostname}:${mockHosts[0].port}<p2p.peer.postBlock> failed, because of 'undefined'.`,
            );
        });
    });
});
