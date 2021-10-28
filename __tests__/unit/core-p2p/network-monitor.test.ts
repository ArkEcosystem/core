import "jest-extended";

import { Container, Enums, Utils } from "@packages/core-kernel";
import { ChunkCache } from "@packages/core-p2p/src/chunk-cache";
import { NetworkMonitor } from "@packages/core-p2p/src/network-monitor";
import { NetworkState } from "@packages/core-p2p/src/network-state";
import { Peer } from "@packages/core-p2p/src/peer";
import { PeerVerificationResult } from "@packages/core-p2p/src/peer-verifier";
import { Blocks } from "@packages/crypto";
import delay from "delay";
import { cloneDeep } from "lodash";
import path from "path";

jest.mock("@packages/core-kernel", () => {
    const originalModule = jest.requireActual("@packages/core-kernel");
    const utilsModule = jest.requireActual("@packages/core-kernel/src/utils");

    return {
        __esModule: true,
        ...originalModule,
        Utils: {
            ...originalModule.Utils,
            sleep: utilsModule.sleep,
        },
    };
});

jest.setTimeout(60000);

beforeEach(() => {
    jest.resetAllMocks();
});

describe("NetworkMonitor", () => {
    let networkMonitor: NetworkMonitor;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() };
    const config = {
        dns: ["1.1.1.1"],
        ntp: ["time.google.com"],
        skipDiscovery: undefined,
        networkStart: undefined,
        disableDiscovery: undefined,
        verifyTimeout: undefined,
        ignoreMinimumNetworkReach: undefined,
        minimumNetworkReach: undefined,
        whitelist: [],
        remoteAccess: [],
    };
    const pluginConfiguration = { all: () => config };
    const emitter = { dispatch: jest.fn() };
    const communicator = {
        ping: jest.fn(),
        getPeers: jest.fn(),
        getPeerBlocks: jest.fn(),
        postBlock: jest.fn(),
        pingPorts: jest.fn(),
    };
    const repository = { getPeers: jest.fn(), forgetPeer: jest.fn() };

    const triggerService = { call: jest.fn() }; // validateAndAcceptPeer
    const stateStore = { getLastBlock: jest.fn() };
    const blockchain = { getBlockPing: jest.fn(), getLastBlock: jest.fn() };
    const appGet = {
        [Container.Identifiers.TriggerService]: triggerService,
        [Container.Identifiers.StateStore]: stateStore,
        [Container.Identifiers.BlockchainService]: blockchain,
        [Container.Identifiers.LogService]: logger,
    };
    const appConfigPeers = {
        list: [],
        sources: [],
    };
    const app = {
        get: (key) => appGet[key],
        getTagged: () => ({ getOptional: () => 10 }), // minimumNetworkReach in NetworkState analyze
        config: () => appConfigPeers,
        version: () => "3.0.0",
        terminate: jest.fn(),
        log: logger,
    };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerChunkCache).to(ChunkCache).inSingletonScope();
        container.bind(Container.Identifiers.PeerNetworkMonitor).to(NetworkMonitor);
        container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(emitter);
        container.bind(Container.Identifiers.PeerCommunicator).toConstantValue(communicator);
        container.bind(Container.Identifiers.PeerRepository).toConstantValue(repository);
        container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(pluginConfiguration);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
    });

    beforeEach(() => {
        networkMonitor = container.get<NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor);
        networkMonitor.initialize();

        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe.each([[true], [false]])("boot", (dnsAndNtpFail) => {
        beforeEach(() => {
            if (dnsAndNtpFail) {
                config.ntp = ["nontp.notworking.com"];
                config.dns = ["nodns.notworking.com"];
            }
        });
        afterEach(() => {
            config.dns = ["1.1.1.1"];
            config.ntp = ["time.google.com"];
        });

        describe("when peer discovery is disabled", () => {
            beforeEach(() => {
                config.skipDiscovery = true;
            });
            afterEach(() => {
                config.skipDiscovery = false;
                appConfigPeers.list = [];
                appConfigPeers.sources = [];
            });

            it("should populate peers from seed peers config by calling validateAndAcceptPeer", async () => {
                appConfigPeers.list = [
                    { ip: "187.177.54.44", port: 4000 },
                    { ip: "188.177.54.44", port: 4000 },
                    { ip: "189.177.54.44", port: 4000 },
                ];
                await networkMonitor.boot();

                expect(triggerService.call).toBeCalledTimes(appConfigPeers.list.length); // validateAndAcceptPeer for each peer
                for (const peer of appConfigPeers.list) {
                    expect(triggerService.call).toBeCalledWith("validateAndAcceptPeer", {
                        peer: expect.objectContaining(peer),
                        options: { seed: true, lessVerbose: true },
                    });
                }
            });

            it("should populate peers from URL config by calling validateAndAcceptPeer", async () => {
                appConfigPeers.sources = ["http://peers.someurl.com"];

                const peers = [
                    { ip: "187.177.54.44", port: 4000 },
                    { ip: "188.177.54.44", port: 4000 },
                    { ip: "189.177.54.44", port: 4000 },
                    { ip: "190.177.54.44", port: 4000 },
                    { ip: "191.177.54.44", port: 4000 },
                ];
                jest.spyOn(Utils.http, "get").mockResolvedValueOnce({ data: peers } as Utils.HttpResponse);

                await networkMonitor.boot();

                expect(triggerService.call).toBeCalledTimes(peers.length); // for each peer validateAndAcceptPeer is called
                for (const peer of peers) {
                    expect(triggerService.call).toBeCalledWith("validateAndAcceptPeer", {
                        peer: expect.objectContaining(peer),
                        options: { seed: true, lessVerbose: true },
                    });
                }
            });

            it("should populate peers from URL config by calling validateAndAcceptPeer, when body is string", async () => {
                appConfigPeers.sources = ["http://peers.someurl.com"];

                const peers = [
                    { ip: "187.177.54.44", port: 4000 },
                    { ip: "188.177.54.44", port: 4000 },
                    { ip: "189.177.54.44", port: 4000 },
                    { ip: "190.177.54.44", port: 4000 },
                    { ip: "191.177.54.44", port: 4000 },
                ];
                jest.spyOn(Utils.http, "get").mockResolvedValueOnce({
                    data: JSON.stringify(peers),
                } as Utils.HttpResponse);

                await networkMonitor.boot();

                expect(triggerService.call).toBeCalledTimes(peers.length); // for each peer validateAndAcceptPeer is called
                for (const peer of peers) {
                    expect(triggerService.call).toBeCalledWith("validateAndAcceptPeer", {
                        peer: expect.objectContaining(peer),
                        options: { seed: true, lessVerbose: true },
                    });
                }
            });

            it("should handle as empty array if appConfigPeers.sources is undefined", async () => {
                // @ts-ignore
                appConfigPeers.sources = undefined;

                await networkMonitor.boot();

                expect(triggerService.call).toBeCalledTimes(0); // for each peer validateAndAcceptPeer is called
            });

            it("should populate peers only once if same peer is in list and sources", async () => {
                appConfigPeers.sources = ["http://peers.someurl.com"];

                const peers = [{ ip: "187.177.54.44", port: 4000 }];

                appConfigPeers.list = [{ ip: "187.177.54.44", port: 4000 }];

                jest.spyOn(Utils.http, "get").mockResolvedValueOnce({ data: peers } as Utils.HttpResponse);

                await networkMonitor.boot();

                expect(triggerService.call).toBeCalledTimes(peers.length); // for each peer validateAndAcceptPeer is called
                for (const peer of peers) {
                    expect(triggerService.call).toBeCalledWith("validateAndAcceptPeer", {
                        peer: expect.objectContaining(peer),
                        options: { seed: true, lessVerbose: true },
                    });
                }
            });

            it("should populate peers from file by calling validateAndAcceptPeer", async () => {
                appConfigPeers.sources = [path.resolve(__dirname, "fixtures", "peers.json")];

                await networkMonitor.boot();

                const peers = require("./fixtures/peers.json");
                expect(triggerService.call).toBeCalledTimes(peers.length); // validateAndAcceptPeer for each peer in peers.json
                for (const peer of peers) {
                    expect(triggerService.call).toBeCalledWith("validateAndAcceptPeer", {
                        peer: expect.objectContaining(peer),
                        options: { seed: true, lessVerbose: true },
                    });
                }
            });
        });

        describe("when peer discovery is enabled", () => {
            beforeEach(() => {
                process.env.NODE_ENV = "test";
                config.skipDiscovery = false;
            });
            afterEach(() => {
                delete process.env.NODE_ENV;
            });

            it("should discover peers from seed peers (calling updateNetworkStatus) and log the peers discovered by version", async () => {
                const spyUpdateNetworkStatus = jest.spyOn(networkMonitor, "updateNetworkStatus");
                const peers = [
                    { ip: "187.177.54.44", port: 4000, version: "3.0.0" },
                    { ip: "188.177.54.44", port: 4000, version: "3.0.0" },
                    { ip: "189.177.54.44", port: 4000, version: "3.0.1" },
                    { ip: "190.177.54.44", port: 4000, version: "3.0.2" },
                    { ip: "191.177.54.44", port: 4000, version: "3.0.2" },
                ];
                repository.getPeers = jest.fn().mockReturnValueOnce(peers);

                await networkMonitor.boot();

                expect(spyUpdateNetworkStatus).toBeCalledTimes(1);
                expect(spyUpdateNetworkStatus).toBeCalledWith(true);

                expect(logger.info).toBeCalledWith("Discovered 2 peers with v3.0.0.");
                expect(logger.info).toBeCalledWith("Discovered 1 peer with v3.0.1.");
                expect(logger.info).toBeCalledWith("Discovered 2 peers with v3.0.2.");
            });
        });
    });

    describe("updateNetworkStatus", () => {
        describe("when process.env.NODE_ENV === 'test'", () => {
            beforeEach(() => {
                process.env.NODE_ENV = "test";
            });
            afterEach(() => {
                delete process.env.NODE_ENV;
            });

            it("should not do anything", async () => {
                const spyDiscoverPeers = jest.spyOn(networkMonitor, "discoverPeers");

                await networkMonitor.updateNetworkStatus();

                expect(spyDiscoverPeers).toBeCalledTimes(0);
                expect(logger.warning).toBeCalledTimes(0);
            });
        });

        describe("when in 'network start' mode", () => {
            beforeEach(() => {
                delete process.env.NODE_ENV;
                config.networkStart = true;
            });
            afterEach(() => {
                config.networkStart = undefined;
            });

            it("should set coldStart to true and discover peers", async () => {
                const spyDiscoverPeers = jest.spyOn(networkMonitor, "discoverPeers").mockResolvedValue(false);
                // @ts-ignore
                const spyHasMinimumPeers = jest.spyOn(networkMonitor, "hasMinimumPeers").mockReturnValue(true);
                expect(networkMonitor.isColdStart()).toBeFalse();

                await networkMonitor.updateNetworkStatus();

                expect(networkMonitor.isColdStart()).toBeTrue();
                expect(spyDiscoverPeers).toBeCalledTimes(1);
                expect(spyHasMinimumPeers).toBeCalledTimes(1);
            });
        });

        describe("when in 'disable discovery' mode", () => {
            beforeEach(() => {
                config.disableDiscovery = true;
            });
            afterEach(() => {
                config.disableDiscovery = undefined;
            });

            it("should log a warning message and not discover peers", async () => {
                const spyDiscoverPeers = jest.spyOn(networkMonitor, "discoverPeers");
                await networkMonitor.updateNetworkStatus();

                expect(logger.warning).toBeCalledWith(
                    "Skipped peer discovery because the relay is in non-discovery mode.",
                );
                expect(spyDiscoverPeers).toBeCalledTimes(0);
            });
        });

        it("should discover new peers from existing", async () => {
            repository.getPeers.mockReturnValue([]);

            const spyDiscoverPeers = jest.spyOn(networkMonitor, "discoverPeers");
            await networkMonitor.updateNetworkStatus();

            expect(spyDiscoverPeers).toBeCalledTimes(1);
        });

        it("should log an error when discovering new peers fails", async () => {
            repository.getPeers.mockReturnValue([]);
            const spyDiscoverPeers = jest.spyOn(networkMonitor, "discoverPeers");
            const errorMessage = "failed discovering peers";
            spyDiscoverPeers.mockRejectedValueOnce(new Error(errorMessage));

            await networkMonitor.updateNetworkStatus();

            expect(spyDiscoverPeers).toBeCalledTimes(1);
            expect(logger.error).toBeCalledTimes(1);
            expect(logger.error).toBeCalledWith(`Network Status: ${errorMessage}`);
        });

        describe("when we are below minimum peers", () => {
            it("should fall back to seed peers when after discovering we are below minimum peers", async () => {
                config.minimumNetworkReach = 5;
                repository.getPeers.mockReturnValue([]);

                await networkMonitor.updateNetworkStatus();

                expect(logger.info).toBeCalledWith("Couldn't find enough peers. Falling back to seed peers.");
            });

            it("should not fall back to seed peers when config.ignoreMinimumNetworkReach", async () => {
                config.minimumNetworkReach = 5;
                config.ignoreMinimumNetworkReach = true;
                repository.getPeers.mockReturnValue([]);

                await networkMonitor.updateNetworkStatus();

                expect(logger.info).not.toBeCalledWith("Couldn't find enough peers. Falling back to seed peers.");
            });
        });

        it("should schedule the next updateNetworkStatus only once", async () => {
            repository.getPeers.mockReturnValue([]);

            let sleeping = true;
            const mockSleep = async () => {
                while (sleeping) {
                    await delay(10);
                }
            };
            const spySleep = jest.spyOn(Utils, "sleep").mockImplementationOnce(mockSleep);
            await networkMonitor.updateNetworkStatus();

            expect(spySleep).toBeCalledTimes(1);

            await networkMonitor.updateNetworkStatus();
            expect(spySleep).toBeCalledTimes(1);

            sleeping = false;
            await delay(20); // give time to mockSleep to end and scheduleUpdateNetworkStatus to finish

            await networkMonitor.updateNetworkStatus();

            expect(spySleep).toBeCalledTimes(2); // because no more pending nextUpdateNetworkStatusScheduled
        });
    });

    describe("cleansePeers", () => {
        const peers = [
            new Peer("187.177.54.44", 4000),
            new Peer("188.177.54.44", 4000),
            new Peer("189.177.54.44", 4000),
            new Peer("190.177.54.44", 4000),
            new Peer("191.177.54.44", 4000),
        ];
        beforeEach(() => {
            repository.getPeers = jest.fn().mockReturnValue(peers);
        });
        afterEach(() => {
            jest.clearAllMocks();
            repository.getPeers = jest.fn();
        });

        it("should ping every peer when the peers length is <= <peerCount>", async () => {
            await networkMonitor.cleansePeers({ peerCount: 5 });

            expect(communicator.ping).toBeCalledTimes(peers.length);
            for (const peer of peers) {
                expect(communicator.ping).toBeCalledWith(peer, config.verifyTimeout, expect.anything());
            }
        });

        it("should ping every peer when the peers length is <= <peerCount> - when initializing is false", async () => {
            // @ts-ignore
            networkMonitor.initializing = false;

            await networkMonitor.cleansePeers({ peerCount: 5 });

            expect(communicator.ping).toBeCalledTimes(peers.length);
            for (const peer of peers) {
                expect(communicator.ping).toBeCalledWith(peer, config.verifyTimeout, expect.anything());
            }
        });

        it("should ping a max of <peerCount> peers when the peers length is above <peerCount>", async () => {
            await networkMonitor.cleansePeers({ peerCount: 2 });

            expect(communicator.ping).toBeCalledTimes(2);
        });

        it("should dispatch 'p2p.internal.disconnectPeer', PeerEvent.Removed, and log the error when ping fails for a peer", async () => {
            communicator.ping.mockRejectedValueOnce(new Error("Timeout"));
            await networkMonitor.cleansePeers({ peerCount: 5 });

            expect(communicator.ping).toBeCalledTimes(peers.length);
            expect(emitter.dispatch).toBeCalledTimes(2); // 1 for disconnecting peer + 1 for peer removed event
            expect(emitter.dispatch).toBeCalledWith(Enums.PeerEvent.Disconnect, { peer: expect.toBeOneOf(peers) });
            expect(emitter.dispatch).toBeCalledWith(Enums.PeerEvent.Removed, expect.toBeOneOf(peers));
        });

        it("should log the responsive peers count and the median network height when initializing", async () => {
            communicator.ping.mockRejectedValueOnce(new Error("Timeout"));
            await networkMonitor.cleansePeers({ peerCount: 5 });

            expect(communicator.ping).toBeCalledTimes(peers.length);
            expect(logger.info).toBeCalledWith("4 of 5 peers on the network are responsive");
            expect(logger.info).toBeCalledWith("Median Network Height: 0"); // the peers have no height
        });
    });

    describe("discoverPeers", () => {
        const peers = [
            new Peer("180.177.54.4", 4000),
            new Peer("181.177.54.4", 4000),
            new Peer("182.177.54.4", 4000),
            new Peer("183.177.54.4", 4000),
            new Peer("184.177.54.4", 4000),
            new Peer("185.177.54.4", 4000),
            new Peer("186.177.54.4", 4000),
            new Peer("187.177.54.4", 4000),
            new Peer("188.177.54.4", 4000),
            new Peer("189.177.54.4", 4000),
        ];
        beforeEach(() => {
            repository.getPeers = jest.fn().mockReturnValue(peers);
        });
        afterEach(() => {
            repository.getPeers = jest.fn();
        });

        it("should get peers from 8 of our peers, and add them to our peers", async () => {
            // mocking a timeout for the first peer, should be fine
            communicator.getPeers.mockRejectedValueOnce(new Error("timeout"));
            // mocking different getPeers return for the other peers in storage
            for (let i = 1, peer = peers[1]; i < peers.length; i++, peer = peers[i]) {
                communicator.getPeers.mockResolvedValueOnce([
                    { ip: `${peer.ip}1${i}`, port: peer.port },
                    { ip: `${peer.ip}2${i}`, port: peer.port },
                    { ip: `${peer.ip}3${i}`, port: peer.port },
                    { ip: `${peer.ip}4${i}`, port: peer.port },
                ]);
            }
            await networkMonitor.discoverPeers();

            expect(communicator.getPeers).toBeCalledTimes(8);
            expect(triggerService.call).toBeCalledTimes(7 * 4); // validateAndAcceptPeer for each peer fetched from the 7 peers
        });

        describe("when not in pingAll mode + we have more than minimum peers + we have more than 75% of the peers fetched", () => {
            it("should not add the peers fetched", async () => {
                // mocking different getPeers return for each peer in storage
                for (let i = 0, peer = peers[0]; i < peers.length; i++, peer = peers[i]) {
                    communicator.getPeers.mockResolvedValueOnce([{ ip: `${peer.ip}1${i}`, port: peer.port }]);
                }
                config.minimumNetworkReach = 5;
                await networkMonitor.discoverPeers();

                expect(communicator.getPeers).toBeCalledTimes(8);
                expect(triggerService.call).toBeCalledTimes(0);
            });
        });
    });

    describe("completeColdStart", () => {
        beforeEach(() => {
            config.networkStart = true;
        });
        afterEach(() => {
            config.networkStart = undefined;
        });

        it("should set coldStart to false", async () => {
            await networkMonitor.updateNetworkStatus(); // setting cold start to true

            expect(networkMonitor.isColdStart()).toBeTrue();

            networkMonitor.completeColdStart();
            expect(networkMonitor.isColdStart()).toBeFalse();
        });
    });

    describe("getNetworkHeight", () => {
        it.each([
            [6, [5, 6, 6, 6, 7, 8]],
            [79, [34, 78, 79, 79, 79, 90]],
        ])("should return the median height from our peers", (expectedNetworkHeight, peersHeights) => {
            const peers = [];
            for (let i = 0; i < peersHeights.length; i++) {
                const peer = new Peer(`188.185.1.${i}`, 4000);
                peer.state.height = peersHeights[i];
                peers.push(peer);
            }
            repository.getPeers = jest.fn().mockReturnValue(peers);

            expect(networkMonitor.getNetworkHeight()).toBe(expectedNetworkHeight);

            repository.getPeers = jest.fn();
        });
    });

    describe("getNetworkState", () => {
        beforeEach(() => {
            process.env.CORE_ENV = "test"; // for NetworkState analyze
            repository.getPeers = jest.fn().mockReturnValue([]);
        });
        afterEach(() => {
            delete process.env.CORE_ENV;
            repository.getPeers = jest.fn();
        });

        const block = {
            data: {
                id: "17882607875259085966",
                version: 0,
                timestamp: 46583330,
                height: 2,
                reward: Utils.BigNumber.make("0"),
                previousBlock: "17184958558311101492",
                numberOfTransactions: 0,
                totalAmount: Utils.BigNumber.make("0"),
                totalFee: Utils.BigNumber.make("0"),
                payloadLength: 0,
                payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
                blockSignature:
                    "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
            },
            transactions: [],
        } as Blocks.Block;

        it("should call cleansePeers with {fast, forcePing} and return network state from NetworkState.analyze", async () => {
            const spyCleansePeers = jest.spyOn(networkMonitor, "cleansePeers");
            blockchain.getLastBlock = jest.fn().mockReturnValueOnce(block);

            const networkState = await networkMonitor.getNetworkState();

            expect(networkState).toBeInstanceOf(NetworkState);
            expect(spyCleansePeers).toBeCalledTimes(1);
            expect(spyCleansePeers).toBeCalledWith({ fast: true, forcePing: true });
        });
    });

    describe("refreshPeersAfterFork", () => {
        beforeEach(() => {
            repository.getPeers = jest.fn().mockReturnValue([]);
        });
        afterEach(() => {
            repository.getPeers = jest.fn();
        });

        it("should call cleansePeers with {forcePing}", async () => {
            const spyCleansePeers = jest.spyOn(networkMonitor, "cleansePeers");

            await networkMonitor.refreshPeersAfterFork();

            expect(spyCleansePeers).toBeCalledTimes(1);
            expect(spyCleansePeers).toBeCalledWith({ forcePing: true });
        });
    });

    describe("checkNetworkHealth", () => {
        it("should not rollback when there are no verified peers", async () => {
            const peers = [
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
            ];

            try {
                repository.getPeers.mockReturnValue(peers);

                const networkStatus = await networkMonitor.checkNetworkHealth();
                expect(networkStatus).toEqual({ forked: false });
            } finally {
                repository.getPeers.mockReset();
            }
        });

        it("should rollback ignoring peers how are below common height", async () => {
            //                      105 (4 peers)
            //                     /
            // 90 (3 peers) ... 100 ... 103 (2 peers and us)

            const lastBlock = { data: { height: 103 } };

            const peers = [
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
            ];

            peers[0].verificationResult = new PeerVerificationResult(103, 90, 90);
            peers[1].verificationResult = new PeerVerificationResult(103, 90, 90);
            peers[2].verificationResult = new PeerVerificationResult(103, 90, 90);

            peers[3].verificationResult = new PeerVerificationResult(103, 105, 100);
            peers[4].verificationResult = new PeerVerificationResult(103, 105, 100);
            peers[5].verificationResult = new PeerVerificationResult(103, 105, 100);
            peers[6].verificationResult = new PeerVerificationResult(103, 105, 100);

            peers[7].verificationResult = new PeerVerificationResult(103, 103, 103);
            peers[8].verificationResult = new PeerVerificationResult(103, 103, 103);

            try {
                repository.getPeers.mockReturnValue(peers);
                stateStore.getLastBlock.mockReturnValue(lastBlock);

                const networkStatus = await networkMonitor.checkNetworkHealth();
                expect(networkStatus).toEqual({ forked: true, blocksToRollback: 3 });
            } finally {
                repository.getPeers.mockReset();
                stateStore.getLastBlock.mockReset();
            }
        });

        it("should rollback ignoring peers how are at common height", async () => {
            //     105 (4 peers)
            //    /
            // 100 (3 peers) ... 103 (2 peers and us)

            const lastBlock = { data: { height: 103 } };

            const peers = [
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
            ];

            peers[0].verificationResult = new PeerVerificationResult(103, 100, 100);
            peers[1].verificationResult = new PeerVerificationResult(103, 100, 100);
            peers[2].verificationResult = new PeerVerificationResult(103, 100, 100);

            peers[3].verificationResult = new PeerVerificationResult(103, 105, 100);
            peers[4].verificationResult = new PeerVerificationResult(103, 105, 100);
            peers[5].verificationResult = new PeerVerificationResult(103, 105, 100);
            peers[6].verificationResult = new PeerVerificationResult(103, 105, 100);

            peers[7].verificationResult = new PeerVerificationResult(103, 103, 103);
            peers[8].verificationResult = new PeerVerificationResult(103, 103, 103);

            try {
                repository.getPeers.mockReturnValue(peers);
                stateStore.getLastBlock.mockReturnValue(lastBlock);

                const networkStatus = await networkMonitor.checkNetworkHealth();
                expect(networkStatus).toEqual({ forked: true, blocksToRollback: 3 });
            } finally {
                repository.getPeers.mockReset();
                stateStore.getLastBlock.mockReset();
            }
        });

        it("should not rollback although most peers are forked", async () => {
            //    47 (1 peer)    47 (3 peers)   47 (3 peers)
            //   /              /              /
            // 12 ........... 31 ........... 35 ... 43 (3 peers and us)

            const lastBlock = { data: { height: 103 } };

            const peers = [
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
                new Peer("180.177.54.4", 4000),
            ];

            peers[0].verificationResult = new PeerVerificationResult(43, 47, 12);

            peers[1].verificationResult = new PeerVerificationResult(43, 47, 31);
            peers[2].verificationResult = new PeerVerificationResult(43, 47, 31);
            peers[3].verificationResult = new PeerVerificationResult(43, 47, 31);

            peers[4].verificationResult = new PeerVerificationResult(43, 47, 35);
            peers[5].verificationResult = new PeerVerificationResult(43, 47, 35);
            peers[6].verificationResult = new PeerVerificationResult(43, 47, 35);

            peers[7].verificationResult = new PeerVerificationResult(43, 47, 43);
            peers[8].verificationResult = new PeerVerificationResult(43, 47, 43);
            peers[9].verificationResult = new PeerVerificationResult(43, 47, 43);

            try {
                repository.getPeers.mockReturnValue(peers);
                stateStore.getLastBlock.mockReturnValue(lastBlock);

                const networkStatus = await networkMonitor.checkNetworkHealth();
                expect(networkStatus).toEqual({ forked: false });
            } finally {
                repository.getPeers.mockReset();
                stateStore.getLastBlock.mockReset();
            }
        });
    });

    describe("downloadBlocksFromHeight", () => {
        afterEach(() => {
            communicator.getPeerBlocks = jest.fn();
            repository.getPeers = jest.fn();
        });

        const downloadChunkSize = 400;
        const maxParallelDownloads = 25;

        const baseHeight = 50000;

        const expectedBlocksFromHeight = (height) => {
            const blocks = [];
            for (let i = 0; i < maxParallelDownloads * downloadChunkSize; i++) {
                blocks.push({ height: height + 1 + i });
            }
            return blocks;
        };

        const mockedGetPeerBlocks = (peer, { fromBlockHeight }) => {
            if (fromBlockHeight + 1 === baseHeight) {
                throw new Error(`Cannot download blocks, deliberate error`);
            }

            return expectedBlocksFromHeight(fromBlockHeight).slice(0, downloadChunkSize);
        };

        it("should return empty array and log an error when we have zero peer", async () => {
            repository.getPeers = jest.fn().mockReturnValue([]);

            expect(await networkMonitor.downloadBlocksFromHeight(1)).toEqual([]);
            expect(logger.error).toBeCalledTimes(1);
            expect(logger.error).toBeCalledWith("Could not download blocks: we have 0 peers");
        });

        it("should return empty array and log an error when all our peers are forked", async () => {
            const peer = new Peer("1.1.1.1", 4000);
            peer.state = { height: 4, currentSlot: 4, forgingAllowed: true, header: {} };
            peer.verificationResult = new PeerVerificationResult(3, 4, 2);
            repository.getPeers = jest.fn().mockReturnValue([peer]);

            expect(await networkMonitor.downloadBlocksFromHeight(1, maxParallelDownloads)).toEqual([]);
            expect(logger.error).toBeCalledTimes(1);
            expect(logger.error).toBeCalledWith(
                "Could not download blocks: We have 1 peer(s) but all of them are on a different chain than us",
            );
        });

        it("should download blocks from 1 peer", async () => {
            const mockBlock = { id: "123456" };

            communicator.getPeerBlocks = jest.fn().mockReturnValue([mockBlock]);

            const peer = new Peer("1.1.1.1", 4000);
            peer.state = { height: 2, currentSlot: 2, forgingAllowed: true, header: {} };
            peer.verificationResult = { forked: false, hisHeight: 2, myHeight: 2, highestCommonHeight: 2 };
            repository.getPeers = jest.fn().mockReturnValue([peer]);

            expect(await networkMonitor.downloadBlocksFromHeight(1, maxParallelDownloads)).toEqual([mockBlock]);
        });

        it("should download blocks from 1 peer - peer returns zero blocks", async () => {
            communicator.getPeerBlocks = jest.fn().mockReturnValue([]);

            const peer = new Peer("1.1.1.1", 4000);
            peer.state = { height: 2, currentSlot: 2, forgingAllowed: true, header: {} };
            peer.verificationResult = { forked: false, hisHeight: 2, myHeight: 2, highestCommonHeight: 2 };
            repository.getPeers = jest.fn().mockReturnValue([peer]);

            expect(await networkMonitor.downloadBlocksFromHeight(1, maxParallelDownloads)).toEqual([]);
        });

        it("should download blocks in parallel from N peers max", async () => {
            communicator.getPeerBlocks = jest.fn().mockImplementation(mockedGetPeerBlocks);

            const peers = [];
            for (let i = 0; i < maxParallelDownloads + 5; i++) {
                const peer = new Peer(`1.1.1.${i}`, 4000);
                peer.state = { height: 12500, currentSlot: 2, forgingAllowed: true, header: {} };
                peer.verificationResult = { forked: false, hisHeight: 2, myHeight: 2, highestCommonHeight: 2 };

                peers.push(peer);
            }
            repository.getPeers = jest.fn().mockReturnValue(peers);

            const fromHeight = 1;

            const downloadedBlocks = await networkMonitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);
            const expectedBlocks = expectedBlocksFromHeight(fromHeight);

            expect(downloadedBlocks).toEqual(expectedBlocks);
        });

        it("should download blocks in parallel from all peers if less than N peers", async () => {
            communicator.getPeerBlocks = jest.fn().mockImplementation(mockedGetPeerBlocks);

            const numPeers = maxParallelDownloads - 7;

            const peers = [];
            for (let i = 0; i < numPeers; i++) {
                const peer = new Peer(`1.1.1.${i}`, 4000);
                peer.state = { height: 12500, currentSlot: 2, forgingAllowed: true, header: {} };
                peer.verificationResult = { forked: false, hisHeight: 2, myHeight: 2, highestCommonHeight: 2 };

                peers.push(peer);
            }
            repository.getPeers = jest.fn().mockReturnValue(peers);

            const fromHeight = 1;

            const downloadedBlocks = await networkMonitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);
            const expectedBlocks = expectedBlocksFromHeight(fromHeight).slice(0, numPeers * downloadChunkSize);

            expect(downloadedBlocks).toEqual(expectedBlocks);
        });

        it("should handle when getPeerBlocks throws", async () => {
            const mockFn = jest.fn().mockImplementation(mockedGetPeerBlocks);
            communicator.getPeerBlocks = mockFn;

            const numPeers = 5;

            const peers = [];
            for (let i = 0; i < numPeers; i++) {
                const peer = new Peer(`1.1.1.${i}`, 4000);
                peer.state = {
                    height: baseHeight + numPeers * downloadChunkSize,
                    currentSlot: 2,
                    forgingAllowed: true,
                    header: {},
                };
                peer.verificationResult = { forked: false, hisHeight: 2, myHeight: 2, highestCommonHeight: 2 };

                peers.push(peer);
            }
            repository.getPeers = jest.fn().mockReturnValue(peers);

            const chunksToDownloadBeforeThrow = 2;
            let fromHeight = baseHeight - 1 - chunksToDownloadBeforeThrow * downloadChunkSize;

            let downloadedBlocks = await networkMonitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);
            let expectedBlocks = expectedBlocksFromHeight(fromHeight).slice(
                0,
                chunksToDownloadBeforeThrow * downloadChunkSize,
            );

            expect(downloadedBlocks).toEqual(expectedBlocks);

            // when downloading the chunk triggering the throw, it will try to download from all the other peers
            // (so it will try (numPeers - 1) more times)
            expect(mockFn.mock.calls.length).toEqual(numPeers + (numPeers - 1));
            for (let i = 0; i < numPeers; i++) {
                if (i >= chunksToDownloadBeforeThrow && i < chunksToDownloadBeforeThrow + numPeers) {
                    expect(mockFn.mock.calls[i][1].fromBlockHeight).toEqual(
                        fromHeight + chunksToDownloadBeforeThrow * downloadChunkSize,
                    );
                } else {
                    expect(mockFn.mock.calls[i][1].fromBlockHeight).toEqual(fromHeight + i * downloadChunkSize);
                }
            }

            // See that the downloaded higher 2 chunks would be returned from the cache.

            mockFn.mock.calls = [];

            fromHeight = baseHeight - 1 + downloadChunkSize;

            downloadedBlocks = await networkMonitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);
            expectedBlocks = expectedBlocksFromHeight(fromHeight).slice(0, numPeers * downloadChunkSize);

            expect(downloadedBlocks).toEqual(expectedBlocks);

            const numFailedChunks = 1;
            const numCachedChunks = numPeers - chunksToDownloadBeforeThrow - numFailedChunks;

            expect(mockFn.mock.calls.length).toEqual(numPeers - numCachedChunks);
            for (let i = 0; i < numPeers - numCachedChunks; i++) {
                expect(mockFn.mock.calls[i][1].fromBlockHeight).toEqual(
                    fromHeight + (i + numCachedChunks) * downloadChunkSize,
                );
            }
        });

        it("should handle when getPeerBlocks always throws", async () => {
            communicator.getPeerBlocks = jest.fn().mockRejectedValue("always throwing");

            const numPeers = 5;
            const baseHeight = 10000;

            const peers = [];
            for (let i = 0; i < numPeers; i++) {
                const peer = new Peer(`1.1.1.${i}`, 4000);
                peer.state = {
                    height: baseHeight + numPeers * downloadChunkSize,
                    currentSlot: 2,
                    forgingAllowed: true,
                    header: {},
                };
                peer.verificationResult = { forked: false, hisHeight: 2, myHeight: 2, highestCommonHeight: 2 };

                peers.push(peer);
            }
            repository.getPeers = jest.fn().mockReturnValue(peers);

            const chunksToDownload = 2;
            const fromHeight = baseHeight - 1 - chunksToDownload * downloadChunkSize;

            const downloadedBlocks = await networkMonitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);

            expect(downloadedBlocks).toEqual([]);
        });

        it("should still download blocks from 1 peer if network height === our height", async () => {
            const mockBlock = { id: "123456" };

            communicator.getPeerBlocks = jest.fn().mockReturnValue([mockBlock]);

            const peer = new Peer("1.1.1.1", 4000);
            peer.state = { height: 20, currentSlot: 2, forgingAllowed: true, header: {} };
            peer.verificationResult = { forked: false, hisHeight: 20, myHeight: 20, highestCommonHeight: 20 };
            repository.getPeers = jest.fn().mockReturnValue([peer]);

            expect(await networkMonitor.downloadBlocksFromHeight(20, maxParallelDownloads)).toEqual([mockBlock]);
        });

        it("should reduce download block chunk size after receiving no block", async () => {
            const chunkCache = container.get<ChunkCache>(Container.Identifiers.PeerChunkCache);
            chunkCache.has = jest.fn().mockReturnValue(false);

            communicator.getPeerBlocks = jest.fn().mockReturnValue([]);

            const numPeers = maxParallelDownloads;
            const peers = [];
            for (let i = 0; i < maxParallelDownloads; i++) {
                const peer = new Peer(`1.1.1.${i}`, 4000);
                peer.state = { height: 1, currentSlot: 1, forgingAllowed: true, header: {} };
                peer.state = {
                    height: numPeers * downloadChunkSize,
                    currentSlot: 2,
                    forgingAllowed: true,
                    header: {},
                };
                peer.verificationResult = { forked: false, hisHeight: 1, myHeight: 1, highestCommonHeight: 1 };
                peers.push(peer);
            }
            repository.getPeers = jest.fn().mockReturnValue(peers);

            const fromHeight = 1;

            // first step, peers won't return any block: chunk size should be reduced by factor 10 for next download
            for (const expectedBlockLimit of [400, 40, 4, 1, 1, 1]) {
                // @ts-ignore
                communicator.getPeerBlocks.mockReset();
                const downloadedBlocks = await networkMonitor.downloadBlocksFromHeight(
                    fromHeight,
                    maxParallelDownloads,
                );

                expect(downloadedBlocks).toEqual([]);
                // getPeerBlocks fails every time for every peer, so it will try for each peer
                // from all the other peers before reducing chunk size
                expect(communicator.getPeerBlocks).toBeCalledTimes(numPeers * maxParallelDownloads);
                expect(communicator.getPeerBlocks).toBeCalledWith(expect.anything(), {
                    fromBlockHeight: expect.any(Number),
                    blockLimit: expectedBlockLimit,
                });
            }

            // second step, peers return blocks: chunk size should be reset to default value (400) for next download
            const mockGetPeerBlocks1Block = (_, { fromBlockHeight }) => [expectedBlocksFromHeight(fromBlockHeight)[0]];
            for (const expectedBlockLimit of [1, 400]) {
                communicator.getPeerBlocks = jest
                    .fn()
                    .mockImplementation(expectedBlockLimit === 1 ? mockGetPeerBlocks1Block : mockedGetPeerBlocks);

                const downloadedBlocks = await networkMonitor.downloadBlocksFromHeight(
                    fromHeight,
                    maxParallelDownloads,
                );

                const expectedBlocks = expectedBlocksFromHeight(fromHeight).slice(0, numPeers * expectedBlockLimit);

                expect(downloadedBlocks).toEqual(expectedBlocks);

                expect(communicator.getPeerBlocks).toBeCalledTimes(maxParallelDownloads);
                expect(communicator.getPeerBlocks).toBeCalledWith(expect.anything(), {
                    fromBlockHeight: expect.any(Number),
                    blockLimit: expectedBlockLimit,
                });
            }
        });
    });

    describe("broadcastBlock", () => {
        // @ts-ignore
        const block = {
            data: {
                id: "17882607875259085966",
                version: 0,
                timestamp: 46583330,
                height: 2,
                reward: Utils.BigNumber.make("0"),
                previousBlock: "17184958558311101492",
                numberOfTransactions: 0,
                totalAmount: Utils.BigNumber.make("0"),
                totalFee: Utils.BigNumber.make("0"),
                payloadLength: 0,
                payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
                blockSignature:
                    "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
            },
            transactions: [],
        } as Blocks.Block;
        const peers = [
            new Peer("180.177.54.4", 4000),
            new Peer("181.177.54.4", 4000),
            new Peer("182.177.54.4", 4000),
            new Peer("183.177.54.4", 4000),
            new Peer("184.177.54.4", 4000),
        ];

        beforeEach(() => {
            repository.getPeers = jest.fn().mockReturnValue(peers);
        });
        afterEach(() => {
            repository.getPeers = jest.fn();
            blockchain.getBlockPing = jest.fn();
        });

        it.each([[4], [5], [10], [50]])("should not broadcast to any peer when blockPing >= 4", async (count) => {
            blockchain.getBlockPing = jest
                .fn()
                .mockReturnValueOnce({ block: block.data, last: 10900, first: 10200, count });

            await networkMonitor.broadcastBlock(block);

            expect(communicator.postBlock).toBeCalledTimes(0);
        });

        it.each([[0], [1], [2], [3]])(
            "should broadcast to (4 - blockPing)/4 of our peers when blockPing < 4",
            async (count) => {
                blockchain.getBlockPing = jest
                    .fn()
                    .mockReturnValue({ block: block.data, last: 10900, first: 10200, count });

                await networkMonitor.broadcastBlock(block);

                expect(communicator.postBlock).toBeCalledTimes(Math.ceil((peers.length * (4 - count)) / 4));
            },
        );

        it.each([[0], [1], [2], [3]])(
            "should broadcast to all of our peers when block.id doesnt match blockPing.id",
            async (count) => {
                const tmpBlock = cloneDeep(block);

                tmpBlock.data.id = "random_id";

                blockchain.getBlockPing = jest
                    .fn()
                    .mockReturnValue({ block: tmpBlock.data, last: 10900, first: 10200, count });

                await networkMonitor.broadcastBlock(block);

                expect(communicator.postBlock).toBeCalledTimes(5);
            },
        );

        describe("when blockPing.last - blockPing.first < 500ms", () => {
            it("should not wait if block is from forger", async () => {
                blockchain.getBlockPing = jest
                    .fn()
                    .mockReturnValue({ block: block.data, last: 10500, first: 10200, count: 2, fromForger: true });
                const spySleep = jest.spyOn(Utils, "sleep");

                await networkMonitor.broadcastBlock(block);

                expect(communicator.postBlock).toBeCalledTimes(peers.length);
                expect(spySleep).toBeCalledTimes(0);
            });

            it("should wait until 500ms have elapsed between blockPing.last and blockPing.first before broadcasting", async () => {
                blockchain.getBlockPing = jest
                    .fn()
                    .mockReturnValue({ block: block.data, last: 10500, first: 10200, count: 2 });
                const spySleep = jest.spyOn(Utils, "sleep");

                await networkMonitor.broadcastBlock(block);

                expect(communicator.postBlock).toBeCalledTimes(Math.ceil((peers.length * 1) / 2));
                expect(spySleep).toBeCalledTimes(1);
                expect(spySleep).toBeCalledWith(200); // 500 - (last - first)
            });

            it("should not broadcast if during waiting we have received a new block", async () => {
                blockchain.getBlockPing = jest
                    .fn()
                    .mockReturnValueOnce({ block: block.data, last: 10500, first: 10200, count: 2 })
                    .mockReturnValueOnce({
                        block: { ...block.data, id: "11111111", height: 3 },
                        last: 10500,
                        first: 10200,
                        count: 2,
                    });
                const spySleep = jest.spyOn(Utils, "sleep");

                await networkMonitor.broadcastBlock(block);

                expect(communicator.postBlock).toBeCalledTimes(0);
                expect(spySleep).toBeCalledTimes(1);
            });
        });
    });
});
