import { NetworkState } from "@arkecosystem/core-p2p/src/network-state";
import { NetworkStateStatus } from "@arkecosystem/core-p2p/src/enums";
import { Container } from "@arkecosystem/core-kernel";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { Utils, Blocks } from "@arkecosystem/crypto";
import { PeerVerificationResult } from "@arkecosystem/core-p2p/src/peer-verifier";

describe("NetworkState", () => {
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
        [Container.Identifiers.BlockchainService]: blockchainService
    };
    const configuration = { getOptional: () => 2 }; // minimumNetworkReach
    const app = {
        get: (key) => appGet[key],
        getTagged: () => configuration,
    }
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
            })
        })

        describe("when process.env.CORE_ENV='test'", () => {
            it("should return Test status", async () => {
                process.env.CORE_ENV = "test";

                const networkState = await NetworkState.analyze(networkMonitor, peerStorage);
                expect(networkState.status).toBe(NetworkStateStatus.Test);

                delete process.env.CORE_ENV;
            })
        })

        describe("when peers are below minimum network reach", () => {
            it("should return BelowMinimumPeers status", async () => {
                const networkState = await NetworkState.analyze(networkMonitor, peerStorage);
                expect(networkState.status).toBe(NetworkStateStatus.BelowMinimumPeers);
            })
        })

        describe("when returning quorum details", () => {
            it("should return accurate quorum values peersNoQuorum peersQuorum peersForked", async () => {
                const peer1 = new Peer("181.168.65.65", 4000);
                peer1.state = {
                    header: { height: 9, id: "12112607875259085966" },
                    height: 9,
                    forgingAllowed: true,
                    currentSlot: 10
                }; // overheight
                const peer2 = new Peer("182.168.65.65", 4000);
                peer2.state = { header: {}, height: 8, forgingAllowed: true, currentSlot: 9 }; // same height
                const peer3 = new Peer("183.168.65.65", 4000);
                peer3.state = { header: {}, height: 8, forgingAllowed: true, currentSlot: 9 }; // same height
                const peer4 = new Peer("184.168.65.65", 4000);
                peer4.state = { header: {}, height: 6, forgingAllowed: true, currentSlot: 7 }; // below height
                peer4.verificationResult = new PeerVerificationResult(8, 6, 4); // forked
                const peer5 = new Peer("185.168.65.65", 4000);
                peer5.state = { header: {}, height: 6, forgingAllowed: true, currentSlot: 7 }; // below height, not forked
                peers = [ peer1, peer2, peer3, peer4, peer5 ];
    
                const networkState = await NetworkState.analyze(networkMonitor, peerStorage);
    
                expect(networkState.getQuorum()).toBe(3 / 5); // 2 same-height + 1 below-height but not forked

                expect(networkState.getOverHeightBlockHeaders()).toEqual([peer1.state.header]);
            })
        })
    })

});