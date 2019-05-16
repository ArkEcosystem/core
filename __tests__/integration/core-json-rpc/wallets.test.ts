import "jest-extended";

import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p";
import nock from "nock";
import { sendRequest } from "./__support__/request";
import { setUp, tearDown } from "./__support__/setup";

jest.mock("is-reachable", () => jest.fn(async peer => true));

let peerMock;
let mockHost;

beforeAll(async () => {
    await setUp();

    peerMock = new Peer("1.0.0.99");
    peerMock.ports.p2p = 4003;
    peerMock.ports.api = 4003;

    app.resolvePlugin("p2p")
        .getStorage()
        .setPeer(peerMock);

    nock("http://localhost", { allowUnmocked: true });

    mockHost = nock(peerMock.url);
});

afterAll(async () => await tearDown());

beforeEach(async () => {
    nock(peerMock.url)
        .get("/api/loader/autoconfigure")
        .reply(200, { network: {} });
});

afterEach(async () => nock.cleanAll());

describe("Wallets", () => {
    describe("POST wallets.info", () => {
        it("should get information about the given wallet", async () => {
            mockHost
                .get("/api/wallets/AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv")
                .reply(200, { data: { address: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv" } });

            const response = await sendRequest("wallets.info", {
                address: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
            });

            expect(response.body.result.address).toBe("AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv");
        });

        it("should fail to get information about the given wallet", async () => {
            mockHost.get("/api/wallets/AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv").reply(404, {
                error: {
                    code: 404,
                    message: "Wallet AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv could not be found.",
                },
            });

            const response = await sendRequest("wallets.info", {
                address: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe("Wallet AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv could not be found.");
        });
    });

    describe("POST wallets.transactions", () => {
        it("should get the transactions for the given wallet", async () => {
            mockHost
                .get("/api/transactions")
                .query({
                    offset: 0,
                    orderBy: "timestamp:desc",
                    ownerId: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
                })
                .reply(200, { meta: { totalCount: 2 }, data: [{ id: "123" }, { id: "1234" }] });

            const response = await sendRequest("wallets.transactions", {
                address: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
            });

            expect(response.body.result.count).toBe(2);
            expect(response.body.result.data).toHaveLength(2);
        });

        it("should fail to get transactions for the given wallet", async () => {
            mockHost
                .get("/api/transactions")
                .query({
                    offset: 0,
                    orderBy: "timestamp:desc",
                    ownerId: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
                })
                .reply(200, { meta: { totalCount: 0 }, data: [] });

            const response = await sendRequest("wallets.transactions", {
                address: "AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe("Wallet AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv could not be found.");
        });
    });

    describe("POST wallets.create", () => {
        it("should create a new wallet", async () => {
            const response = await sendRequest("wallets.create", {
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.address).toBe("AGeYmgbg2LgGxRW2vNNJvQ88PknEJsYizC");
            expect(response.body.result.publicKey).toBe(
                "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
            );
        });
    });

    describe("POST wallets.bip38.*", () => {
        let bip38wif;
        const userId = require("crypto")
            .randomBytes(32)
            .toString("hex");

        describe("create", () => {
            it("should create a new wallet", async () => {
                const response = await sendRequest("wallets.bip38.create", {
                    bip38: "this is a top secret passphrase",
                    userId,
                });

                expect(response.body.result).toHaveProperty("address");
                expect(response.body.result).toHaveProperty("publicKey");
                expect(response.body.result).toHaveProperty("wif");

                bip38wif = response.body.result.wif;
            });
        });

        describe("info", () => {
            it("should find the wallet for the given userId", async () => {
                const response = await sendRequest("wallets.bip38.info", {
                    bip38: "this is a top secret passphrase",
                    userId,
                });

                expect(response.body.result).toHaveProperty("address");
                expect(response.body.result).toHaveProperty("publicKey");
                expect(response.body.result).toHaveProperty("wif");
                expect(response.body.result.wif).toBe(bip38wif);
            });

            it("should fail to find the wallet for the given userId", async () => {
                const response = await sendRequest("wallets.bip38.info", {
                    bip38: "invalid",
                    userId: "123456789",
                });

                expect(response.body.error.code).toBe(404);
                expect(response.body.error.message).toBe("User 123456789 could not be found.");
            });
        });
    });
});
