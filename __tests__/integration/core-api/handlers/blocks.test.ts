import "@packages/core-test-framework/src/matchers";

import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

import { Blocks, Managers } from "@arkecosystem/crypto";
import { resetBlockchain } from "@packages/core-test-framework/src/utils/helpers";

import { app, Contracts, Container } from "@arkecosystem/core-kernel";
import { generateBlocks } from "../__support__/utils/generate-block";

const { BlockFactory } = Blocks;

let genesisBlock;

beforeAll(async () => {
    Managers.configManager.setFromPreset("unitnet");

    genesisBlock = Managers.configManager.get("genesisBlock");

    await setUp();

    await resetBlockchain();
});

afterAll(tearDown);

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

    describe("GET /blocks/first", () => {
        it("should GET the first block on the chain", async () => {
            const response = await utils.request("GET", "blocks/first");

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            utils.expectBlock(response.data.data, {
                id: genesisBlock.id,
                transactions: genesisBlock.numberOfTransactions,
            });
        });
    });

    describe("GET /blocks/last", () => {
        it("should GET the last block on the chain", async () => {
            const response = await utils.request("GET", "blocks/last");

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            utils.expectBlock(response.data.data, {
                id: genesisBlock.id,
                transactions: genesisBlock.numberOfTransactions,
            });
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
            const response = await utils.request("GET", `blocks/${genesisBlock.id}`, { transform: false });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data).toEqual({
                id: "10448331309043170968",
                version: 0,
                timestamp: 0,
                height: 1,
                reward: "0",
                previousBlock: "0",
                numberOfTransactions: 153,
                totalAmount: "15300000000000000",
                totalFee: "0",
                payloadLength: 35976,
                payloadHash: "c7d8b69da7de617e62703097d4c16dece7c261cf24fb37f966cb7c8779b236d2",
                generatorPublicKey: "03485dd4f27e970c5812d3ae99df15d1be0cdb05de6b9dfca5d4316b88b4a2206d",
                blockSignature:
                    "30440220596e7b3128118187b3117919db362e2bc1f17604d2c1cd17550000e446d947820220423941dbbd029185e17d7e9248585247e6d7594296661611d29dae66b7ab2089",
            });
        });

        it("should fail to GET a block by the given identifier if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "blocks/27184958558311101492"), 404);
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

        it("should fail to GET a block by the given identifier if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "blocks/111111"), 404);
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
        it("should fail to GET all the transactions for the given block by id if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "blocks/27184958558311101492/transactions"), 404);
        });

        it("should GET all the transactions for the given block by height", async () => {
            const response = await utils.request("GET", `blocks/${genesisBlock.height}/transactions`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            const transaction = response.data.data[0];
            utils.expectTransaction(transaction);
            expect(transaction.blockId).toBe(genesisBlock.id);
        });

        it("should fail to GET all the transactions for the given block by height if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "blocks/111111/transactions"), 404);
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
            const block2 = BlockFactory.fromJson(generateBlocks()[0]);

            // save a new block so that we can make the request with previousBlock
            await app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService).saveBlock(block2);

            const response = await utils.request("POST", "blocks/search", {
                id: block2.data.id,
                previousBlock: block2.data.previousBlock,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            utils.expectBlock(block);
            expect(block.id).toBe(block2.data.id);
            expect(block.previous).toBe(block2.data.previousBlock);

            await app
                .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
                .deleteBlocks([block2.data]); // reset to genesis block
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
            expect(+block.forged.fee).toBe(+genesisBlock.totalFee);
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
            expect(+block.forged.fee).toBe(+genesisBlock.totalFee);
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
            expect(+block.forged.reward).toBe(+genesisBlock.reward);
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
            expect(+block.forged.reward).toBe(+genesisBlock.reward);
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
