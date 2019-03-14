import "./mocks/core-container";

import { Transaction } from "@arkecosystem/crypto";
import { Peer } from "../../../packages/core-p2p/src/peer";
import { generators } from "../../utils";
import { genesisBlock } from "../../utils/fixtures/unitnet/block-model";
import genesisBlockJSON from "../../utils/config/unitnet/genesisBlock.json";
import { delegates } from "../../utils/fixtures/unitnet";

import { MockSocketManager } from "./__support__/mock-socket-server/manager";
import delay from "delay";

let genesisTransaction;

let peerMock;
let localConfig;
let socketManager: MockSocketManager;

beforeAll(async () => {
    genesisTransaction = Transaction.fromData(genesisBlock.transactions[0].data);

    socketManager = new MockSocketManager();
    await socketManager.init();

    localConfig = require("../../../packages/core-p2p/src/config").config;

    localConfig.init({});
    localConfig.set("port", 4009); // we mock a peer on localhost:4009
    localConfig.set("blacklist", []);
    localConfig.set("minimumVersions", [">=2.1.0"]);

    peerMock = new Peer("127.0.0.1", 4009);
    peerMock.nethash = "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348";
    await delay(2000);
});

afterAll(async () => {
    peerMock.socket.destroy();
    socketManager.stopServer();
});

describe("Peer", () => {
    afterEach(async () => socketManager.resetAllMocks());

    describe("postBlock", () => {
        it("should get back success when posting genesis block", async () => {
            await socketManager.addMock("postBlock", { success: true });
            const response = await peerMock.postBlock(genesisBlockJSON);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
        });
    });

    describe("postTransactions", () => {
        it("should be ok", async () => {
            await socketManager.addMock("postTransactions", { success: true, transactionsIds: [] });
            const transactions = generators.generateTransfers(
                "testnet",
                delegates[1].passphrase,
                delegates[2].address,
                1000,
                1,
                true,
            );
            const response = await peerMock.postTransactions(transactions);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
        });
    });

    describe("downloadBlocks", () => {
        it("should return the blocks with status 200", async () => {
            await socketManager.addMock("getBlocks", { blocks: [genesisBlockJSON] });
            const response = await peerMock.downloadBlocks(1);

            expect(response).toBeArrayOfSize(1);
            expect(response[0].id).toBe(genesisBlockJSON.id);
        });

        it("should update the height after download", async () => {
            await socketManager.addMock("getBlocks", { blocks: [genesisBlockJSON] });

            peerMock.state.height = null;
            await peerMock.downloadBlocks(1);

            expect(peerMock.state.height).toBe(1);
        });
    });

    describe("ping", () => {
        it("should be ok", async () => {
            const mockStatus = {
                success: true,
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

            const status = await peerMock.ping(1000);

            expect(status).toEqual(mockStatus);
        });

        it.skip("when ping request timeouts", async () => {
            await socketManager.resetAllMocks();
            process.env.CORE_SKIP_PEER_STATE_VERIFICATION = "true";
            await peerMock.ping(400);
        });
    });

    describe("recentlyPinged", () => {
        it("should return true after a ping", async () => {
            const mockStatus = {
                success: true,
                height: 1,
                forgingAllowed: true,
                currentSlot: 1,
                header: {
                    height: 1,
                    id: "123456",
                },
            };
            await socketManager.addMock("getStatus", mockStatus);

            peerMock.lastPinged = null;

            expect(peerMock.recentlyPinged()).toBeFalse();

            const response = await peerMock.ping(5000);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
            expect(peerMock.recentlyPinged()).toBeTrue();
        });
    });

    describe("getPeers", () => {
        it("should return the list of peers", async () => {
            const peersMock = [{ ip: "1.1.1.1" }];
            await socketManager.addMock("getPeers", { success: true, peers: peersMock });
            const peers = await peerMock.getPeers();
            expect(peers).toEqual(peersMock);
        });
    });

    describe("hasCommonBlocks", () => {
        it("should return false when peer has no common block", async () => {
            await socketManager.addMock("getCommonBlocks", { success: true, common: null });
            const commonBlocks = await peerMock.hasCommonBlocks([genesisBlockJSON.id]);
            expect(commonBlocks).toBeFalse();
        });

        it("should return true when peer has common block", async () => {
            await socketManager.resetAllMocks();
            await socketManager.addMock("getCommonBlocks", { success: true, common: genesisBlockJSON });
            const commonBlocks = await peerMock.hasCommonBlocks([genesisBlockJSON.id]);
            expect(commonBlocks).toEqual(genesisBlockJSON);
        });
    });
});
