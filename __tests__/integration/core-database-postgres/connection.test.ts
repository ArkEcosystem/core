import "jest-extended";

import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { Blocks } from "@arkecosystem/crypto";
import { genesisBlock } from "../../utils/config/testnet/genesisBlock";
import { setUp, tearDown } from "./__support__/setup";

const { Block } = Blocks;

let databaseService: Database.IDatabaseService;

beforeAll(async () => {
    await setUp();

    databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    await databaseService.saveBlock(Block.fromData(genesisBlock));
});

afterAll(async () => {
    await tearDown();
});

describe("Connection", () => {
    describe("verifyBlockchain", () => {
        it("should be valid - no errors - when verifying blockchain", async () => {
            await expect(databaseService.verifyBlockchain()).resolves.toBeTrue();
        });
    });

    describe("getLastBlock", () => {
        it("should get the genesis block as last block", async () => {
            await expect(databaseService.getLastBlock()).resolves.toEqual(Block.fromData(genesisBlock));
        });
    });
});
