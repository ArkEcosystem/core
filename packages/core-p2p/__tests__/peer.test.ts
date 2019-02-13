import { generators } from "@arkecosystem/core-test-utils";
import { models } from "@arkecosystem/crypto";
import { delegates } from "../../core-test-utils/src/fixtures";

import { setUpFull, tearDownFull } from "./__support__/setup";

import { fork } from "child_process";
import delay from "delay";

const { Block, Transaction } = models;

let genesisBlock;
let genesisTransaction;

let peer;
let localConfig;
let mockServer;

beforeAll(async () => {
    await setUpFull();

    genesisBlock = new Block(require("@arkecosystem/core-test-utils/src/config/testnet/genesisBlock.json"));
    genesisTransaction = new Transaction(genesisBlock.transactions[0]);

    // launching a "mock socket server" so that we can mock a peer
    // In order for all this mocking to work, we must disable (in the code, didn't manage otherwise)
    // the isLocalHost() check in is-valid-peer.ts so that we can have local peers
    mockServer = fork(__dirname + "/__support__/mock-socket-server/index.js");

    await delay(2000);
});

afterAll(async () => {
    await tearDownFull();

    mockServer.kill();
});

beforeEach(() => {
    localConfig = require("../src/config").config;

    localConfig.init({});
    localConfig.set("port", 4009); // we mock a peer on localhost:4009

    const { Peer } = require("../src/peer");
    peer = new Peer("127.0.0.1", 4000);
    // the "real" peer (the app we launched with setupFull) is listening on port 4000
});

describe("Peer", () => {
    describe("postBlock", () => {
        it("should get back success when posting genesis block", async () => {
            const response = await peer.postBlock(genesisBlock.toJson());

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
        });
    });

    describe("postTransactions", () => {
        it("should be ok", async () => {
            const transactions = generators.generateTransfers(
                "testnet",
                delegates[1].passphrase,
                delegates[2].address,
                1000,
                1,
                true,
            );
            const response = await peer.postTransactions(transactions);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
        });
    });

    describe("downloadBlocks", () => {
        it("should return the blocks with status 200", async () => {
            const response = await peer.downloadBlocks(1);

            expect(response).toBeArrayOfSize(1);
            expect(response[0].id).toBe(genesisBlock.id);
        });
    });

    describe("ping", () => {
        it("should be ok", async () => {
            // we ping the peer on port 4000.
            // we do this with headers sets with port = 4009
            // so the app will attempt to ping us back on 4009 where our socket server mock is listening
            // => 127.0.0.1:4009 should be added as a peer in the app (real peer - 4000)

            const status = await peer.ping(1000);

            expect(status.success).toBeTrue();

            const peers = await peer.getPeers();
            expect(peers).toHaveLength(0);
        });

        it.skip("when localhost check is disabled it should add 127.0.0.1 as a peer", async () => {
            // we ping the peer on port 4000.
            // we do this with headers sets with port = 4009
            // so the app will attempt to ping us back on 4009 where our socket server mock is listening
            // => 127.0.0.1:4009 should be added as a peer in the app (real peer - 4000)

            const status = await peer.ping(1000);

            expect(status.success).toBeTrue();

            const peers = await peer.getPeers();
            expect(peers).toHaveLength(1);
            expect(peers[0].ip).toBe("127.0.0.1");
            expect(peers[0].port).toBe(4009);
        });
    });

    describe("recentlyPinged", () => {
        it("should return true after a ping", async () => {
            peer.lastPinged = null;

            expect(peer.recentlyPinged()).toBeFalse();

            const response = await peer.ping(5000);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
            expect(peer.recentlyPinged()).toBeTrue();
        });
    });

    describe("getPeers", () => {
        it("should return the list of peers", async () => {
            const peers = await peer.getPeers();
            expect(peers).toHaveLength(0);
            // TODO test when peer has peers
        });
    });

    describe("hasCommonBlocks", () => {
        it("should return true when peer has a common block", async () => {
            const commonBlocks = await peer.hasCommonBlocks([genesisBlock.data.id]);
            expect(commonBlocks).toBeTrue();
        });

        it("should return false when peer has no common block", async () => {
            const commonBlocks = await peer.hasCommonBlocks(["456321789"]);
            expect(commonBlocks).toBeFalse();
        });
    });
});
