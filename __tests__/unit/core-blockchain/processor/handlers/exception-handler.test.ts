import "../../../../utils";
import { ExceptionHandler } from "../../../../../packages/core-blockchain/src/processor/handlers";

import { models } from "@arkecosystem/crypto";
import { blocks2to100 } from "../../../../utils/fixtures/testnet/blocks2to100";
import { Blockchain } from "../../../../../packages/core-blockchain/src/blockchain";
import { BlockProcessorResult } from "../../../../../packages/core-blockchain/src/processor";
import { setUpFull, tearDownFull } from "../../__support__/setup";

const { Block } = models;
let app;
let blockchain: Blockchain;

beforeAll(async () => {
    app = await setUpFull();
    blockchain = app.resolvePlugin("blockchain");
});

afterAll(async () => {
    await tearDownFull();
});

describe("Exception handler", () => {
    describe("execute", () => {
        it("should reject if block has already been forged", async () => {
            const handler = new ExceptionHandler(blockchain, new Block(blocks2to100[0]));

            // @ts-ignore
            jest.spyOn(blockchain.database, "getBlock").mockReturnValueOnce(true);

            expect(await handler.execute()).toBe(BlockProcessorResult.Rejected);
        });

        it("should accept if block has not already been forged", async () => {
            const handler = new ExceptionHandler(blockchain, new Block(blocks2to100[0]));

            expect(await handler.execute()).toBe(BlockProcessorResult.Accepted);
        });
    });
});
