import "./mocks/core-container";

import { Transaction } from "@arkecosystem/crypto";
import nock from "nock";
import { Peer } from "../../../packages/core-p2p/src/peer";
import { genesisBlock } from "../../utils/fixtures/unitnet/block-model";

let genesisTransaction;

let peerMock: Peer;

beforeAll(() => {
    genesisTransaction = Transaction.fromData(genesisBlock.transactions[0].data);
});

beforeEach(() => {
    peerMock = new Peer("1.0.0.99", 4002);
    Object.assign(peerMock, peerMock.headers);

    nock.cleanAll();
});

afterAll(() => {
    nock.cleanAll();
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

    it("it should post a block ", async () => {
        nock(peerMock.url)
            .post("/peer/blocks")
            .reply(200, { success: true }, peerMock.headers);

        const response = await peerMock.postBlock(genesisBlock.toJson());

        expect(response).toBeObject();
        expect(response).toHaveProperty("success");
        expect(response.success).toBeTrue();
    });

    describe("postTransactions", () => {
        it("should be ok", async () => {
            nock(peerMock.url)
                .post("/peer/transactions")
                .reply(200, { success: true }, peerMock.headers);

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
            nock(peerMock.url)
                .get("/peer/blocks")
                .query({ lastBlockHeight: 1 })
                .reply(200, { blocks }, peerMock.headers);

            const result = await peerMock.downloadBlocks(1);

            expect(result).toEqual(blocks);
        });

        it("should not return the blocks with status 500", async () => {
            nock(peerMock.url)
                .get("/peer/blocks")
                .query({ lastBlockHeight: 1 })
                .reply(500);

            await expect(peerMock.downloadBlocks(1)).rejects.toThrow();
        });
    });

    describe("ping", () => {
        it("should be ok", async () => {
            nock(peerMock.url)
                .get("/peer/status")
                .reply(
                    200,
                    {
                        header: {
                            height: 1,
                            id: genesisBlock.data.id,
                        },
                        success: true,
                    },
                    peerMock.headers,
                );

            const response = await peerMock.ping(5000);

            expect(response).toBeObject();
            expect(response).toHaveProperty("success");
            expect(response.success).toBeTrue();
        });

        it("should not be ok", async () => {
            nock(peerMock.url)
                .get("/peer/status")
                .reply(500, {}, peerMock.headers);

            return expect(peerMock.ping(1)).rejects.toThrowError("could not get status response");
        });

        it.each([200, 500, 503])("should update peer status from http response %i", async status => {
            nock(peerMock.url)
                .get("/peer/status")
                .reply(status, {}, peerMock.headers);

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

            nock(peerMock.url)
                .get("/peer/status")
                .reply(
                    200,
                    {
                        header: {
                            height: 1,
                            id: genesisBlock.data.id,
                        },
                        success: true,
                    },
                    peerMock.headers,
                );

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

            nock(peerMock.url)
                .get("/peer/status")
                .reply(
                    200,
                    {
                        header: {
                            height: 1,
                            id: genesisBlock.data.id,
                        },
                        success: true,
                    },
                    peerMock.headers,
                );

            nock(peerMock.url)
                .get("/peer/list")
                .reply(
                    200,
                    {
                        peers: peersMock,
                        success: true,
                    },
                    peerMock.headers,
                );

            const peers = await peerMock.getPeers();

            expect(peers).toEqual(peersMock);
        });
    });

    describe("height", () => {
        it("should update the height after download", async () => {
            const blocks = [];
            const headers = Object.assign({}, peerMock.headers, { height: 1 });

            nock(peerMock.url)
                .get("/peer/blocks")
                .query({ lastBlockHeight: 1 })
                .reply(200, { blocks }, headers);

            expect(peerMock.state.height).toBeFalsy();
            await peerMock.downloadBlocks(1);
            expect(peerMock.state.height).toBe(1);
        });

        it("should update the height after post block", async () => {
            const blocks = [{}];
            const headers = Object.assign({}, peerMock.headers, { height: 1 });

            nock(peerMock.url)
                .post("/peer/blocks")
                .reply(200, { blocks }, headers);

            expect(peerMock.state.height).toBeFalsy();
            await peerMock.postBlock(genesisBlock.toJson());
            expect(peerMock.state.height).toBe(1);
        });

        it("should update the height after post transaction", async () => {
            const transactions = [{}];
            const headers = Object.assign({}, peerMock.headers, { height: 1 });

            nock(peerMock.url)
                .post("/peer/transactions")
                .reply(200, { transactions }, headers);

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
