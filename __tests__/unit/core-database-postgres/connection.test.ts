import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { models } from "@arkecosystem/crypto";
import genesisBlock from "../../utils/config/testnet/genesisBlock.json";

const { Block } = models;

let databaseService: Database.IDatabaseService;

beforeAll(async () => {
    databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    await databaseService.saveBlock(new Block(genesisBlock));
});

describe("Connection", () => {
    describe("verifyBlockchain", () => {
        it("should be valid - no errors - when verifying blockchain", async () => {
            expect(await databaseService.verifyBlockchain()).toEqual({
                valid: true,
                errors: [],
            });
        });
    });

    describe("getLastBlock", () => {
        it("should get the genesis block as last block", async () => {
            const lastBlock = await databaseService.getLastBlock();

            expect(lastBlock).toEqual(new Block(genesisBlock as any));
        });
    });
});
