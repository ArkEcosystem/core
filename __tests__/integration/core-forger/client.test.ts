import "./mocks/core-container";

import "jest-extended";

import { NetworkState, NetworkStateStatus } from "@arkecosystem/core-p2p";
import delay from "delay";
import { Client } from "../../../packages/core-forger/src/client";
import { sampleBlocks } from "./__fixtures__/block";

import { MockSocketManager } from "../core-p2p/__support__/mock-socket-server/manager";

jest.setTimeout(30000);

let client;
let socketManager: MockSocketManager;

beforeAll(async () => {
    process.env.CORE_ENV = "test"; // important for socket server setup (testing), see socket-server/index.ts

    socketManager = new MockSocketManager();
    await socketManager.init();

    client = new Client({
        port: 4009,
        ip: "127.0.0.1",
    });
});

afterAll(() => {
    client.hosts.forEach(host => {
        host.socket.destroy();
    });
    socketManager.stopServer();
});

afterEach(async () => socketManager.resetAllMocks());

describe("Client", () => {
    const mockPeerStatus = {
        success: true,
        height: 1,
        forgingAllowed: true,
        currentSlot: 1,
        header: {},
    };

    /*describe("constructor", () => {
        // TODO
        it("accepts 1 or more hosts as parameter", () => {
            expect(new Client(host).hosts).toEqual([host]);

            const hosts = [host, "http://localhost:4000"];

            expect(new Client(hosts).hosts).toEqual(hosts);
        });
    });*/

    describe("broadcast", () => {
        describe("when the host is available", () => {
            it("should be truthy if broadcasts", async () => {
                await socketManager.addMock("p2p.peer.getStatus", mockPeerStatus);
                await socketManager.addMock("p2p.internal.storeBlock", {});

                await client.__chooseHost(1000);

                const wasBroadcasted = await client.broadcast(sampleBlocks[0].toJson());
                expect(wasBroadcasted).toBeTruthy();
            });
        });
    });

    describe("getRound", () => {
        describe("when the host is available", () => {
            it("should be ok", async () => {
                const expectedResponse = { foo: "bar" };

                await socketManager.addMock("p2p.peer.getStatus", mockPeerStatus);
                await socketManager.addMock("p2p.internal.getCurrentRound", { data: expectedResponse });

                const response = await client.getRound();

                expect(response).toEqual(expectedResponse);
            });
        });
    });

    describe("getTransactions", () => {
        describe("when the host is available", () => {
            it("should be ok", async () => {
                const expectedResponse = { transactions: [] };
                await socketManager.addMock("p2p.internal.getUnconfirmedTransactions", { data: expectedResponse });

                const response = await client.getTransactions();

                expect(response).toEqual(expectedResponse);
            });
        });
    });

    describe("getNetworkState", () => {
        describe("when the host is available", () => {
            it("should be ok", async () => {
                const expectedResponse = new NetworkState(NetworkStateStatus.Test);
                await socketManager.addMock("p2p.internal.getNetworkState", { data: expectedResponse });

                const response = await client.getNetworkState();

                expect(response).toEqual(expectedResponse);
            });
        });
    });

    describe("syncCheck", () => {
        it("should induce network sync", async () => {
            await socketManager.addMock("p2p.peer.getStatus", mockPeerStatus);
            await socketManager.addMock("p2p.internal.syncBlockchain", {});

            const response = await client.syncCheck();

            expect(response).toBeUndefined();
        });
    });

    describe("getUsernames", () => {
        it("should fetch usernames", async () => {
            const expectedResponse = { foo: "bar" };
            await socketManager.addMock("p2p.peer.getStatus", mockPeerStatus);
            await socketManager.addMock("p2p.internal.getUsernames", { data: expectedResponse });

            const response = await client.getUsernames();

            expect(response).toEqual(expectedResponse);
        });
    });
});
