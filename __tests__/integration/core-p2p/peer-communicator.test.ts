import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";
import { createPeerService, createStubPeer } from "../../helpers/peers";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { genesisBlock } from "../../utils/config/unitnet/genesisBlock";
import genesisBlockJSON from "../../utils/config/unitnet/genesisBlock.json";
import { delegates } from "../../utils/fixtures/unitnet";
import { MockSocketManager } from "./__support__/mock-socket-server/manager";

let stubPeer: P2P.IPeer;
let socketManager: MockSocketManager;

let storage: P2P.IPeerStorage;
let communicator: P2P.IPeerCommunicator;

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
            const response = await communicator.postBlock(stubPeer, genesisBlockJSON);

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

    describe("downloadBlocks", () => {
        it("should be ok", async () => {
            await socketManager.addMock("getBlocks", [{ height: 1, id: "1" }, { height: 2, id: "2" }]);

            const blocks = await communicator.downloadBlocks(stubPeer, 1);

            expect(blocks).toBeArray();
            expect(blocks.length).toBe(2);
        });

        it("should return the blocks with status 200", async () => {
            await socketManager.addMock("getBlocks", [genesisBlock]);
            const response = await communicator.downloadBlocks(stubPeer, 1);

            expect(response).toBeArrayOfSize(1);
            expect(response[0].id).toBe(genesisBlock.id);
        });

        it("should update the height after download", async () => {
            await socketManager.addMock("getBlocks", [genesisBlock]);

            stubPeer.state.height = undefined;
            await communicator.downloadBlocks(stubPeer, 1);

            expect(stubPeer.state.height).toBe(1);
        });
    });

    describe("ping", () => {
        it("should be ok", async () => {
            const mockStatus = {
                height: 1,
                forgingAllowed: true,
                currentSlot: 1,
                header: {
                    height: 1,
                    id: "123456",
                },
            };
            await socketManager.addMock("getStatus", mockStatus);
            process.env.CORE_SKIP_PEER_STATE_VERIFICATION = "true";

            const status = await communicator.ping(stubPeer, 1000);

            expect(status).toEqual(mockStatus);
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
                height: 1,
                forgingAllowed: true,
                currentSlot: 1,
                header: {
                    height: 1,
                    id: "123456",
                },
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
            await socketManager.addMock("getCommonBlocks", { common: genesisBlock });

            const commonBlocks = await communicator.hasCommonBlocks(stubPeer, [genesisBlock.id]);

            expect(commonBlocks.id).toBe(genesisBlock.id);
            expect(commonBlocks.height).toBe(genesisBlock.height);
            expect(commonBlocks.transactions).toHaveLength(255);
        });
    });
});
