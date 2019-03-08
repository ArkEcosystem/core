import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p/dist/peer";
import { crypto } from "@arkecosystem/crypto";
import "jest-extended";
import nock from "nock";
import { sendRequest } from "./__support__/request";
import { setUp, tearDown } from "./__support__/setup";

jest.mock("is-reachable", () => jest.fn(async peer => true));

let peerMock;

beforeAll(async () => {
    await setUp();

    peerMock = new Peer("1.0.0.99", 4002);
    Object.assign(peerMock, peerMock.headers, { status: "OK" });

    const monitor = app.resolvePlugin("p2p");
    monitor.peers = {};
    monitor.peers[peerMock.ip] = peerMock;
});

afterAll(async () => {
    await tearDown();
});

afterEach(async () => {
    nock.cleanAll();
});

describe("Transactions", () => {
    describe("POST transactions.info", () => {
        it("should get the transaction for the given ID", async () => {
            nock(/.*/)
                .get("/api/transactions")
                .reply(
                    200,
                    {
                        data: {
                            id: "e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8",
                        },
                    },
                    peerMock.headers,
                );

            const response = await sendRequest("transactions.info", {
                id: "e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8",
            });

            expect(response.data.result.id).toBe("e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8");
        });

        it("should fail to get the transaction for the given ID", async () => {
            const response = await sendRequest("transactions.info", {
                id: "e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8",
            });

            expect(response.data.error.code).toBe(404);
            expect(response.data.error.message).toBe(
                "Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.",
            );
        });
    });

    describe("POST transactions.create", () => {
        it("should create a new transaction and verify", async () => {
            const response = await sendRequest("transactions.create", {
                amount: 100000000,
                recipientId: "APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.data.result.recipientId).toBe("APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn");
            expect(crypto.verify(response.data.result)).toBeTrue();
        });
    });

    describe("POST transactions.broadcast", () => {
        it("should broadcast the transaction", async () => {
            const transaction = await sendRequest("transactions.create", {
                amount: 100000000,
                recipientId: "APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                passphrase: "this is a top secret passphrase",
            });

            nock(/.*/)
                .post("/api/transactions")
                .reply(200, { success: true }, peerMock.headers);

            const response = await sendRequest("transactions.broadcast", {
                id: transaction.data.result.id,
            });

            expect(crypto.verify(response.data.result)).toBeTrue();
        });

        it("should fail to broadcast the transaction", async () => {
            const response = await sendRequest("transactions.broadcast", {
                id: "e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8",
            });

            expect(response.data.error.code).toBe(404);
            expect(response.data.error.message).toBe(
                "Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.",
            );
        });
    });

    describe("POST transactions.bip38.create", () => {
        it("should create a new transaction", async () => {
            const userId = require("crypto")
                .randomBytes(32)
                .toString("hex");
            await sendRequest("wallets.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId,
            });

            const response = await sendRequest("transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId,
                amount: 1000000000,
                recipientId: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
            });

            expect(response.data.result.recipientId).toBe("AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv");
            expect(crypto.verify(response.data.result)).toBeTrue();
        });

        it("should fail to create a new transaction", async () => {
            const response = await sendRequest("transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId: "123456789",
                amount: 1000000000,
                recipientId: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
            });

            expect(response.data.error.code).toBe(404);
            expect(response.data.error.message).toBe("User 123456789 could not be found.");
        });
    });
});
