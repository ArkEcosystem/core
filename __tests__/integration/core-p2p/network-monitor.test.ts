/* tslint:disable:max-line-length  */
import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { slots } from "@arkecosystem/crypto";
import { config as localConfig } from "../../../packages/core-p2p/src/config";
import { defaults } from "../../../packages/core-p2p/src/defaults";
import { Peer } from "../../../packages/core-p2p/src/peer";
import { createPeerService, createStubPeer, stubPeer } from "../../helpers/peers";
import { MockSocketManager } from "./__support__/mock-socket-server/manager";

let socketManager: MockSocketManager;
let storage: P2P.IPeerStorage;
let monitor: P2P.INetworkMonitor;
let connector: P2P.IPeerConnector;
let processor: P2P.IPeerProcessor;

beforeAll(async () => {
    process.env.CORE_ENV = "test"; // important for socket server setup (testing), see socket-server/index.ts

    socketManager = new MockSocketManager();
    await socketManager.init();
});

afterAll(async () => {
    for (const connection of connector.all()) {
        connection.destroy();
    }

    socketManager.stopServer();
});

beforeEach(async () => {
    localConfig.init(defaults);
    localConfig.set("port", 4000);

    ({ connector, monitor, storage, processor } = createPeerService());

    const peer = createStubPeer({
        ip: "127.0.0.1",
        port: 4009,
        state: {
            height: 1,
        },
        verificationResult: {},
    });

    storage.setPeer(peer);

    connector.ensureConnection(peer);
});

describe("NetworkMonitor", () => {
    describe("cleanPeers", () => {
        it("should be ok", async () => {
            storage.setPeer(new Peer("0.0.0.11", 4444));

            const previousLength = storage.getPeers().length;

            await monitor.cleanPeers(true);

            expect(storage.getPeers().length).toBeLessThan(previousLength);
        });
    });

    describe("discoverPeers", () => {
        it("should be ok", async () => {
            await socketManager.addMock("getStatus", {
                success: true,
                height: 1,
                forgingAllowed: true,
                currentSlot: 1,
                header: {},
            });

            const getPeersPeerMock = { ip: "1.1.1.1", port: 4000 };
            await socketManager.addMock("getPeers", { success: true, peers: [getPeersPeerMock] });

            const mockAcceptNewPeer = jest.spyOn(processor, "acceptNewPeer").mockImplementationOnce(jest.fn());
            jest.spyOn(processor, "validatePeer").mockReturnValueOnce(true);

            // @ts-ignore
            monitor.config = { ignoreMinimumNetworkReach: true };

            await monitor.discoverPeers();

            expect(mockAcceptNewPeer).toHaveBeenCalledTimes(1);
            expect(mockAcceptNewPeer).toHaveBeenCalledWith(getPeersPeerMock, { lessVerbose: true });
        });
    });

    describe("getNetworkHeight", () => {
        it("should get network height as the median value of all peers height", async () => {
            storage.setPeer(createStubPeer({ ip: "1.1.1.1", port: 4000, state: { height: 8 } }));
            storage.setPeer(createStubPeer({ ip: "2.2.2.2", port: 4000, state: { height: 16 } }));
            storage.setPeer(createStubPeer({ ip: "3.3.3.3", port: 4000, state: { height: 24 } }));

            expect(await monitor.getNetworkHeight()).toBe(16);
        });
    });

    describe("getPBFTForgingStatus", () => {
        it("should get PBFT == 1 if all peers are at same height, slot, and with forging allowed", async () => {
            const height = 3;
            const slotNmber = 17;
            jest.spyOn(monitor, "getNetworkHeight").mockReturnValueOnce(height);
            jest.spyOn(slots, "getSlotNumber").mockReturnValueOnce(slotNmber);

            const state = { height, forgingAllowed: true, currentSlot: slotNmber };

            storage.setPeer(createStubPeer({ ip: "2.2.2.2", port: 4000, state }));
            storage.setPeer(createStubPeer({ ip: "3.3.3.3", port: 4000, state }));

            const pbftForgingStatus = monitor.getPBFTForgingStatus();

            expect(pbftForgingStatus).toBe(1);
        });

        it("should get PBFT == 0.5 if half the peers are not at network height", async () => {
            const height = 3;
            const slotNmber = 17;
            jest.spyOn(monitor, "getNetworkHeight").mockReturnValueOnce(height);
            jest.spyOn(slots, "getSlotNumber").mockReturnValueOnce(slotNmber);

            const state = { height: height - 1, forgingAllowed: true, currentSlot: slotNmber };

            storage.setPeer(createStubPeer({ ip: "2.2.2.2", port: 4000, state }));
            storage.setPeer(
                createStubPeer({ ip: "127.0.0.1", port: 4000, state: Object.assign({}, state, { height }) }),
            );

            const pbftForgingStatus = monitor.getPBFTForgingStatus();

            expect(pbftForgingStatus).toBe(0.5);
        });
    });
});
