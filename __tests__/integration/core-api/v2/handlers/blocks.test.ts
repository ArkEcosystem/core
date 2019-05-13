import "../../../../utils";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

import { Blocks } from "@arkecosystem/crypto";
import { genesisBlock } from "../../../../utils/config/testnet/genesisBlock";
import { blocks2to100 } from "../../../../utils/fixtures";
import { resetBlockchain } from "../../../../utils/helpers";

import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";

const { BlockFactory } = Blocks;

beforeAll(async () => {
    await setUp();
    await resetBlockchain();
});

afterAll(async () => {
    await tearDown();
});

describe("API 2.0 - Blocks", () => {
    describe("GET /blocks", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            'using the "%s" header',
            (header, request) => {
                it("should GET all the blocks", async () => {
                    const response = await utils[request]("GET", "blocks");

                    expect(response).toBeSuccessfulResponse();
                    expect(response).toBePaginated();
                    expect(response.data.data).toBeArray();

                    const block = response.data.data[0];
                    utils.expectBlock(block, {
                        id: genesisBlock.id,
                        transactions: genesisBlock.numberOfTransactions,
                    });
                });
            },
        );
    });

    describe("GET /blocks?orderBy=height:", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            'using the "%s" header',
            (header, request) => {
                it("should GET all the blocks in descending order", async () => {
                    const response = await utils[request]("GET", "blocks?orderBy=height:");

                    expect(response).toBeSuccessfulResponse();
                    expect(response).toBePaginated();
                    expect(response.data.data).toBeArray();

                    response.data.data.forEach(utils.expectBlock);
                    expect(response.data.data.sort((a, b) => a.height > b.height)).toEqual(response.data.data);
                });
            },
        );
    });

    describe("GET /blocks/:id", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET a block by the given identifier", async () => {
                    const response = await utils[request]("GET", `blocks/${genesisBlock.id}`);

                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();

                    const block = response.data.data;
                    utils.expectBlock(block, {
                        id: genesisBlock.id,
                        transactions: genesisBlock.numberOfTransactions,
                    });
                });
            },
        );
    });

    describe("GET /blocks/:height", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET a block by the given height", async () => {
                    const response = await utils[request]("GET", `blocks/${genesisBlock.height}`);

                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();

                    const block = response.data.data;
                    utils.expectBlock(block, {
                        id: genesisBlock.id,
                        height: genesisBlock.height,
                        transactions: genesisBlock.numberOfTransactions,
                    });
                });
            },
        );
    });

    describe("GET /blocks/:id/transactions", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            'using the "%s" header',
            (header, request) => {
                it("should GET all the transactions for the given block by id", async () => {
                    const response = await utils[request]("GET", `blocks/${genesisBlock.id}/transactions`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    const transaction = response.data.data[0];
                    utils.expectTransaction(transaction);
                    expect(transaction.blockId).toBe(genesisBlock.id);
                });
            },
        );
    });

    describe("GET /blocks/:height/transactions", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            'using the "%s" header',
            (header, request) => {
                it("should GET all the transactions for the given block by id", async () => {
                    const response = await utils[request]("GET", `blocks/${genesisBlock.height}/transactions`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    const transaction = response.data.data[0];
                    utils.expectTransaction(transaction);
                    expect(transaction.blockId).toBe(genesisBlock.id);
                });
            },
        );
    });

    describe("POST /blocks/search", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified blockId", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
                        id: genesisBlock.id,
                    });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    expect(response.data.data).toHaveLength(1);

                    const block = response.data.data[0];
                    utils.expectBlock(block);
                    expect(block.id).toBe(genesisBlock.id);
                });
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified version", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified previousBlock", async () => {
                    // save a new block so that we can make the request with previousBlock
                    const block2 = BlockFactory.fromData(blocks2to100[0]);
                    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
                    await databaseService.saveBlock(block2);

                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified payloadHash", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified generatorPublicKey", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified blockSignature", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified timestamp", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified height", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the specified height range", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified numberOfTransactions", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the specified numberOfTransactions range", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified totalAmount", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the specified totalAmount range", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified totalFee", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the specified totalFee range", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified reward", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the specified reward range", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the exact specified payloadLength", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the specified payloadLength range", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the wrong specified version", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
                        id: genesisBlock.id,
                        version: 2,
                    });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();

                    expect(response.data.data).toHaveLength(0);
                });
            },
        );

        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should POST a search for blocks with the specific criteria", async () => {
                    const response = await utils[request]("POST", "blocks/search", {
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
            },
        );
    });
});
