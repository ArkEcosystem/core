import "../../mocks/";
import { blockchain } from "../../mocks/blockchain";

import { ExceptionHandler } from "../../../../../packages/core-blockchain/src/processor/handlers";
import "../../../../utils";

import { models } from "@arkecosystem/crypto";
import { BlockProcessorResult } from "../../../../../packages/core-blockchain/src/processor";
import { blocks2to100 } from "../../../../utils/fixtures/testnet/blocks2to100";

const { Block } = models;

describe("Exception handler", () => {
    describe("execute", () => {
        it("should reject if block has already been forged", async () => {
            const handler = new ExceptionHandler(blockchain as any, new Block(blocks2to100[0]));

            // @ts-ignore
            jest.spyOn(blockchain.database, "getBlock").mockReturnValueOnce(true);

            expect(await handler.execute()).toBe(BlockProcessorResult.Rejected);
        });

        it("should accept if block has not already been forged", async () => {
            const handler = new ExceptionHandler(blockchain as any, new Block(blocks2to100[0]));

            expect(await handler.execute()).toBe(BlockProcessorResult.Accepted);
        });
    });
});
