import { Container, Utils, Enums } from "@arkecosystem/core-kernel";

import delay from "delay";
import { NetworkMonitor } from "@arkecosystem/core-p2p/src/network-monitor";
import path from "path";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { NetworkState } from "@arkecosystem/core-p2p/src/network-state";
import { PeerVerificationResult } from "@arkecosystem/core-p2p/src/peer-verifier";
import { Blocks } from "@arkecosystem/crypto";

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
    const storage = { getPeers: jest.fn(), forgetPeer: jest.fn() };

    const triggerService = { call: jest.fn() }; // validateAndAcceptPeer
    const stateStore = { getLastBlock: jest.fn() };
    const blockchain = { getBlockPing: jest.fn(), getLastBlock: jest.fn() };
    const appGet = {
        [Container.Identifiers.TriggerService]: triggerService,
        [Container.Identifiers.StateStore]: stateStore,
        [Container.Identifiers.BlockchainService]: blockchain,
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
        container.bind(Container.Identifiers.PeerNetworkMonitor).to(NetworkMonitor);
        container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(emitter);
        container.bind(Container.Identifiers.PeerCommunicator).toConstantValue(communicator);
        container.bind(Container.Identifiers.PeerStorage).toConstantValue(storage);
        container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(pluginConfiguration);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
    });

    beforeEach(() => {
        networkMonitor = container.get<NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor);
        networkMonitor.initialize();

        jest.resetAllMocks();
    });

    describe.each([[true], [false]])("boot", (dnsAndNtpFail) => {
        beforeEach(() => {
            if (dnsAndNtpFail) {
                config.ntp = ["nontp.notworking.com"]
                config.dns = ["nodns.notworking.com"]
            }
        })
        afterEach(() => {
            config.dns = ["1.1.1.1"];
            config.ntp = ["time.google.com"];
        })

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
                storage.getPeers = jest.fn().mockReturnValueOnce(peers);

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
                config.networkStart = true;
            });
            afterEach(() => {
                config.networkStart = undefined;
            });

            it("should set coldStart to true and not discover peers", async () => {
                const spyDiscoverPeers = jest.spyOn(networkMonitor, "discoverPeers");
                expect(networkMonitor.isColdStart()).toBeFalse();

                await networkMonitor.updateNetworkStatus();

                expect(networkMonitor.isColdStart()).toBeTrue();
                expect(spyDiscoverPeers).toBeCalledTimes(0);
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
            storage.getPeers.mockReturnValue([]);

            const spyDiscoverPeers = jest.spyOn(networkMonitor, "discoverPeers");
            await networkMonitor.updateNetworkStatus();

            expect(spyDiscoverPeers).toBeCalledTimes(1);
        });

        it("should log an error when discovering new peers fails", async () => {
            storage.getPeers.mockReturnValue([]);
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
                storage.getPeers.mockReturnValue([]);
    
                await networkMonitor.updateNetworkStatus();
    
                expect(logger.info).toBeCalledWith("Couldn't find enough peers. Falling back to seed peers.");
            });

            it("should not fall back to seed peers when config.ignoreMinimumNetworkReach", async () => {
                config.minimumNetworkReach = 5;
                config.ignoreMinimumNetworkReach = true;
                storage.getPeers.mockReturnValue([]);
    
                await networkMonitor.updateNetworkStatus();
    
                expect(logger.info).not.toBeCalledWith("Couldn't find enough peers. Falling back to seed peers.");
            });
        })
        

        it("should schedule the next updateNetworkStatus only once", async () => {
            storage.getPeers.mockReturnValue([]);

            let sleeping = true;
            const mockSleep = async () => {
                while(sleeping) { await delay(10) }
            }
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
            storage.getPeers = jest.fn().mockReturnValue(peers);
        });
        afterEach(() => {
            storage.getPeers = jest.fn();
        });

        it("should ping every peer when the peers length is <= <peerCount>", async () => {
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
            expect(emitter.dispatch).toBeCalledTimes(2);
            expect(emitter.dispatch).toBeCalledWith("internal.p2p.disconnectPeer", { peer: expect.toBeOneOf(peers) });
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
            storage.getPeers = jest.fn().mockReturnValue(peers);
        });
        afterEach(() => {
            storage.getPeers = jest.fn();
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
    })

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
            storage.getPeers = jest.fn().mockReturnValue(peers);

            expect(networkMonitor.getNetworkHeight()).toBe(expectedNetworkHeight);

            storage.getPeers = jest.fn();
        });
    });

    describe("getNetworkState", () => {
        beforeEach(() => {
            process.env.CORE_ENV = "test"; // for NetworkState analyze
            storage.getPeers = jest.fn().mockReturnValue([]);
        });
        afterEach(() => {
            delete process.env.CORE_ENV;
            storage.getPeers = jest.fn();
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
            storage.getPeers = jest.fn().mockReturnValue([]);
        });
        afterEach(() => {
            storage.getPeers = jest.fn();
        });

        it("should call cleansePeers with {forcePing}", async () => {
            const spyCleansePeers = jest.spyOn(networkMonitor, "cleansePeers");

            await networkMonitor.refreshPeersAfterFork();

            expect(spyCleansePeers).toBeCalledTimes(1);
            expect(spyCleansePeers).toBeCalledWith({ forcePing: true });
        });
    });

    describe("checkNetworkHealth", () => {
        describe("when we have 0 peer", () => {
            beforeEach(() => {
                storage.getPeers = jest.fn().mockReturnValue([]);
            });
            afterEach(() => {
                storage.getPeers = jest.fn();
            });

            it("should return {forked: false}", async () => {
                const networkStatus = await networkMonitor.checkNetworkHealth();

                expect(networkStatus).toEqual({ forked: false });
            });
        });

        describe("when majority of our peers is on our chain", () => {
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
            // 4 peers are forked out of 10
            peers[0].verificationResult = new PeerVerificationResult(3, 4, 2);
            peers[1].verificationResult = new PeerVerificationResult(3, 4, 2);
            peers[2].verificationResult = new PeerVerificationResult(3, 4, 2);
            peers[3].verificationResult = new PeerVerificationResult(3, 4, 2);

            beforeEach(() => {
                storage.getPeers = jest.fn().mockReturnValue(peers);
            });
            afterEach(() => {
                storage.getPeers = jest.fn();
            });
            it("should return {forked: false}", async () => {
                const networkStatus = await networkMonitor.checkNetworkHealth();

                expect(networkStatus).toEqual({ forked: false });
            });
        });

        describe("when majority of our peers is on another chain", () => {
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
            // 7 peers are forked out of 10
            peers[0].verificationResult = new PeerVerificationResult(43, 47, 31);
            peers[1].verificationResult = new PeerVerificationResult(43, 47, 31);
            peers[2].verificationResult = new PeerVerificationResult(43, 47, 31);
            peers[3].verificationResult = new PeerVerificationResult(43, 47, 35);
            peers[4].verificationResult = new PeerVerificationResult(43, 47, 35);
            peers[5].verificationResult = new PeerVerificationResult(43, 47, 35);
            peers[6].verificationResult = new PeerVerificationResult(43, 47, 12);

            beforeEach(() => {
                stateStore.getLastBlock = jest.fn().mockReturnValueOnce({ data: { height: 43 } });
                storage.getPeers = jest.fn().mockReturnValue(peers);
            });
            afterEach(() => {
                storage.getPeers = jest.fn();
            });

            it("should return {forked: true, blocksToRollback:<current height - highestCommonHeight>}", async () => {
                const networkStatus = await networkMonitor.checkNetworkHealth();

                expect(networkStatus).toEqual({ forked: true, blocksToRollback: 43 - 35 });
            });
        });
    });

    describe("downloadBlocksFromHeight", () => {
        afterEach(() => {
            communicator.getPeerBlocks = jest.fn();
            storage.getPeers = jest.fn();
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
            storage.getPeers = jest.fn().mockReturnValue([]);

            expect(await networkMonitor.downloadBlocksFromHeight(1)).toEqual([]);
            expect(logger.error).toBeCalledTimes(1);
            expect(logger.error).toBeCalledWith("Could not download blocks: we have 0 peers");
        });

        it("should return empty array and log an error when all our peers are forked", async () => {
            const peer = new Peer("1.1.1.1", 4000);
            peer.state = { height: 4, currentSlot: 4, forgingAllowed: true, header: {} };
            peer.verificationResult = new PeerVerificationResult(3, 4, 2);
            storage.getPeers = jest.fn().mockReturnValue([peer]);

            expect(await networkMonitor.downloadBlocksFromHeight(1, maxParallelDownloads)).toEqual([]);
            expect(logger.error).toBeCalledTimes(1);
            expect(logger.error).toBeCalledWith("Could not download blocks: We have 1 peer(s) but all of them are on a different chain than us");
        });

        it("should download blocks from 1 peer", async () => {
            const mockBlock = { id: "123456" };

            communicator.getPeerBlocks = jest.fn().mockReturnValue([mockBlock]);

            const peer = new Peer("1.1.1.1", 4000);
            peer.state = { height: 2, currentSlot: 2, forgingAllowed: true, header: {} };
            peer.verificationResult = { forked: false, hisHeight: 2, myHeight: 2, highestCommonHeight: 2 };
            storage.getPeers = jest.fn().mockReturnValue([peer]);

            expect(await networkMonitor.downloadBlocksFromHeight(1, maxParallelDownloads)).toEqual([mockBlock]);
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
            storage.getPeers = jest.fn().mockReturnValue(peers);

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
            storage.getPeers = jest.fn().mockReturnValue(peers);

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
            storage.getPeers = jest.fn().mockReturnValue(peers);

            const chunksToDownloadBeforeThrow = 2;
            let fromHeight = baseHeight - 1 - chunksToDownloadBeforeThrow * downloadChunkSize;

            let downloadedBlocks = await networkMonitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);
            let expectedBlocks = expectedBlocksFromHeight(fromHeight).slice(
                0,
                chunksToDownloadBeforeThrow * downloadChunkSize,
            );

            expect(downloadedBlocks).toEqual(expectedBlocks);

            expect(mockFn.mock.calls.length).toEqual(numPeers);
            for (let i = 0; i < numPeers; i++) {
                expect(mockFn.mock.calls[i][1].fromBlockHeight).toEqual(fromHeight + i * downloadChunkSize);
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
            storage.getPeers = jest.fn().mockReturnValue(peers);

            const chunksToDownload = 2;
            let fromHeight = baseHeight - 1 - chunksToDownload * downloadChunkSize;

            let downloadedBlocks = await networkMonitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);

            expect(downloadedBlocks).toEqual([]);
        });

        it("should still download blocks from 1 peer if network height === our height", async () => {
            const mockBlock = { id: "123456" };

            communicator.getPeerBlocks = jest.fn().mockReturnValue([mockBlock]);

            const peer = new Peer("1.1.1.1", 4000);
            peer.state = { height: 20, currentSlot: 2, forgingAllowed: true, header: {} };
            peer.verificationResult = { forked: false, hisHeight: 20, myHeight: 20, highestCommonHeight: 20 };
            storage.getPeers = jest.fn().mockReturnValue([peer]);

            expect(await networkMonitor.downloadBlocksFromHeight(20, maxParallelDownloads)).toEqual([mockBlock]);
        });
    });

    describe("broadcastBlock", () => {
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
            storage.getPeers = jest.fn().mockReturnValue(peers);
        });
        afterEach(() => {
            storage.getPeers = jest.fn();
            blockchain.getBlockPing = jest.fn();
        });

        describe("when blockchain is not ready", () => {
            it("should skip broadcasting", async () => {
                // @ts-ignore
                appGet[Container.Identifiers.BlockchainService] = undefined;

                await networkMonitor.broadcastBlock(block);

                expect(logger.info).toBeCalledTimes(1);
                expect(logger.info).toBeCalledWith(
                    `Skipping broadcast of block ${block.data.height.toLocaleString()} as blockchain is not ready`,
                );
                expect(storage.getPeers).toBeCalledTimes(0);
                expect(communicator.postBlock).toBeCalledTimes(0);

                // @ts-ignore
                appGet[Container.Identifiers.BlockchainService] = blockchain;
            });
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

        describe("when blockPing.last - blockPing.first < 500ms", () => {
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
                        block: { ...block.data, id: "11111111" },
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
