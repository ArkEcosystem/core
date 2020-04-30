import "@packages/core-test-framework/src/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Managers } from "@arkecosystem/crypto";
import { ApiHelpers, Factories } from "@packages/core-test-framework/src";

import { setUp, tearDown } from "../__support__/setup";

let genesisBlock;

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);

    genesisBlock = Managers.configManager.get("genesisBlock");
});

afterAll(async () => await tearDown());

describe("API 2.0 - Blocks", () => {
    describe("GET /blocks", () => {
        it("should GET all the blocks", async () => {
            const response = await api.request("GET", "blocks");

            expect(response).toBeSuccessfulResponse();
            expect(response).toBePaginated();
            expect(response.data.data).toBeArray();

            const block = response.data.data[0];
            api.expectBlock(block, {
                id: genesisBlock.id,
                transactions: genesisBlock.numberOfTransactions,
            });
        });
    });

    describe("GET /blocks?orderBy=height:desc", () => {
        it("should GET all the blocks in descending order", async () => {
            const response = await api.request("GET", "blocks", { orderBy: "height:desc" });

            expect(response).toBeSuccessfulResponse();
            expect(response).toBePaginated();
            expect(response.data.data).toBeArray();

            for (const block of response.data.data) {
                api.expectBlock(block);
            }

            expect(response.data.data.sort((a, b) => a.height > b.height)).toEqual(response.data.data);
        });
    });

    describe("GET /blocks/first", () => {
        it("should GET the first block on the chain", async () => {
            const response = await api.request("GET", "blocks/first");

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            api.expectBlock(response.data.data, {
                id: genesisBlock.id,
                transactions: genesisBlock.numberOfTransactions,
            });
        });
    });

    describe("GET /blocks/last", () => {
        it("should GET the last block on the chain", async () => {
            const response = await api.request("GET", "blocks/last");

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            api.expectBlock(response.data.data, {
                id: genesisBlock.id,
                transactions: genesisBlock.numberOfTransactions,
            });
        });
    });

    describe("GET /blocks/:id", () => {
        it("should GET a block by the given identifier", async () => {
            const response = await api.request("GET", `blocks/${genesisBlock.id}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            const block = response.data.data;
            api.expectBlock(block, {
                id: genesisBlock.id,
                transactions: genesisBlock.numberOfTransactions,
            });
        });

        it("should GET a block by the given identifier and not transform it", async () => {
            const response = await api.request("GET", `blocks/${genesisBlock.id}`, { transform: false });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data).toEqual({
                id: genesisBlock.id,
                version: 0,
                timestamp: 0,
                height: 1,
                reward: "0",
                previousBlock: "0",
                numberOfTransactions: 153,
                totalAmount: genesisBlock.totalAmount,
                totalFee: "0",
                payloadLength: genesisBlock.payloadLength,
                payloadHash: genesisBlock.payloadHash,
                generatorPublicKey: genesisBlock.generatorPublicKey,
                blockSignature: genesisBlock.blockSignature,
            });
        });

        it("should fail to GET a block by the given identifier if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "blocks/27184958558311101492"), 404);
        });
    });

    describe("GET /blocks/:height", () => {
        it("should GET a block by the given height", async () => {
            const response = await api.request("GET", `blocks/${genesisBlock.height}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            const block = response.data.data;
            api.expectBlock(block, {
                id: genesisBlock.id,
                height: genesisBlock.height,
                transactions: genesisBlock.numberOfTransactions,
            });
        });

        it("should fail to GET a block by the given identifier if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "blocks/111111"), 404);
        });
    });

    describe("GET /blocks/:id/transactions", () => {
        it("should GET all the transactions for the given block by id", async () => {
            const response = await api.request("GET", `blocks/${genesisBlock.id}/transactions`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            const transaction = response.data.data[0];
            api.expectTransaction(transaction);
            expect(transaction.blockId).toBe(genesisBlock.id);
        });
    });

    describe("GET /blocks/:height/transactions", () => {
        it("should fail to GET all the transactions for the given block by id if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "blocks/27184958558311101492/transactions"), 404);
        });

        it("should GET all the transactions for the given block by height", async () => {
            const response = await api.request("GET", `blocks/${genesisBlock.height}/transactions`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            const transaction = response.data.data[0];
            api.expectTransaction(transaction);
            expect(transaction.blockId).toBe(genesisBlock.id);
        });

        it("should fail to GET all the transactions for the given block by height if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "blocks/111111/transactions"), 404);
        });
    });

    describe("POST /blocks/search", () => {
        it("should POST a search for blocks with the exact specified blockId", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
        });

        it("should POST a search for blocks with the exact specified version", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                version: genesisBlock.version,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.version).toBe(genesisBlock.version);
        });

        it("should POST a search for blocks with the exact specified previousBlock", async () => {
            const block2: Interfaces.IBlock = Factories.factory("Block")
                .withOptions({
                    config: Managers.configManager.all(),
                })
                .make();

            // save a new block so that we can make the request with previousBlock
            await app
                .get<Repositories.BlockRepository>(Container.Identifiers.DatabaseBlockRepository)
                .saveBlocks([block2]);

            const response = await api.request("POST", "blocks/search", {
                id: block2.data.id,
                previousBlock: block2.data.previousBlock,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(block2.data.id);
            expect(block.previous).toBe(block2.data.previousBlock);

            await app
                .get<Repositories.BlockRepository>(Container.Identifiers.DatabaseBlockRepository)
                .deleteBlocks([block2.data]); // reset to genesis block
        });

        it("should POST a search for blocks with the exact specified payloadHash", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                payloadHash: genesisBlock.payloadHash,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.payload.length).toBe(genesisBlock.payloadLength);
            expect(block.payload.hash).toBe(genesisBlock.payloadHash);
        });

        it("should POST a search for blocks with the exact specified generatorPublicKey", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                generatorPublicKey: genesisBlock.generatorPublicKey,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.generator.publicKey).toBe(genesisBlock.generatorPublicKey);
        });

        it("should POST a search for blocks with the exact specified blockSignature", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                blockSignature: genesisBlock.blockSignature,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.signature).toBe(genesisBlock.blockSignature);
        });

        it("should POST a search for blocks with the exact specified timestamp", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                timestamp: genesisBlock.timestamp,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
        });

        it("should POST a search for blocks with the exact specified height", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                height: genesisBlock.height,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.height).toBe(genesisBlock.height);
        });

        it("should POST a search for blocks with the specified height range", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                height: { from: genesisBlock.height, to: genesisBlock.height },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.height).toBe(genesisBlock.height);
        });

        it("should POST a search for blocks with the exact specified numberOfTransactions", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                numberOfTransactions: genesisBlock.numberOfTransactions,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.transactions).toBe(genesisBlock.numberOfTransactions);
        });

        it("should POST a search for blocks with the specified numberOfTransactions range", async () => {
            const response = await api.request("POST", "blocks/search", {
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
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.transactions).toBe(genesisBlock.numberOfTransactions);
        });

        it("should POST a search for blocks with the exact specified totalAmount", async () => {
            const nextBlock: Interfaces.IBlock = Factories.factory("Block")
                .withOptions({
                    config: Managers.configManager.all(),
                })
                .make();

            await app
                .get<Repositories.BlockRepository>(Container.Identifiers.DatabaseBlockRepository)
                .saveBlocks([nextBlock]);

            const response = await api.request("POST", "blocks/search", {
                id: nextBlock.data.id,
                totalAmount: +nextBlock.data.totalAmount,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(nextBlock.data.id);
        });

        it("should POST a search for blocks with the specified totalAmount range", async () => {
            const nextBlock: Interfaces.IBlock = Factories.factory("Block")
                .withOptions({
                    config: Managers.configManager.all(),
                })
                .make();

            await app
                .get<Repositories.BlockRepository>(Container.Identifiers.DatabaseBlockRepository)
                .saveBlocks([nextBlock]);

            const response = await api.request("POST", "blocks/search", {
                id: nextBlock.data.id,
                totalAmount: {
                    from: +nextBlock.data.totalAmount,
                    to: +nextBlock.data.totalAmount,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(nextBlock.data.id);
        });

        it("should POST a search for blocks with the exact specified totalFee", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                totalFee: 0,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(+block.forged.fee).toBe(+genesisBlock.totalFee);
        });

        it("should POST a search for blocks with the specified totalFee range", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                totalFee: {
                    from: genesisBlock.totalFee,
                    to: genesisBlock.totalFee,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(+block.forged.fee).toBe(+genesisBlock.totalFee);
        });

        it("should POST a search for blocks with the exact specified reward", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                reward: genesisBlock.reward,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(+block.forged.reward).toBe(+genesisBlock.reward);
        });

        it("should POST a search for blocks with the specified reward range", async () => {
            const response = await api.request("POST", "blocks/search", {
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
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(+block.forged.reward).toBe(+genesisBlock.reward);
        });

        it("should POST a search for blocks with the exact specified payloadLength", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                payloadLength: genesisBlock.payloadLength,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.payload.length).toBe(genesisBlock.payloadLength);
        });

        it("should POST a search for blocks with the specified payloadLength range", async () => {
            const response = await api.request("POST", "blocks/search", {
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
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
            expect(block.payload.length).toBe(genesisBlock.payloadLength);
        });

        it("should POST a search for blocks with the wrong specified version", async () => {
            const response = await api.request("POST", "blocks/search", {
                id: genesisBlock.id,
                version: 2,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(0);
        });

        it("should POST a search for blocks with the specific criteria", async () => {
            const response = await api.request("POST", "blocks/search", {
                generatorPublicKey: genesisBlock.generatorPublicKey,
                version: genesisBlock.version,
                timestamp: genesisBlock.timestamp,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const block = response.data.data[0];
            api.expectBlock(block);
            expect(block.id).toBe(genesisBlock.id);
        });
    });
});
