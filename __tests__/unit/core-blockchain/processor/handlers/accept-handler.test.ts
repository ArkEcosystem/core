import "../../mocks/";
import { blockchain } from "../../mocks/blockchain";
import { logger } from "../../mocks/logger";

import { AcceptBlockHandler } from "../../../../../packages/core-blockchain/src/processor/handlers";
import "../../../../utils";

import { models } from "@arkecosystem/crypto";
import { BlockProcessorResult } from "../../../../../packages/core-blockchain/src/processor";
import { blocks2to100 } from "../../../../utils/fixtures/testnet/blocks2to100";

const { Block } = models;

beforeAll(async () => {
    // mock apply / saveBlock - we dont want to actually do anything to the db
    // @ts-ignore
    jest.spyOn(blockchain.database, "applyBlock").mockReturnValue(true);
    // @ts-ignore
    jest.spyOn(blockchain.database, "saveBlock").mockReturnValue(true);
});

describe("Accept handler", () => {
    describe("execute", () => {
        it("should log message if we recovered from fork and update state.forkedBlock", async () => {
            const handler = new AcceptBlockHandler(blockchain as any, new Block(blocks2to100[0]));

            const loggerInfo = jest.spyOn(logger, "info");
            blockchain.state.forkedBlock = new Block(blocks2to100[0]);

            expect(await handler.execute()).toBe(BlockProcessorResult.Accepted);
            expect(loggerInfo).toHaveBeenCalledWith("Successfully recovered from fork");
            expect(blockchain.state.forkedBlock).toBe(null);
        });

        it("should log warning message if transactionPool accepChainedBlock threw an exception", async () => {
            const handler = new AcceptBlockHandler(blockchain as any, new Block(blocks2to100[0]));

            const loggerWarn = jest.spyOn(logger, "warn");
            jest.spyOn(blockchain.transactionPool, "acceptChainedBlock").mockImplementationOnce(() => {
                throw new Error("¯_(ツ)_/¯");
            });

            expect(await handler.execute()).toBe(BlockProcessorResult.Accepted);
            expect(loggerWarn).toHaveBeenCalledWith("Issue applying block to transaction pool");
        });

        it("should log error message if an exception was thrown", async () => {
            const block = new Block(blocks2to100[0]);
            const handler = new AcceptBlockHandler(blockchain as any, block);

            jest.restoreAllMocks();
            const loggerError = jest.spyOn(logger, "error");
            jest.spyOn(blockchain.database, "applyBlock").mockImplementationOnce(() => {
                throw new Error("¯_(ツ)_/¯");
            });

            expect(await handler.execute()).toBe(BlockProcessorResult.Rejected);
            expect(loggerError).toHaveBeenCalledWith(`Refused new block ${JSON.stringify(block.data)}`);
        });
    });
});
