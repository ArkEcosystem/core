import "jest-extended";

import { eventEmitter } from "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { Blocks, Transactions } from "@arkecosystem/crypto";
import { getPeerConfig } from "../../../packages/core-p2p/src/socket-server/utils/get-peer-config";
import { createPeerService, createStubPeer } from "../../helpers/peers";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { genesisBlock } from "../../utils/config/unitnet/genesisBlock";
import { blocks2to100 } from "../../utils/fixtures/testnet/blocks2to100";
import { delegates } from "../../utils/fixtures/unitnet";
import { MockSocketManager } from "./__support__/mock-socket-server/manager";

let stubPeer: P2P.IPeer;
let socketManager: MockSocketManager;

let storage: P2P.IPeerStorage;
let communicator: P2P.IPeerCommunicator;

const blockHeader = {
    height: 1,
    id: "123456",
    timestamp: 0,
    totalAmount: "0",
    totalFee: "0",
    reward: "0",
    // tslint:disable-next-line: no-null-keyword
    previousBlock: null,
    generatorPublicKey: "03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068",
    blockSignature:
        "304402202fe5de5697fa25d3d3c0cb24617ac02ddfb1c915ee9194a89f8392f948c6076402200d07c5244642fe36afa53fb2d048735f1adfa623e8fa4760487e5f72e17d253b",
};

beforeAll(async () => {
    socketManager = new MockSocketManager();
    await socketManager.init();
});

afterAll(async () => {
    socketManager.stopServer();
});

beforeEach(() => {
    ({ communicator, storage } = createPeerService());

    stubPeer = createStubPeer({ ip: "127.0.0.1", port: 4009 });
    storage.setPeer(stubPeer);
});

afterEach(() => socketManager.resetAllMocks());

describe("PeerCommunicator", () => {
    describe("postBlock", () => {
        it("should get back success when posting genesis block", async () => {
            await socketManager.addMock("postBlock", {});
            const response = await communicator.postBlock(
                stubPeer,
                new Blocks.Block({
                    data: blocks2to100[0],
                    transactions: [],
                }),
            );

            expect(response).toBeObject();
        });
    });

    describe("postTransactions", () => {
        it("should be ok", async () => {
            await socketManager.addMock("postTransactions", []);
            const transactions = TransactionFactory.transfer(delegates[2].address, 1000)
                .withNetwork("testnet")
                .withPassphrase(delegates[1].passphrase)
                .create(1);

            const response = await communicator.postTransactions(
                stubPeer,
                transactions.map(t => Transactions.TransactionFactory.fromData(t).toJson()),
            );

            expect(response).toBeArray();
        });
    });

    describe("ping", () => {
        it("should be ok", async () => {
            const mockStatus = {
                state: {
                    height: 1,
                    forgingAllowed: true,
                    currentSlot: 1,
                    header: Object.assign({}, blockHeader),
                },
                config: getPeerConfig(),
            };

            await socketManager.addMock("getStatus", mockStatus);

            process.env.CORE_SKIP_PEER_STATE_VERIFICATION = "true";

            const status = await communicator.ping(stubPeer, 1000);
            status.header.totalAmount = status.header.totalAmount.toFixed();
            status.header.totalFee = status.header.totalFee.toFixed();
            status.header.reward = status.header.reward.toFixed();

            expect(status).toEqual(mockStatus.state);
        });

        it.skip("when ping request timeouts", async () => {
            await socketManager.resetAllMocks();

            process.env.CORE_SKIP_PEER_STATE_VERIFICATION = "true";

            await communicator.ping(stubPeer, 400);
        });
    });

    describe("recentlyPinged", () => {
        it("should return true after a ping", async () => {
            await socketManager.addMock("getStatus", {
                state: {
                    height: 1,
                    forgingAllowed: true,
                    currentSlot: 1,
                    header: Object.assign({}, blockHeader),
                },
                config: getPeerConfig(),
            });

            stubPeer.lastPinged = undefined;

            expect(stubPeer.recentlyPinged()).toBeFalse();

            const response = await communicator.ping(stubPeer, 5000);

            expect(response).toBeObject();
            expect(stubPeer.recentlyPinged()).toBeTrue();
        });
    });

    describe("getPeers", () => {
        it("should return the list of peers", async () => {
            const peersMock = [{ ip: "1.1.1.1" }];

            await socketManager.addMock("getPeers", peersMock);

            const peers = await communicator.getPeers(stubPeer);

            expect(peers).toEqual(peersMock);
        });
    });

    describe("hasCommonBlocks", () => {
        it("should return false when peer has no common block", async () => {
            await socketManager.addMock("getCommonBlocks", { common: undefined });

            const commonBlocks = await communicator.hasCommonBlocks(stubPeer, [genesisBlock.id]);

            expect(commonBlocks).toBeFalse();
        });

        it("should return true when peer has common block", async () => {
            await socketManager.resetAllMocks();

            const common = {
                id: genesisBlock.id,
                height: genesisBlock.height,
                previousBlock: genesisBlock.previousBlock,
                timestamp: genesisBlock.timestamp,
            };
            await socketManager.addMock("getCommonBlocks", { common });

            const commonBlock = await communicator.hasCommonBlocks(stubPeer, [genesisBlock.id]);

            expect(commonBlock).toEqual(common);
        });
    });

    describe("when socket is terminated in middleware", () => {
        it("should disconnect the peer calling internal.p2p.disconnectPeer", async () => {
            const spyEmit = jest.spyOn(eventEmitter, "emit");
            await socketManager.addMiddlewareTerminate();

            await communicator.getPeers(stubPeer);

            expect(spyEmit).toHaveBeenCalledWith("internal.p2p.disconnectPeer", expect.anything());

            await socketManager.removeMiddlewareTerminate();
        });
    });
});
