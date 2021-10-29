import { Container } from "@arkecosystem/core-kernel";
import { DisconnectInvalidPeers, DisconnectPeer } from "@arkecosystem/core-p2p/src/listeners";
import { Peer } from "@arkecosystem/core-p2p/src/peer";

describe("DisconnectInvalidPeers", () => {
    let disconnectInvalidPeers: DisconnectInvalidPeers;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn() };
    const repository = { getPeers: jest.fn() };
    const app = {
        getTagged: () => ({
            getOptional: () => ["^3.0.0", "^3.0.0-next.0"], // minimumVersions
        }),
    };
    const emitter = { dispatch: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerRepository).toConstantValue(repository);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
        container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(emitter);
    });

    const peers = [
        new Peer("180.177.54.4", 4000),
        new Peer("181.177.54.4", 4000),
        new Peer("182.177.54.4", 4000),
        new Peer("183.177.54.4", 4000),
        new Peer("184.177.54.4", 4000),
    ];
    peers[0].version = "3.0.0.0.0"; // invalid
    peers[1].version = "2.6"; // invalid, below min
    peers[2].version = "3.0.0"; // valid
    peers[3].version = "3.0.0-next.1"; // valid
    peers[4].version = "3.0.1"; // valid
    beforeEach(() => {
        disconnectInvalidPeers = container.resolve<DisconnectInvalidPeers>(DisconnectInvalidPeers);
        repository.getPeers = jest.fn().mockReturnValue(peers);
    });
    afterEach(() => {
        repository.getPeers = jest.fn();
    });

    describe("handle", () => {
        it("should emit 'internal.p2p.disconnectPeer' for invalid version peers", async () => {
            await disconnectInvalidPeers.handle();

            expect(emitter.dispatch).toBeCalledTimes(2); // 2 invalid peers version
        });
    });
});

describe("DisconnectPeer", () => {
    let disconnectPeer: DisconnectPeer;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn() };
    const repository = { forgetPeer: jest.fn() };
    const connector = { disconnect: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerRepository).toConstantValue(repository);
        container.bind(Container.Identifiers.PeerConnector).toConstantValue(connector);
    });

    beforeEach(() => {
        disconnectPeer = container.resolve<DisconnectPeer>(DisconnectPeer);
    });

    describe("handle", () => {
        it("should disconnect the peer provided", async () => {
            const peer = new Peer("187.176.1.1", 4000);
            await disconnectPeer.handle({ data: { peer: peer, port: 4000 } });

            expect(repository.forgetPeer).toBeCalledTimes(1);
            expect(repository.forgetPeer).toBeCalledWith(peer);
            expect(connector.disconnect).toBeCalledTimes(1);
            expect(connector.disconnect).toBeCalledWith(peer);
        });
    });
});
