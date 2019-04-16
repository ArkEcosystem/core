import "jest-extended";

import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p";
import { Crypto } from "@arkecosystem/crypto";
import { randomBytes } from "crypto";
import nock from "nock";
import { sendRequest } from "./__support__/request";
import { setUp, tearDown } from "./__support__/setup";

const { crypto } = Crypto;

jest.mock("is-reachable", () => jest.fn(async peer => true));

let peerMock;
let mockHost;

beforeAll(async () => {
    await setUp();

    peerMock = new Peer("1.0.0.99", 4003); // @NOTE: we use the Public API port

    app.resolvePlugin("p2p")
        .getStorage()
        .setPeer(peerMock);

    nock("http://localhost", { allowUnmocked: true });

    mockHost = nock(peerMock.url);
});

afterAll(async () => await tearDown());

afterEach(async () => nock.cleanAll());

describe("Transactions", () => {
    describe("POST transactions.info", () => {
        it("should get the transaction for the given ID", async () => {
            mockHost.get("/api/transactions/e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8").reply(
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

            expect(response.body.result.id).toBe("e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8");
        });

        it("should fail to get the transaction for the given ID", async () => {
            const response = await sendRequest("transactions.info", {
                id: "e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(
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

            expect(response.body.result.recipientId).toBe("APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn");
            expect(crypto.verify(response.body.result)).toBeTrue();
        });

        it("should create a new transaction with a vendor field and verify", async () => {
            const response = await sendRequest("transactions.create", {
                amount: 100000000,
                passphrase: "this is a top secret passphrase",
                recipientId: "APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                vendorField: "Hello World",
            });

            expect(response.body.result.recipientId).toBe("APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn");
            expect(response.body.result.vendorField).toBe("Hello World");
            expect(crypto.verify(response.body.result)).toBeTrue();
        });
    });

    describe("POST transactions.broadcast", () => {
        it("should broadcast the transaction", async () => {
            const transaction = await sendRequest("transactions.create", {
                amount: 100000000,
                recipientId: "APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                passphrase: "this is a top secret passphrase",
            });

            mockHost.post("/api/transactions").reply(200, { success: true }, peerMock.headers);

            const response = await sendRequest("transactions.broadcast", {
                id: transaction.body.result.id,
            });

            expect(crypto.verify(response.body.result)).toBeTrue();
        });

        it("should fail to broadcast the transaction", async () => {
            const response = await sendRequest("transactions.broadcast", {
                id: "e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(
                "Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.",
            );
        });
    });

    describe("POST transactions.bip38.create", () => {
        const userId: string = randomBytes(32).toString("hex");

        it("should create a new transaction", async () => {
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

            expect(response.body.result.recipientId).toBe("AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv");
            expect(crypto.verify(response.body.result)).toBeTrue();
        });

        it("should create a new transaction with a vendor field", async () => {
            const response = await sendRequest("transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId,
                amount: 1000000000,
                recipientId: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
                vendorField: "Hello World",
            });

            expect(response.body.result.recipientId).toBe("AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv");
            expect(response.body.result.vendorField).toBe("Hello World");
            expect(crypto.verify(response.body.result)).toBeTrue();
        });

        it("should fail to create a new transaction", async () => {
            const response = await sendRequest("transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId: "123456789",
                amount: 1000000000,
                recipientId: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe("User 123456789 could not be found.");
        });
    });
});
