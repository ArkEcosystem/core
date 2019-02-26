import { generateTransfers } from "@arkecosystem/core-test-utils/src/generators/transactions/transfer";
import { models, Transaction } from "@arkecosystem/crypto";
import blockFixture from "../../../core-debugger-cli/__tests__/__fixtures__/block.json";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../__support__/utils";

const { Block } = models;

let genesisBlock: models.Block;
let genesisTransaction;

beforeAll(async () => {
    await setUp();

    // Create the genesis block after the setup has finished or else it uses a potentially
    // wrong network config.
    genesisBlock = new Block(require("@arkecosystem/core-test-utils/src/config/testnet/genesisBlock.json"));
    genesisTransaction = Transaction.fromData(genesisBlock.transactions[0].data);
});

beforeEach(() => {
    utils.headers["x-auth"] = "forger";
});

afterAll(async () => {
    delete utils.headers["x-auth"];
    await tearDown();
});

describe("API - Internal", () => {
    describe("GET /rounds/current", () => {
        it("should be ok", async () => {
            const response = await utils.GET("internal/rounds/current");

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("data");
        });

        it("should return 403 without x-auth", async () => {
            delete utils.headers["x-auth"];
            const response = await utils.GET("internal/rounds/current");

            expect(response.status).toBe(403);
        });
    });

    describe("POST /blocks", () => {
        it("should be ok", async () => {
            const block = new Block(blockFixture.data);
            const response = await utils.POST("internal/blocks", {
                block: block.toJson(),
            });
            expect(response.status).toBe(204);
        });

        it("should return 403 without x-auth", async () => {
            delete utils.headers["x-auth"];
            const response = await utils.POST("internal/blocks", {
                block: genesisBlock.toJson(),
            });

            expect(response.status).toBe(403);
        });
    });

    describe("POST /transactions/verify", () => {
        it("should be ok", async () => {
            const transaction = generateTransfers("testnet")[0];
            const response = await utils.POST("internal/transactions/verify", {
                transaction: Transaction.toBytes(transaction.data).toString("hex"),
            });

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("data");
        });

        it("should return 403 without x-auth", async () => {
            delete utils.headers["x-auth"];
            const response = await utils.POST("internal/transactions/verify", {
                transaction: genesisTransaction,
            });

            expect(response.status).toBe(403);
        });
    });

    describe("GET /transactions/forging", () => {
        it("should be ok", async () => {
            const response = await utils.GET("internal/transactions/forging");

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("data");
        });

        it("should return 403 without x-auth", async () => {
            delete utils.headers["x-auth"];
            const response = await utils.GET("internal/transactions/forging");

            expect(response.status).toBe(403);
        });
    });

    describe("GET /network/state", () => {
        it("should be ok", async () => {
            const response = await utils.GET("internal/network/state");

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("data");
        });

        it("should return 403 without x-auth", async () => {
            delete utils.headers["x-auth"];
            const response = await utils.GET("internal/network/state");

            expect(response.status).toBe(403);
        });
    });
});
