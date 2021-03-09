import { Container, Utils as KernelUtils } from "@packages/core-kernel";
import { NetworkStateStatus } from "@packages/core-p2p/src/enums";
import { NetworkState } from "@packages/core-p2p/src/network-state";
import { Peer } from "@packages/core-p2p/src/peer";
import { PeerVerificationResult } from "@packages/core-p2p/src/peer-verifier";
import { Blocks, Crypto, Utils } from "@packages/crypto";

describe("NetworkState", () => {
    // @ts-ignore
    const lastBlock = {
        data: {
            id: "17882607875259085966",
            version: 0,
            timestamp: 46583330,
            height: 8,
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
    const blockchainService = { getLastBlock: () => lastBlock };
    const appGet = {
        [Container.Identifiers.BlockchainService]: blockchainService,
    };
    const configuration = { getOptional: () => 2 }; // minimumNetworkReach
    const app = {
        get: (key) => appGet[key],
        getTagged: () => configuration,
    };
    const networkMonitor = {
        app,
        isColdStart: jest.fn(),
        completeColdStart: jest.fn(),
    } as any;
    let peers = [];
    const peerStorage = { getPeers: () => peers } as any;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("analyze", () => {
        describe("when this is a cold start", () => {
            it("should call completeColdStart() and return ColdStart status", async () => {
                networkMonitor.isColdStart = jest.fn().mockReturnValueOnce(true);

                const networkState = await NetworkState.analyze(networkMonitor, peerStorage);
                expect(networkState.status).toBe(NetworkStateStatus.ColdStart);
                expect(networkMonitor.completeColdStart).toBeCalledTimes(1);
            });
        });

        describe("when process.env.CORE_ENV='test'", () => {
            it("should return Test status", async () => {
                process.env.CORE_ENV = "test";

                const networkState = await NetworkState.analyze(networkMonitor, peerStorage);
                expect(networkState.status).toBe(NetworkStateStatus.Test);

                delete process.env.CORE_ENV;
            });
        });

        describe("when peers are below minimum network reach", () => {
            it("should return BelowMinimumPeers status", async () => {
                const networkState = await NetworkState.analyze(networkMonitor, peerStorage);
                expect(networkState.status).toBe(NetworkStateStatus.BelowMinimumPeers);
            });
        });

        describe("when returning quorum details", () => {
            it("should return accurate quorum values peersNoQuorum peersQuorum peersForked", async () => {
                const blockTimeLookup = await KernelUtils.forgingInfoCalculator.getBlockTimeLookup(
                    // @ts-ignore - app exists but isn't on the interface for now
                    networkMonitor.app,
                    lastBlock.data.height,
                );

                const currentSlot = Crypto.Slots.getSlotNumber(blockTimeLookup);

                const peer1 = new Peer("181.168.65.65", 4000);
                peer1.state = {
                    header: { height: 9, id: "12112607875259085966" },
                    height: 9,
                    forgingAllowed: true,
                    currentSlot: currentSlot + 1,
                }; // overheight
                const peer2 = new Peer("182.168.65.65", 4000);
                peer2.state = { header: {}, height: 8, forgingAllowed: true, currentSlot: currentSlot }; // same height
                const peer3 = new Peer("183.168.65.65", 4000);
                peer3.state = { header: {}, height: 8, forgingAllowed: true, currentSlot: currentSlot }; // same height
                const peer4 = new Peer("184.168.65.65", 4000);
                peer4.state = { header: {}, height: 6, forgingAllowed: false, currentSlot: currentSlot - 2 }; // below height
                peer4.verificationResult = new PeerVerificationResult(8, 6, 4); // forked
                const peer5 = new Peer("185.168.65.65", 4000);
                peer5.state = { header: {}, height: 6, forgingAllowed: false, currentSlot: currentSlot - 2 }; // below height, not forked
                peers = [peer1, peer2, peer3, peer4, peer5];

                const networkState = await NetworkState.analyze(networkMonitor, peerStorage);

                expect(networkState.getQuorum()).toBe(3 / 5); // 2 same-height + 1 below-height but not forked

                expect(networkState.getOverHeightBlockHeaders()).toEqual([peer1.state.header]);
            });
        });
    });

    describe("parse", () => {
        describe("when data or data.status is undefined", () => {
            it.each([[undefined], [{}]])("should return NetworkStateStatus.Unknown", (data) => {
                expect(NetworkState.parse(data)).toEqual(new NetworkState(NetworkStateStatus.Unknown));
            });
        });

        it.each([
            [NetworkStateStatus.Default, 5, "7aaf2d2dc30fdbe8808b010714fd429f893535f5a90aa2abdb0ca62aa7d35130"],
            [NetworkStateStatus.ColdStart, 144, "416d6ac21f279d9b79dde1fe59c6084628779a3a3cb5b4ea11fa4bf10295143b"],
            [
                NetworkStateStatus.BelowMinimumPeers,
                2,
                "1d582b5c84d5b72da8a25ca2bd95ccef1534c58823a01e0f698786a6fd0be4e6",
            ],
            [NetworkStateStatus.Test, 533, "10024d739768a68b43a6e4124718129e1fe07b0461630b3f275b7640d298c3b7"],
            [NetworkStateStatus.Unknown, 5333, "d76512050d858417f71da1f84ca4896a78057c14ea1ecebf70830c7cc87cd49a"],
        ])("should return the NetworkState corresponding to the data provided", (status, nodeHeight, lastBlockId) => {
            const data = {
                status,
                nodeHeight,
                lastBlockId,
                quorumDetails: {
                    peersQuorum: 31,
                    peersNoQuorum: 3,
                    peersOverHeight: 0,
                    peersOverHeightBlockHeaders: {},
                    peersForked: 0,
                    peersDifferentSlot: 0,
                    peersForgingNotAllowed: 1,
                },
            };

            const parsed = NetworkState.parse(data);
            for (const key of ["status", "nodeHeight", "lastBlockId"]) {
                expect(data[key]).toEqual(parsed[key]);
            }
        });
    });

    describe("getNodeHeight", () => {
        it("should return node height", () => {
            const data = {
                status: NetworkStateStatus.Test,
                nodeHeight: 31,
                lastBlockId: "10024d739768a68b43a6e4124718129e1fe07b0461630b3f275b7640d298c3b7",
                quorumDetails: {
                    peersQuorum: 31,
                    peersNoQuorum: 7,
                    peersOverHeight: 0,
                    peersOverHeightBlockHeaders: {},
                    peersForked: 0,
                    peersDifferentSlot: 0,
                    peersForgingNotAllowed: 1,
                },
            };

            const networkState = NetworkState.parse(data);

            expect(networkState.getNodeHeight()).toBe(31);
        });
    });

    describe("getLastBlockId", () => {
        it("should return lats block id", () => {
            const data = {
                status: NetworkStateStatus.Test,
                nodeHeight: 31,
                lastBlockId: "10024d739768a68b43a6e4124718129e1fe07b0461630b3f275b7640d298c3b7",
                quorumDetails: {
                    peersQuorum: 31,
                    peersNoQuorum: 7,
                    peersOverHeight: 0,
                    peersOverHeightBlockHeaders: {},
                    peersForked: 0,
                    peersDifferentSlot: 0,
                    peersForgingNotAllowed: 1,
                },
            };

            const networkState = NetworkState.parse(data);

            expect(networkState.getLastBlockId()).toBe(
                "10024d739768a68b43a6e4124718129e1fe07b0461630b3f275b7640d298c3b7",
            );
        });
    });

    describe("getQuorum", () => {
        it("should return 1 when NetworkStateStatus.Test", () => {
            const data = {
                status: NetworkStateStatus.Test,
                nodeHeight: 31,
                lastBlockId: "10024d739768a68b43a6e4124718129e1fe07b0461630b3f275b7640d298c3b7",
                quorumDetails: {
                    peersQuorum: 31,
                    peersNoQuorum: 7,
                    peersOverHeight: 0,
                    peersOverHeightBlockHeaders: {},
                    peersForked: 0,
                    peersDifferentSlot: 0,
                    peersForgingNotAllowed: 1,
                },
            };

            const parsed = NetworkState.parse(data);

            expect(parsed.getQuorum()).toBe(1);
        });
    });

    describe("toJson", () => {
        it("should return 1 when NetworkStateStatus.Test", () => {
            const data = {
                status: NetworkStateStatus.Default,
                nodeHeight: 31,
                lastBlockId: "10024d739768a68b43a6e4124718129e1fe07b0461630b3f275b7640d298c3b7",
                quorumDetails: {
                    peersQuorum: 30,
                    peersNoQuorum: 10,
                    peersOverHeight: 0,
                    peersOverHeightBlockHeaders: {},
                    peersForked: 0,
                    peersDifferentSlot: 0,
                    peersForgingNotAllowed: 1,
                },
            };
            const expectedJson = { ...data, quorum: 0.75 }; // 30 / (10+30)
            delete expectedJson.status;

            const parsed = NetworkState.parse(data);

            expect(JSON.parse(parsed.toJson())).toEqual(expectedJson);
        });
    });
});
