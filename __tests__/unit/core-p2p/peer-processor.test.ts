import { Container, Enums } from "@arkecosystem/core-kernel";

import { PeerProcessor } from "@arkecosystem/core-p2p/src/peer-processor";
import { Peer } from "@arkecosystem/core-p2p/src/peer";

describe("PeerProcessor", () => {
    let peerProcessor: PeerProcessor;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn() };

    const configGet = { disableDiscovery: false, whitelist: ["*"] };
    const configGetRequired = { verifyTimeout: false, maxSameSubnetPeers: 2 };
    const pluginConfiguration = {
        get: (key) => configGet[key],
        getRequired: (key) => configGetRequired[key],
    };

    const eventDispatcher = { listen: jest.fn(), dispatch: jest.fn() };
    const peerCommunicator = { ping: jest.fn() };
    const peerConnector = { disconnect: jest.fn() };
    const peerStorage = {
        hasPendingPeer: jest.fn(),
        getSameSubnetPeers: jest.fn(),
        hasPeer: jest.fn(),
        setPendingPeer: jest.fn(),
        setPeer: jest.fn(),
        forgetPendingPeer: jest.fn(),
    };
    const peerFactory = (ip) => new Peer(ip, 4000);
    const appGet = { [Container.Identifiers.PeerFactory]: peerFactory };
    const app = { get: (key) => appGet[key], resolve: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(pluginConfiguration);
        container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);
        container.bind(Container.Identifiers.PeerCommunicator).toConstantValue(peerCommunicator);
        container.bind(Container.Identifiers.PeerConnector).toConstantValue(peerConnector);
        container.bind(Container.Identifiers.PeerStorage).toConstantValue(peerStorage);
        container.bind(Container.Identifiers.Application).toConstantValue(app);

        container.bind(Container.Identifiers.PeerProcessor).to(PeerProcessor);

        process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA = "true";
    });

    beforeEach(() => {
        peerProcessor = container.get<PeerProcessor>(Container.Identifiers.PeerProcessor);

        jest.resetAllMocks();
    });

    describe("initialize", () => {
        it("should add a listener to Enums.CryptoEvent.MilestoneChanged", () => {
            app.resolve = jest.fn().mockReturnValueOnce({});
            peerProcessor.initialize();

            expect(eventDispatcher.listen).toBeCalledTimes(1);
            expect(eventDispatcher.listen).toBeCalledWith(Enums.CryptoEvent.MilestoneChanged, expect.anything());
        })
    })

    describe("validateAndAcceptPeer", () => {
        it("should accept a new peer if its ip is validated", async () => {
            const peer = new Peer("178.165.55.55", 4000);
            peerStorage.getSameSubnetPeers = jest.fn().mockReturnValueOnce([]);

            await peerProcessor.validateAndAcceptPeer(peer);

            expect(peerStorage.setPendingPeer).toBeCalledTimes(1);
            expect(peerCommunicator.ping).toBeCalledTimes(1);
            expect(peerStorage.setPeer).toBeCalledTimes(1);
        });

        it("should disconnect the peer on any error", async () => {
            const peer = new Peer("178.165.55.55", 4000);
            peerStorage.getSameSubnetPeers = jest.fn().mockReturnValueOnce([]);
            peerCommunicator.ping = jest.fn().mockRejectedValueOnce(new Error("ping threw"));

            await peerProcessor.validateAndAcceptPeer(peer);

            expect(peerStorage.setPendingPeer).toBeCalledTimes(1);
            expect(peerCommunicator.ping).toBeCalledTimes(1);
            expect(peerStorage.setPeer).toBeCalledTimes(0);
            expect(peerConnector.disconnect).toBeCalledTimes(1);
        });

        it("should not do anything if peer is already added", async () => {
            const peer = new Peer("178.165.55.55", 4000);
            peerStorage.getSameSubnetPeers = jest.fn().mockReturnValueOnce([]);
            peerStorage.hasPeer = jest.fn().mockReturnValueOnce(true);

            await peerProcessor.validateAndAcceptPeer(peer);

            expect(peerStorage.setPendingPeer).toBeCalledTimes(0);
            expect(peerCommunicator.ping).toBeCalledTimes(0);
            expect(peerStorage.setPeer).toBeCalledTimes(0);
        });
    });

    describe("validatePeerIp", () => {
        const peer = new Peer("178.165.55.55", 4000);

        it("should return false and log a warning when on disableDiscovery mode", () => {
            configGet.disableDiscovery = true;

            expect(peerProcessor.validatePeerIp(peer)).toBeFalse();
            expect(logger.warning).toBeCalledTimes(1);
            expect(logger.warning).toBeCalledWith(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);

            configGet.disableDiscovery = false;
        });

        it("should return false when peer is not valid", () => {
            const invalidPeer = new Peer("127.0.0.1", 4000); // localhost is invalid
            expect(peerProcessor.validatePeerIp(invalidPeer)).toBeFalse();
        });

        it("should return false when peer is already in pending peers", () => {
            peerStorage.hasPendingPeer = jest.fn().mockReturnValueOnce(true);
            expect(peerProcessor.validatePeerIp(peer)).toBeFalse();
        });

        it("should return false when peer is not whitelisted", () => {
            configGet.whitelist = ["127.0.0.1"];
            expect(peerProcessor.validatePeerIp(peer)).toBeFalse();
            configGet.whitelist = ["*"];
        });

        it("should return false when there are already too many peers on the peer subnet and not in seed mode", () => {
            const sameSubnetPeers = [new Peer("178.165.55.50", 4000), new Peer("178.165.55.51", 4000)];
            peerStorage.getSameSubnetPeers = jest.fn().mockReturnValueOnce(sameSubnetPeers);
            expect(peerProcessor.validatePeerIp(peer)).toBeFalse();
        });

        it("should return true otherwise", () => {
            peerStorage.getSameSubnetPeers = jest.fn().mockReturnValueOnce([]);

            expect(peerProcessor.validatePeerIp(peer)).toBeTrue();
        });
    });
});
