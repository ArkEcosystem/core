import "@arkecosystem/core-test-utils";
import { AcceptBlockHandler } from "../../../src/processor/handlers";

import { models } from "@arkecosystem/crypto";
import { blocks2to100 } from "../../../../core-test-utils/src/fixtures/testnet/blocks2to100";
import { Blockchain } from "../../../src/blockchain";
import { BlockProcessorResult } from "../../../src/processor";
import { setUpFull, tearDownFull } from "../../__support__/setup";

const { Block } = models;
let app;
let blockchain: Blockchain;
let logger;

beforeAll(async () => {
    app = await setUpFull();
    blockchain = app.resolvePlugin("blockchain");
    logger = app.resolvePlugin("logger");

    // mock apply / saveBlock - we dont want to actually do anything to the db
    // @ts-ignore
    jest.spyOn(blockchain.database, "applyBlock").mockReturnValue(true);
    // @ts-ignore
    jest.spyOn(blockchain.database, "saveBlock").mockReturnValue(true);
});

afterAll(async () => {
    await tearDownFull();
});

describe("Accept handler", () => {
    describe("execute", () => {
        it("should log message if we recovered from fork and update state.forkedBlock", async () => {
            const handler = new AcceptBlockHandler(blockchain, new Block(blocks2to100[0]));

            const loggerInfo = jest.spyOn(logger, "info");
            blockchain.state.forkedBlock = new Block(blocks2to100[0]);

            expect(await handler.execute()).toBe(BlockProcessorResult.Accepted);
            expect(loggerInfo).toHaveBeenCalledWith("Successfully recovered from fork");
            expect(blockchain.state.forkedBlock).toBe(null);
        });

        it("should log warning message if transactionPool accepChainedBlock threw an exception", async () => {
            const handler = new AcceptBlockHandler(blockchain, new Block(blocks2to100[0]));

            const loggerWarn = jest.spyOn(logger, "warn");
            jest.spyOn(blockchain.transactionPool, "acceptChainedBlock").mockImplementationOnce(() => {
                throw new Error("¯_(ツ)_/¯");
            });

            expect(await handler.execute()).toBe(BlockProcessorResult.Accepted);
            expect(loggerWarn).toHaveBeenCalledWith("Issue applying block to transaction pool");
        });

        it("should log error message if an exception was thrown", async () => {
            const block = new Block(blocks2to100[0]);
            const handler = new AcceptBlockHandler(blockchain, block);

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
