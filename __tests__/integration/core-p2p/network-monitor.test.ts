import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { Peer } from "../../../packages/core-p2p/src/peer";
import { createPeerService, createStubPeer } from "../../helpers/peers";
import { MockSocketManager } from "./__support__/mock-socket-server/manager";

let socketManager: MockSocketManager;
let storage: P2P.IPeerStorage;
let monitor: P2P.INetworkMonitor;
let connector: P2P.IPeerConnector;
let processor: P2P.IPeerProcessor;
let communicator: P2P.IPeerCommunicator;

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
    ({ connector, communicator, monitor, storage, processor } = createPeerService());

    const peer = createStubPeer({
        ip: "127.0.0.1",
        port: 4009,
        state: {
            height: 1,
        },
        verificationResult: {},
    });

    storage.setPeer(peer);

    connector.connect(peer);
});

describe("NetworkMonitor", () => {
    describe("cleansePeers", () => {
        it("should be ok", async () => {
            const peer: P2P.IPeer = new Peer("0.0.0.11");
            (peer as any).port = 4444;

            storage.setPeer(peer);

            const previousLength = storage.getPeers().length;

            await monitor.cleansePeers({ fast: true });

            expect(storage.getPeers().length).toBeLessThan(previousLength);
        });
    });

    describe("discoverPeers", () => {
        it("should be ok", async () => {
            await socketManager.addMock("getStatus", {
                height: 1,
                forgingAllowed: true,
                currentSlot: 1,
                header: {},
            });

            const getPeersPeerMock = { ip: "1.2.3.4", port: 4000 };
            jest.spyOn(communicator, "getPeers").mockResolvedValueOnce([getPeersPeerMock]);

            const validateAndAcceptPeer = jest
                .spyOn(processor, "validateAndAcceptPeer")
                .mockImplementationOnce(jest.fn());
            jest.spyOn(processor, "validatePeerIp").mockReturnValueOnce(true);

            // @ts-ignore
            monitor.config = { ignoreMinimumNetworkReach: true };

            await expect(monitor.discoverPeers(true)).resolves.toBeTrue();

            expect(validateAndAcceptPeer).toHaveBeenCalledTimes(1);
            expect(validateAndAcceptPeer).toHaveBeenCalledWith(getPeersPeerMock, { lessVerbose: true });
        });
    });

    describe("getNetworkHeight", () => {
        it("should get network height as the median value of all peers height", async () => {
            storage.setPeer(createStubPeer({ ip: "1.1.1.1", port: 4000, state: { height: 8 } }));
            storage.setPeer(createStubPeer({ ip: "2.2.2.2", port: 4000, state: { height: 16 } }));
            storage.setPeer(createStubPeer({ ip: "3.3.3.3", port: 4000, state: { height: 24 } }));

            expect(monitor.getNetworkHeight()).toBe(16);
        });
    });
});
