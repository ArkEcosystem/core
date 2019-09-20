import "jest-extended";

import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Blocks, Interfaces, Managers } from "@arkecosystem/crypto";
import { genesisBlock } from "../../utils/config/testnet/genesisBlock";
import { setUp, tearDown } from "./__support__/setup";

const { BlockFactory } = Blocks;

let databaseService: Database.IDatabaseService;

beforeAll(async () => {
    await setUp();
    databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
});

afterAll(async () => {
    await tearDown();
});

describe("Connection", () => {
    describe("init", () => {
        it("should delete last 5 bad blocks", async () => {
            const state: State.IStateService = app.resolvePlugin<State.IStateService>("state");
            const blocks: Interfaces.IBlockData[] = [];
            for (let i = 0; i < 10; i++) {
                blocks.push({ height: i + 1, id: "dddd" + i } as Interfaces.IBlockData);
            }
            blocks.push(state.getStore().getLastBlock().data);

            jest.spyOn(databaseService.connection.blocksRepository, "latest").mockImplementation(async () =>
                blocks.shift(),
            );

            expect(state.getStore().getLastBlock().data.height).toEqual(1);
            await expect(databaseService.init()).toResolve();
            expect(state.getStore().getLastBlock().data.height).toEqual(1);

            jest.restoreAllMocks();
        });
    });

    describe("verifyBlockchain", () => {
        it("should be valid - no errors - when verifying blockchain", async () => {
            await expect(databaseService.verifyBlockchain()).resolves.toBeTrue();
        });
    });

    describe("getLastBlock", () => {
        it("should get the genesis block as last block", async () => {
            Managers.configManager.getMilestone().aip11 = false;
            await expect(databaseService.getLastBlock()).resolves.toEqual(BlockFactory.fromData(genesisBlock));
            Managers.configManager.getMilestone().aip11 = true;
        });
    });
});
