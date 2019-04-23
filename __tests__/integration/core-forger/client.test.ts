import "./mocks/core-container";

import "jest-extended";

import { NetworkState, NetworkStateStatus } from "@arkecosystem/core-p2p";
import delay from "delay";
import { Client } from "../../../packages/core-forger/src/client";
import { sampleBlocks } from "./__fixtures__/blocks";

import { MockSocketManager } from "../core-p2p/__support__/mock-socket-server/manager";

jest.setTimeout(30000);

let client;
let socketManager: MockSocketManager;

beforeAll(async () => {
    process.env.CORE_ENV = "test"; // important for socket server setup (testing), see socket-server/index.ts

    socketManager = new MockSocketManager();
    await socketManager.init();

    client = new Client([
        {
            hostname: "127.0.0.1",
            port: 4009,
        },
    ]);

    await delay(1000);
});

afterAll(() => {
    client.hosts.forEach(host => host.socket.destroy());

    socketManager.stopServer();
});

afterEach(async () => socketManager.resetAllMocks());

const mockPeerStatus = {
    success: true,
    height: 1,
    forgingAllowed: true,
    currentSlot: 1,
    header: {},
};

describe("Client", () => {
    it("should accept multiple hosts as constructor parameter", () => {
        const hosts = [
            {
                hostname: "127.0.0.1",
                port: 4000,
            },
            {
                hostname: "127.0.0.2",
                port: 4000,
            },
        ];

        expect(new Client(hosts).hosts).toEqual(hosts);
    });

    it("should broadcast a block without any errors", async () => {
        await socketManager.addMock("p2p.peer.getStatus", mockPeerStatus);
        await socketManager.addMock("p2p.peer.postBlock", {});

        await client.selectHost();

        await expect(client.broadcastBlock(sampleBlocks[0].toJson())).resolves.not.toThrow();
    });

    it("should request the state of the current round to determine if it is time to forge", async () => {
        const expectedResponse = { foo: "bar" };

        await socketManager.addMock("p2p.peer.getStatus", mockPeerStatus);
        await socketManager.addMock("p2p.internal.getCurrentRound", expectedResponse);

        const response = await client.getRound();

        expect(response).toEqual(expectedResponse);
    });

    it("should request unconfirmed transactions from the transaction pool", async () => {
        const expectedResponse = { transactions: [] };
        await socketManager.addMock("p2p.internal.getUnconfirmedTransactions", expectedResponse);

        const response = await client.getTransactions();

        expect(response).toEqual(expectedResponse);
    });

    it("should request the state of the network for quorum", async () => {
        const expectedResponse = new NetworkState(NetworkStateStatus.Test);
        await socketManager.addMock("p2p.internal.getNetworkState", expectedResponse);

        const response = await client.getNetworkState();

        expect(response).toEqual(expectedResponse);
    });

    it("should request a sync with the network", async () => {
        await socketManager.addMock("p2p.peer.getStatus", mockPeerStatus);
        await socketManager.addMock("p2p.internal.syncBlockchain", {});

        const response = await client.syncWithNetwork();

        expect(response).toBeUndefined();
    });
});
