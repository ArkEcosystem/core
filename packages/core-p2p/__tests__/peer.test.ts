import { generators } from "@arkecosystem/core-test-utils";
import socketCluster from "socketcluster-client";
import { delegates } from "../../core-test-utils/src/fixtures";

import { setUpFull, tearDownFull } from "./__support__/setup";

import { fork } from "child_process";
import delay from "delay";

let genesisBlockJSON;

let peerMock;
let localConfig;
let mockServer;
let socket;
let emit;
let addMock;
let resetAllMocks;

beforeAll(async () => {
    await setUpFull();

    genesisBlockJSON = require("@arkecosystem/core-test-utils/src/config/testnet/genesisBlock.json");

    // launching a "mock socket server" so that we can mock a peer
    mockServer = fork(__dirname + "/__support__/mock-socket-server/index.js");

    await delay(2000);

    // client socket so we can send mocking instructions to our mock server
    socket = socketCluster.create({
        port: 4009,
        hostname: "127.0.0.1",
    });

    emit = async (event, data) =>
        new Promise((resolve, reject) => {
            socket.emit(event, data, (err, val) => (err ? reject(err) : resolve(val)));
        });

    addMock = async (endpoint, mockData, headers?) =>
        emit("mock.add", {
            endpoint: `p2p.peer.${endpoint}`,
            value: {
                data: mockData,
                headers: headers || {
                    version: "2.2.0-beta.4",
                    port: 4000,
                    nethash: "27acac9ce53a648f05ba43cdee17454ebb891f205a98196ad6a0ed761abc8e48",
                    height: 1,
                    "Content-Type": "application/json",
                    hashid: "a4e0e642",
                },
            },
        });
    resetAllMocks = async () => emit("mock.resetAll", {});

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
    peerMock = new Peer("127.0.0.1", 4009);
});

describe("Peer", () => {
    afterEach(async () => resetAllMocks());

    describe("postBlock", () => {
        it("should get back success when posting genesis block", async () => {
            await addMock("postBlock", { success: true });
            const response = await peerMock.postBlock(genesisBlockJSON);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
        });
    });

    describe("postTransactions", () => {
        it("should be ok", async () => {
            await addMock("postTransactions", { success: true });
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
            await addMock("getBlocks", { blocks: [genesisBlockJSON] });
            const response = await peerMock.downloadBlocks(1);

            expect(response).toBeArrayOfSize(1);
            expect(response[0].id).toBe(genesisBlockJSON.id);
        });
    });

    describe("ping", () => {
        it("should be ok", async () => {
            const mockStatus = {
                success: true,
                height: 1,
                forgingAllowed: true,
                currentSlot: 1,
                header: {},
            };
            await addMock("getStatus", mockStatus);
            process.env.CORE_SKIP_PEER_STATE_VERIFICATION = "true";

            const status = await peerMock.ping(1000);

            expect(status).toEqual(mockStatus);
        });

        it.skip("when ping request timeouts", async () => {
            await resetAllMocks();
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
                header: {},
            };
            await addMock("getStatus", mockStatus);

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
            await addMock("getPeers", { peers: peersMock });
            const peers = await peerMock.getPeers();
            expect(peers).toEqual(peersMock);
        });
    });

    describe("hasCommonBlocks", () => {
        it("should return false when peer has no common block", async () => {
            await addMock("getCommonBlocks", { success: true, common: null });
            const commonBlocks = await peerMock.hasCommonBlocks([genesisBlockJSON.id]);
            expect(commonBlocks).toBeFalse();
        });

        it("should return true when peer has common block", async () => {
            await resetAllMocks();
            await addMock("getCommonBlocks", { success: true, common: genesisBlockJSON });
            const commonBlocks = await peerMock.hasCommonBlocks([genesisBlockJSON.id]);
            expect(commonBlocks).toEqual(genesisBlockJSON);
        });
    });
});
