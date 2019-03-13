/* tslint:disable:max-line-length  */
import "./mocks/core-container";

import { slots } from "@arkecosystem/crypto";
import { MockSocketManager } from "./__support__/mock-socket-server/manager";

import { config as localConfig } from "../../../packages/core-p2p/src/config";
import { guard } from "../../../packages/core-p2p/src/court";
import { defaults } from "../../../packages/core-p2p/src/defaults";
import { monitor } from "../../../packages/core-p2p/src/monitor";
import { Peer } from "../../../packages/core-p2p/src/peer";

let peerMock;
let socketManager: MockSocketManager;

beforeAll(async () => {
    process.env.CORE_ENV = "test"; // important for socket server setup (testing), see socket-server/index.ts

    socketManager = new MockSocketManager();
    await socketManager.init();
});

afterAll(async () => {
    peerMock.socket.destroy();
    for (const peer of Object.values(monitor.peers)) {
        peer.socket.destroy();
    }
    socketManager.stopServer();
});

beforeEach(async () => {
    monitor.config = defaults;
    localConfig.init(defaults);
    localConfig.set("port", 4000);

    monitor.guard = guard;
    monitor.guard.init(monitor);
    monitor.guard.config = localConfig;

    peerMock = new Peer("127.0.0.1", 4009);
    peerMock.state.height = 1;
    peerMock.verification = {};
    peerMock.ban = null;
    monitor.peers = { "127.0.0.1": peerMock };
});

describe("Monitor", () => {
    describe("cleanPeers", () => {
        it("should be ok", async () => {
            monitor.peers["0.0.0.11"] = new Peer("0.0.0.11", 4444);
            const previousLength = Object.keys(monitor.peers).length;

            await monitor.cleanPeers(true);

            expect(Object.keys(monitor.peers).length).toBeLessThan(previousLength);
        });
    });

    describe.skip("acceptNewPeer", () => {});

    describe("getPeers", () => {
        it("should be ok", async () => {
            const peers = monitor.getPeers();

            expect(peers).toBeArray();
            expect(peers.length).toBe(1);
        });
    });

    describe("discoverPeers", () => {
        it("should be ok", async () => {
            const mockStatus = {
                success: true,
                height: 1,
                forgingAllowed: true,
                currentSlot: 1,
                header: {},
            };
            await socketManager.addMock("getStatus", mockStatus);

            const getPeersPeerMock = { ip: "1.1.1.1", port: 4000 };
            await socketManager.addMock("getPeers", { peers: [getPeersPeerMock] });

            const mockAcceptNewPeer = jest.spyOn(monitor, "acceptNewPeer").mockImplementationOnce(async () => {});

            await monitor.discoverPeers();

            expect(mockAcceptNewPeer).toHaveBeenCalledTimes(1);
            expect(mockAcceptNewPeer).toHaveBeenCalledWith(getPeersPeerMock, { lessVerbose: true });
        });
    });

    describe("getNetworkHeight", () => {
        it("should get network height as the median value of all peers height", async () => {
            monitor.peers["2.2.2.2"] = { ip: "2.2.2.2", state: { height: 10 } };
            monitor.peers["3.3.3.3"] = { ip: "3.3.3.3", state: { height: 14 } };

            const height = await monitor.getNetworkHeight();
            expect(height).toBe(10);
        });
    });

    describe("getPBFTForgingStatus", () => {
        it("should get PBFT == 1 if all peers are at same height, slot, and with forging allowed", async () => {
            const height = 3;
            const slotNmber = 17;
            jest.spyOn(monitor, "getNetworkHeight").mockReturnValueOnce(height);
            jest.spyOn(slots, "getSlotNumber").mockReturnValueOnce(slotNmber);

            const state = { height, forgingAllowed: true, currentSlot: slotNmber };
            monitor.peers["2.2.2.2"] = { ip: "2.2.2.2", state };
            monitor.peers["3.3.3.3"] = { ip: "3.3.3.3", state };

            const pbftForgingStatus = monitor.getPBFTForgingStatus();

            expect(pbftForgingStatus).toBe(1);
        });

        it("should get PBFT == 0.5 if half the peers are not at network height", async () => {
            const height = 3;
            const slotNmber = 17;
            jest.spyOn(monitor, "getNetworkHeight").mockReturnValueOnce(height);
            jest.spyOn(slots, "getSlotNumber").mockReturnValueOnce(slotNmber);

            const state = { height: height - 1, forgingAllowed: true, currentSlot: slotNmber };
            monitor.peers["2.2.2.2"] = { ip: "2.2.2.2", state };
            monitor.peers["127.0.0.1"] = { ip: "127.0.0.1", state: Object.assign({}, state, { height }) };

            const pbftForgingStatus = monitor.getPBFTForgingStatus();

            expect(pbftForgingStatus).toBe(0.5);
        });
    });

    describe("downloadBlocks", () => {
        it("should be ok", async () => {
            await socketManager.addMock("getBlocks", {
                blocks: [{ height: 1, id: "1" }, { height: 2, id: "2" }],
            });

            const blocks = await monitor.downloadBlocks(1);

            expect(blocks).toBeArray();
            expect(blocks.length).toBe(2);
        });
    });
});
