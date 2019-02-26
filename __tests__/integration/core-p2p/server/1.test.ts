import { generateTransfers } from "../../../utils/generators/transactions/transfer";
import { models } from "@arkecosystem/crypto";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../__support__/utils";
import fullBlock from "../fixtures/block-with-transactions.json";

const { Block, Transaction } = models;

let genesisBlock;

beforeAll(async () => {
    await setUp();

    // Create the genesis block after the setup has finished or else it uses a potentially
    // wrong network config.
    genesisBlock = new Block(require("../../../utils/config/testnet/genesisBlock.json"));
});

afterAll(async () => {
    await tearDown();
});

describe("API - Version 1", () => {
    describe("GET /peer/list", () => {
        it("should be ok", async () => {
            const response = await utils.GET("peer/list");

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("success");
            expect(response.data.success).toBeTrue();

            expect(response.data).toHaveProperty("peers");
            expect(response.data.peers).toBeArray();
        });
    });

    describe("GET /peer/blocks", () => {
        it("should be ok", async () => {
            const response = await utils.GET("peer/blocks", { lastBlockHeight: 1 });

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("success");
            expect(response.data.success).toBeTrue();

            expect(response.data).toHaveProperty("blocks");
            expect(response.data.blocks).toBeArray();
        });

        it('should retrieve lastBlock if no "lastBlockHeight" specified', async () => {
            const response = await utils.GET("peer/blocks");

            expect(response.status).toBe(200);
            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("success");
            expect(response.data.success).toBeTrue();

            expect(response.data).toHaveProperty("blocks");
            expect(response.data.blocks).toBeArray();
            expect(response.data.blocks).toHaveLength(1);
        });
    });

    describe("GET /peer/height", () => {
        it("should be ok", async () => {
            const response = await utils.GET("peer/height");

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("success");
            expect(response.data.success).toBeTrue();

            expect(response.data).toHaveProperty("height");
            expect(response.data.height).toBeNumber();

            expect(response.data).toHaveProperty("id");
            expect(response.data.id).toBeString();
        });
    });

    describe("GET /peer/transactions", () => {
        it("should be ok", async () => {
            const response = await utils.GET("peer/transactions");

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("success");
            expect(response.data.success).toBeTrue();

            expect(response.data).toHaveProperty("transactions");
            expect(response.data.transactions).toBeArray();
        });
    });

    describe("GET /peer/blocks/common", () => {
        it("should be ok", async () => {
            const response = await utils.GET("peer/blocks/common", {
                ids: "17184958558311101492",
            });

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("success");
            expect(response.data.success).toBeTrue();
            expect(response.data).toHaveProperty("common");
            expect(response.data.common).toBeObject();
            expect(response.data.common.height).toBe(1);
            expect(response.data.common.id).toBe("17184958558311101492");

            expect(response.data).toHaveProperty("lastBlockHeight");
            expect(response.data.lastBlockHeight).toBeNumber();
        });
    });

    describe("GET /peer/status", () => {
        it("should be ok", async () => {
            const response = await utils.GET("peer/status");

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("success");
            expect(response.data.success).toBeTrue();
        });
    });

    describe("POST /peer/blocks", () => {
        it("should be ok", async () => {
            const block = new Block(fullBlock as any);
            const response = await utils.POST("peer/blocks", {
                block: block.toJson(),
            });

            expect(response.status).toBe(200);

            expect(response.data).toBeObject();

            expect(response.data).toHaveProperty("success");
            expect(response.data.success).toBeTrue();
        });

        it("should not be ok, because previous block id is missing", async () => {
            const response = await utils.POST("peer/blocks", {
                block: genesisBlock.toJson(),
            });

            expect(response.status).toBe(400);
        });
    });

    describe("POST /peer/transactions", () => {
        it("should succeed with an existing wallet", async () => {
            const transactions = generateTransfers(
                "testnet",
                "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
                null,
                40,
            );
            const response = await utils.POST("peer/transactions", { transactions });

            expect(response.data).toBeObject();
            expect(response.data.success).toBeTrue();
        });

        it("should fail with a cold wallet", async () => {
            const transactions = generateTransfers("testnet", "wallet does not exist");
            const response = await utils.POST("peer/transactions", { transactions });

            expect(response.data).toBeObject();
            expect(response.data.success).toBeFalse();
        });
    });
});
