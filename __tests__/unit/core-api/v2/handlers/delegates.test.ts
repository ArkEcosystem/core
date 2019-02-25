import "@arkecosystem/core-test-utils";
import { calculateRanks, setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

import { blocks2to100 } from "../../../../../packages/core-test-utils/src/fixtures/testnet/blocks2to100";

import { Bignum, models } from "@arkecosystem/crypto";
const { Block } = models;

import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";

const delegate = {
    username: "genesis_9",
    address: "AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
    publicKey: "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647",
};

beforeAll(async () => {
    await setUp();
    await calculateRanks();
});

afterAll(async () => {
    await tearDown();
});

describe("API 2.0 - Delegates", () => {
    describe("GET /delegates", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET all the delegates", async () => {
                    const response = await utils[request]("GET", "delegates");
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    response.data.data.forEach(utils.expectDelegate);
                    expect(response.data.data.sort((a, b) => a.rank < b.rank)).toEqual(response.data.data);
                });

                it("should GET all the delegates sorted by votes,asc", async () => {
                    const wm = app.resolvePlugin("database").walletManager;
                    const wallet = wm.findByUsername("genesis_51");
                    wallet.voteBalance = new Bignum(1);
                    wm.reindex(wallet);

                    const response = await utils[request]("GET", "delegates", { orderBy: "votes:asc" });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    expect(response.data.data[0].username).toBe(wallet.username);
                    expect(response.data.data[0].votes).toBe(+wallet.voteBalance.toFixed());
                });

                it("should GET all the delegates sorted by votes,desc", async () => {
                    const wm = app.resolvePlugin("database").walletManager;
                    const wallet = wm.findByUsername("genesis_1");
                    wallet.voteBalance = new Bignum(12500000000000000);
                    wm.reindex(wallet);

                    const response = await utils[request]("GET", "delegates", { orderBy: "votes:desc" });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    expect(response.data.data[0].username).toBe(wallet.username);
                    expect(response.data.data[0].votes).toBe(+wallet.voteBalance.toFixed());
                });
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET all the delegates ordered by descending rank", async () => {
                    const response = await utils[request]("GET", "delegates", { orderBy: "rank:desc" });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    response.data.data.forEach(utils.expectDelegate);
                    expect(response.data.data.sort((a, b) => a.rank > b.rank)).toEqual(response.data.data);
                });
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET all the delegates ordered by descending productivity", async () => {
                    const response = await utils[request]("GET", "delegates", { orderBy: "productivity:desc" });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    response.data.data.forEach(utils.expectDelegate);
                    expect(
                        response.data.data.sort((a, b) => a.production.productivity > b.production.productivity),
                    ).toEqual(response.data.data);
                });
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET all the delegates ordered by descending approval", async () => {
                    const response = await utils[request]("GET", "delegates", { orderBy: "approval:desc" });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    response.data.data.forEach(utils.expectDelegate);
                    expect(response.data.data.sort((a, b) => a.production.approval > b.production.approval)).toEqual(
                        response.data.data,
                    );
                });
            },
        );
    });

    describe("GET /delegates/:id", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET a delegate by the given username", async () => {
                    const response = await utils[request]("GET", `delegates/${delegate.username}`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();

                    utils.expectDelegate(response.data.data, delegate);
                });
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET a delegate by the given address", async () => {
                    const response = await utils[request]("GET", `delegates/${delegate.address}`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();

                    utils.expectDelegate(response.data.data, delegate);
                });
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET a delegate by the given public key", async () => {
                    const response = await utils[request]("GET", `delegates/${delegate.publicKey}`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();

                    utils.expectDelegate(response.data.data, delegate);
                });
            },
        );
    });

    describe("POST /delegates/search", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for delegates with a username that matches the given string", async () => {
                    const response = await utils[request]("POST", "delegates/search", {
                        username: delegate.username,
                    });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    expect(response.data.data).toHaveLength(1);

                    utils.expectDelegate(response.data.data[0], delegate);
                });
            },
        );
    });

    describe("GET /delegates/:id/blocks", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET all blocks for a delegate by the given identifier", async () => {
                    // save a new block so that we can make the request with generatorPublicKey
                    const block2 = new Block(blocks2to100[0]);
                    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
                    await databaseService.saveBlock(block2);

                    const response = await utils[request](
                        "GET",
                        `delegates/${blocks2to100[0].generatorPublicKey}/blocks`,
                    );
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();
                    response.data.data.forEach(utils.expectBlock);

                    await databaseService.deleteBlock(block2); // reset to genesis block
                });
            },
        );
    });

    describe("GET /delegates/:id/voters", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET all voters (wallets) for a delegate by the given identifier", async () => {
                    const response = await utils[request]("GET", `delegates/${delegate.publicKey}/voters`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    response.data.data.forEach(utils.expectWallet);
                    expect(response.data.data.sort((a, b) => a.balance > b.balance)).toEqual(response.data.data);
                });
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET all voters (wallets) for a delegate by the given identifier ordered by 'balance:asc'", async () => {
                    const response = await utils[request]("GET", `delegates/${delegate.publicKey}/voters`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    response.data.data.forEach(utils.expectWallet);
                    expect(response.data.data.sort((a, b) => a.balance < b.balance)).toEqual(response.data.data);
                });
            },
        );
    });
});
