import { models, Transaction } from "@arkecosystem/crypto";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { Peer } from "../src/peer";
import { setUp, tearDown } from "./__support__/setup";

const axiosMock = new MockAdapter(axios);
const { Block } = models;

let genesisBlock: models.Block;
let genesisTransaction;

let peerMock: Peer;

beforeAll(async () => {
    await setUp();

    // Create the genesis block after the setup has finished or else it uses a potentially
    // wrong network config.
    genesisBlock = new Block(require("@arkecosystem/core-test-utils/src/config/testnet/genesisBlock.json"));
    genesisTransaction = Transaction.fromData(genesisBlock.transactions[0].data);
});

afterAll(async () => {
    await tearDown();
});

beforeEach(() => {
    peerMock = new Peer("1.0.0.99", 4002);
    Object.assign(peerMock, peerMock.headers);

    axiosMock.reset(); // important: resets any existing mocking behavior
});

describe("Peer", () => {
    describe("toBroadcastInfo", () => {
        it("should be ok", async () => {
            const struct = peerMock.toBroadcastInfo();

            expect(struct).toBeObject();
            expect(struct).toHaveProperty("ip");
            expect(struct).toHaveProperty("port");
            expect(struct).toHaveProperty("version");
            expect(struct).toHaveProperty("os");
            expect(struct).toHaveProperty("status");
            expect(struct).toHaveProperty("height");
            expect(struct).toHaveProperty("delay");
        });
    });

    describe("postBlock", () => {
        it("should be ok", async () => {
            axiosMock.onPost(`${peerMock.url}/peer/blocks`).reply(200, { success: true }, peerMock.headers);

            const response = await peerMock.postBlock(genesisBlock.toJson());

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
        });
    });

    describe.skip("postTransactions", () => {
        it("should be ok", async () => {
            axiosMock.onPost(`${peerMock.url}/peer/transactions`).reply(200, { success: true }, peerMock.headers);

            const response = await peerMock.postTransactions([genesisTransaction.toJson()]);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
        });
    });

    describe("downloadBlocks", () => {
        // https://github.com/facebook/jest/issues/3601
        const errorCapturer = fn =>
            fn
                .then(res => () => res)
                .catch(err => () => {
                    throw err;
                });

        it("should return the blocks with status 200", async () => {
            const blocks = [];
            axiosMock.onGet(`${peerMock.url}/peer/blocks`).reply(200, { blocks }, peerMock.headers);
            const result = await peerMock.downloadBlocks(1);

            expect(result).toEqual(blocks);
        });

        it("should not return the blocks with status 500", async () => {
            axiosMock.onGet(`${peerMock.url}/peer/blocks`).reply(500, { data: {} }, peerMock.headers);

            expect(await errorCapturer(peerMock.downloadBlocks(1))).toThrow(/request.*500/i);
        });
    });

    describe("ping", () => {
        it("should be ok", async () => {
            axiosMock.onGet(`${peerMock.url}/peer/status`).reply(() => [
                200,
                {
                    header: {
                        height: 1,
                        id: genesisBlock.data.id,
                    },
                    success: true,
                },
                peerMock.headers,
            ]);

            const response = await peerMock.ping(5000);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
        });

        it("should not be ok", async () => {
            axiosMock.onGet(`${peerMock.url}/peer/status`).reply(() => [500, {}, peerMock.headers]);
            return expect(peerMock.ping(1)).rejects.toThrowError("could not get status response");
        });

        it.each([200, 500, 503])("should update peer status from http response %i", async status => {
            axiosMock.onGet(`${peerMock.url}/peer/status`).replyOnce(() => [status, {}, peerMock.headers]);
            try {
                await peerMock.ping(1000);
                // tslint:disable-next-line:no-empty
            } catch (e) {}
            expect(peerMock.status).toBe(status);
        });
    });

    describe("recentlyPinged", () => {
        it("should be recently pinged", async () => {
            peerMock.lastPinged = null;

            expect(peerMock.recentlyPinged()).toBeFalse();

            axiosMock.onGet(`${peerMock.url}/peer/status`).reply(() => [
                200,
                {
                    header: {
                        height: 1,
                        id: genesisBlock.data.id,
                    },
                    success: true,
                },
                peerMock.headers,
            ]);

            const response = await peerMock.ping(5000);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
            expect(peerMock.recentlyPinged()).toBeTrue();
        });
    });

    describe("getPeers", () => {
        it("should be ok", async () => {
            const peersMock = [{ ip: "1.1.1.1" }];
            axiosMock.onGet(`${peerMock.url}/peer/status`).reply(() => [
                200,
                {
                    header: {
                        height: 1,
                        id: genesisBlock.data.id,
                    },
                    success: true,
                },
                peerMock.headers,
            ]);
            axiosMock.onGet(`${peerMock.url}/peer/list`).reply(() => [
                200,
                {
                    peers: peersMock,
                    success: true,
                },
                peerMock.headers,
            ]);

            const peers = await peerMock.getPeers();

            expect(peers).toEqual(peersMock);
        });
    });

    describe("height", () => {
        it("should update the height after download", async () => {
            const blocks = [];
            const headers = Object.assign({}, peerMock.headers, { height: 1 });

            axiosMock.onGet(`${peerMock.url}/peer/blocks`).reply(200, { blocks }, headers);

            expect(peerMock.state.height).toBeFalsy();
            await peerMock.downloadBlocks(1);
            expect(peerMock.state.height).toBe(1);
        });

        it("should update the height after post block", async () => {
            const blocks = [{}];
            const headers = Object.assign({}, peerMock.headers, { height: 1 });

            axiosMock.onPost(`${peerMock.url}/peer/blocks`).reply(200, { blocks }, headers);

            expect(peerMock.state.height).toBeFalsy();
            await peerMock.postBlock(genesisBlock.toJson());
            expect(peerMock.state.height).toBe(1);
        });

        it("should update the height after post transaction", async () => {
            const transactions = [{}];
            const headers = Object.assign({}, peerMock.headers, { height: 1 });

            axiosMock.onPost(`${peerMock.url}/peer/transactions`).reply(200, { transactions }, headers);

            expect(peerMock.state.height).toBeFalsy();
            await peerMock.postTransactions([genesisTransaction.toJson()]);
            expect(peerMock.state.height).toBe(1);
        });
    });

    describe("__parseHeaders", () => {
        it("should be ok", async () => {
            const headers = {
                nethash: "nethash",
                os: "os",
                version: "version",
            };

            await peerMock.__parseHeaders({ headers });

            expect(peerMock.nethash).toBe(headers.nethash);
            expect(peerMock.os).toBe(headers.os);
            expect(peerMock.version).toBe(headers.version);
        });
    });
});
