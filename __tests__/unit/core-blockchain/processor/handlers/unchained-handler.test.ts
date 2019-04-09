import "../../mocks/";

import { models } from "@arkecosystem/crypto";
import { BlockProcessorResult } from "../../../../../packages/core-blockchain/src/processor";
import { UnchainedHandler } from "../../../../../packages/core-blockchain/src/processor/handlers";
import "../../../../utils";
import { blocks2to100 } from "../../../../utils/fixtures/testnet/blocks2to100";
import { blockchain } from "../../mocks/blockchain";
import { logger } from "../../mocks/logger";

const { Block } = models;

describe("Exception handler", () => {
    describe("execute", () => {
        it("should fork if double forging is detected", async () => {
            jest.spyOn(blockchain, "getLastBlock").mockReturnValue(Block.fromData(blocks2to100[0]));
            // @ts-ignore
            jest.spyOn(blockchain.database, "getActiveDelegates").mockReturnValue([
                {
                    publicKey: blocks2to100[0].generatorPublicKey,
                },
            ]);
            // @ts-ignore
            const forkBlock = jest.spyOn(blockchain, "forkBlock").mockReturnValue(true);

            const sameBlockDifferentId = Block.fromData(blocks2to100[0]);
            sameBlockDifferentId.data.id = "7536951";

            const handler = new UnchainedHandler(blockchain as any, sameBlockDifferentId, true);

            expect(await handler.execute()).toBe(BlockProcessorResult.Rejected);
            expect(forkBlock).toHaveBeenCalled();
        });

        it("should log that blocks are being discarded when discarding blocks with height > current + 1", async () => {
            jest.spyOn(blockchain, "getLastBlock").mockReturnValue(Block.fromData(blocks2to100[0]));
            blockchain.queue.length = () => 5;

            const loggerDebug = jest.spyOn(logger, "debug");

            const handler = new UnchainedHandler(blockchain as any, Block.fromData(blocks2to100[5]), true);

            expect(await handler.execute()).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            expect(loggerDebug).toHaveBeenCalledWith("Discarded 5 downloaded blocks.");
        });
    });
});
