import "@arkecosystem/core-test-utils";
import { UnchainedHandler } from "../../../src/processor/handlers";

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
        it("should fork if double forging is detected", async () => {
            jest.spyOn(blockchain, "getLastBlock").mockReturnValue(new Block(blocks2to100[0]));
            // @ts-ignore
            jest.spyOn(blockchain.database, "getActiveDelegates").mockReturnValue([
                {
                    publicKey: blocks2to100[0].generatorPublicKey,
                },
            ]);
            // @ts-ignore
            const forkBlock = jest.spyOn(blockchain, "forkBlock").mockReturnValue(true);

            const sameBlockDifferentId = new Block(blocks2to100[0]);
            sameBlockDifferentId.data.id = "7536951";

            const handler = new UnchainedHandler(blockchain, sameBlockDifferentId, true);

            expect(await handler.execute()).toBe(BlockProcessorResult.Rejected);
            expect(forkBlock).toHaveBeenCalled();
        });

        it("should log that blocks are being discarded when discarding blocks with height > current + 1", async () => {
            jest.spyOn(blockchain, "getLastBlock").mockReturnValue(new Block(blocks2to100[0]));
            blockchain.processQueue.length = () => 5;

            const loggerDebug = jest.spyOn(app.resolvePlugin("logger"), "debug");

            const handler = new UnchainedHandler(blockchain, new Block(blocks2to100[5]), true);

            expect(await handler.execute()).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            expect(loggerDebug).toHaveBeenCalledWith("Discarded 5 downloaded blocks.");
        });
    });
});
