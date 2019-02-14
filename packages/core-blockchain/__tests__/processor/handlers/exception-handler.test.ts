import "@arkecosystem/core-test-utils";
import { ExceptionHandler } from "../../../src/processor/handlers";

import { models } from "@arkecosystem/crypto";
import { blocks2to100 } from "../../../../core-test-utils/src/fixtures/testnet/blocks2to100";
import { Blockchain } from "../../../src/blockchain";
import { BlockProcessorResult } from "../../../src/processor";
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
