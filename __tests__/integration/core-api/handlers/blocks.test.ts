import "../../../utils";

import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

import { Blocks } from "@arkecosystem/crypto";
import { genesisBlock } from "../../../utils/config/testnet/genesisBlock";
import { blocks2to100 } from "../../../utils/fixtures";
import { resetBlockchain } from "../../../utils/helpers";

import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";

const { BlockFactory } = Blocks;

beforeAll(async () => {
    await setUp();
    await resetBlockchain();
});

afterAll(async () => await tearDown());

describe("API 2.0 - Blocks", () => {
    describe("GET /blocks", () => {
        it("should GET all the blocks", async () => {
            const response = await utils.request("GET", "blocks");

            expect(response).toBeSuccessfulResponse();
            expect(response).toBePaginated();
            expect(response.data.data).toBeArray();

            const block = response.data.data[0];
            utils.expectBlock(block, {
                id: genesisBlock.id,
                transactions: genesisBlock.numberOfTransactions,
            });
        });
    });

    describe("GET /blocks?orderBy=height:", () => {
        it("should GET all the blocks in descending order", async () => {
            const response = await utils.request("GET", "blocks?orderBy=height:");

            expect(response).toBeSuccessfulResponse();
            expect(response).toBePaginated();
            expect(response.data.data).toBeArray();

            for (const block of response.data.data) {
                utils.expectBlock(block);
            }

            expect(response.data.data.sort((a, b) => a.height > b.height)).toEqual(response.data.data);
        });
    });

    describe("GET /blocks/:id", () => {
        it("should GET a block by the given identifier", async () => {
            const response = await utils.request("GET", `blocks/${genesisBlock.id}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            const block = response.data.data;
            utils.expectBlock(block, {
                id: genesisBlock.id,
                transactions: genesisBlock.numberOfTransactions,
            });
        });

        it("should GET a block by the given identifier and not transform it", async () => {
            const response = await utils.request("GET", "blocks/17184958558311101492", { transform: false });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data).toEqual({
                id: "17184958558311101492",
                version: 0,
                timestamp: 0,
                height: 1,
                reward: "0",
                previousBlock: "0",
                numberOfTransactions: 153,
                totalAmount: "12500000000000000",
                totalFee: "0",
                payloadLength: 35960,
                payloadHash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
                generatorPublicKey: "03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068",
                blockSignature:
                    "304402202fe5de5697fa25d3d3c0cb24617ac02ddfb1c915ee9194a89f8392f948c6076402200d07c5244642fe36afa53fb2d048735f1adfa623e8fa4760487e5f72e17d253b",
            });
        });
    });

    describe("GET /blocks/:height", () => {
        it("should GET a block by the given height", async () => {
            const response = await utils.request("GET", `blocks/${genesisBlock.height}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            const block = response.data.data;
            utils.expectBlock(block, {
                id: genesisBlock.id,
                height: genesisBlock.height,
                transactions: genesisBlock.numberOfTransactions,
            });
        });
    });

    describe("GET /blocks/:id/transactions", () => {
        it("should GET all the transactions for the given block by id", async () => {
            const response = await utils.request("GET", `blocks/${genesisBlock.id}/transactions`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            const transaction = response.data.data[0];
            utils.expectTransaction(transaction);
            expect(transaction.blockId).toBe(genesisBlock.id);
        });
    });

    describe("GET /blocks/:height/transactions", () => {
        it("should GET all the transactions for the given block by id", async () => {
            const response = await utils.request("GET", `blocks/${genesisBlock.height}/transactions`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            const transaction = response.data.data[0];
            utils.expectTransaction(transaction);
            expect(transaction.blockId).toBe(genesisBlock.id);
        });
    });

    describe("POST /blocks/search", () => {
        it("should POST a search for blocks with the exact specified blockId", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
        });

        it("should POST a search for blocks with the exact specified version", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                version: genesisBlock.version,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.version).toBe(genesisBlock.version);
        });

        it("should POST a search for blocks with the exact specified previousBlock", async () => {
            // save a new block so that we can make the request with previousBlock
            const block2 = BlockFactory.fromData(blocks2to100[0]);
            const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
            await databaseService.saveBlock(block2);

            const response = await utils.request("POST", "blocks/search", {
                id: blocks2to100[0].id,
                previousBlock: blocks2to100[0].previousBlock,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(blocks2to100[0].id);
            expect(block.previous).toBe(blocks2to100[0].previousBlock);

            await databaseService.deleteBlock(block2); // reset to genesis block
        });

        it("should POST a search for blocks with the exact specified payloadHash", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                payloadHash: genesisBlock.payloadHash,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.payload.length).toBe(genesisBlock.payloadLength);
            expect(block.payload.hash).toBe(genesisBlock.payloadHash);
        });

        it("should POST a search for blocks with the exact specified generatorPublicKey", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                generatorPublicKey: genesisBlock.generatorPublicKey,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.generator.publicKey).toBe(genesisBlock.generatorPublicKey);
        });

        it("should POST a search for blocks with the exact specified blockSignature", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                blockSignature: genesisBlock.blockSignature,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.signature).toBe(genesisBlock.blockSignature);
        });

        it("should POST a search for blocks with the exact specified timestamp", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                timestamp: {
                    from: genesisBlock.timestamp,
                    to: genesisBlock.timestamp,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
        });

        it("should POST a search for blocks with the exact specified height", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                height: {
                    from: genesisBlock.height,
                    to: genesisBlock.height,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.height).toBe(genesisBlock.height);
        });

        it("should POST a search for blocks with the specified height range", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                height: {
                    from: genesisBlock.height,
                    to: genesisBlock.height,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.height).toBe(genesisBlock.height);
        });

        it("should POST a search for blocks with the exact specified numberOfTransactions", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                numberOfTransactions: {
                    from: genesisBlock.numberOfTransactions,
                    to: genesisBlock.numberOfTransactions,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.transactions).toBe(genesisBlock.numberOfTransactions);
        });

        it("should POST a search for blocks with the specified numberOfTransactions range", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                numberOfTransactions: {
                    from: genesisBlock.numberOfTransactions,
                    to: genesisBlock.numberOfTransactions,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.transactions).toBe(genesisBlock.numberOfTransactions);
        });

        it("should POST a search for blocks with the exact specified totalAmount", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                totalAmount: { from: 1 },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
        });

        it("should POST a search for blocks with the specified totalAmount range", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                totalAmount: { from: 1 },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
        });

        it("should POST a search for blocks with the exact specified totalFee", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                totalFee: { from: 0 },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(+block.forged.fee).toBe(+genesisBlock.totalFee.toFixed());
        });

        it("should POST a search for blocks with the specified totalFee range", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                totalFee: { from: 0 },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(+block.forged.fee).toBe(+genesisBlock.totalFee.toFixed());
        });

        it("should POST a search for blocks with the exact specified reward", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                reward: {
                    from: genesisBlock.reward,
                    to: genesisBlock.reward,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(+block.forged.reward).toBe(+genesisBlock.reward.toFixed());
        });

        it("should POST a search for blocks with the specified reward range", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                reward: {
                    from: genesisBlock.reward,
                    to: genesisBlock.reward,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(+block.forged.reward).toBe(+genesisBlock.reward.toFixed());
        });

        it("should POST a search for blocks with the exact specified payloadLength", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                payloadLength: {
                    from: genesisBlock.payloadLength,
                    to: genesisBlock.payloadLength,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.payload.length).toBe(genesisBlock.payloadLength);
        });

        it("should POST a search for blocks with the specified payloadLength range", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                payloadLength: {
                    from: genesisBlock.payloadLength,
                    to: genesisBlock.payloadLength,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.payload.length).toBe(genesisBlock.payloadLength);
        });

        it("should POST a search for blocks with the wrong specified version", async () => {
            const response = await utils.request("POST", "blocks/search", {
                id: genesisBlock.id,
                version: 2,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(0);
        });

        it("should POST a search for blocks with the specific criteria", async () => {
            const response = await utils.request("POST", "blocks/search", {
                generatorPublicKey: genesisBlock.generatorPublicKey,
                version: genesisBlock.version,
                timestamp: {
                    from: genesisBlock.timestamp,
                    to: genesisBlock.timestamp,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
        });
    });
});
