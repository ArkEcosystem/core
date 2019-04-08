import "../mocks/";
import { blockchain } from "../mocks/blockchain";
import { database } from "../mocks/database";

import { blocks, configManager } from "@arkecosystem/crypto";
import { BlockProcessor, BlockProcessorResult } from "../../../../packages/core-blockchain/src/processor";
import * as handlers from "../../../../packages/core-blockchain/src/processor/handlers";
import {
    ExceptionHandler,
    VerificationFailedHandler,
} from "../../../../packages/core-blockchain/src/processor/handlers";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import "../../../utils";
import { fixtures } from "../../../utils";
import genesisBlockTestnet from "../../../utils/config/testnet/genesisBlock.json";

const { Block } = blocks;
const { delegates } = fixtures;

let blockProcessor: BlockProcessor;

beforeAll(async () => {
    blockProcessor = new BlockProcessor(blockchain as any);
});

describe("Block processor", () => {
    const blockTemplate = {
        id: "17882607875259085966",
        version: 0,
        timestamp: 46583330,
        height: 2,
        reward: 0,
        previousBlock: genesisBlockTestnet.id,
        numberOfTransactions: 1,
        transactions: [],
        totalAmount: 0,
        totalFee: 0,
        payloadLength: 0,
        payloadHash: genesisBlockTestnet.payloadHash,
        generatorPublicKey: delegates[0].publicKey,
        blockSignature:
            "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
        createdAt: "2019-07-11T16:48:50.550Z",
    };

    describe("getHandler", () => {
        it("should return ExceptionHandler if block is an exception", async () => {
            const exceptionBlock = new Block(blockTemplate);
            exceptionBlock.data.id = "998877";

            jest.spyOn(configManager, "get").mockReturnValueOnce(["998877"]);

            expect(await blockProcessor.getHandler(exceptionBlock)).toBeInstanceOf(ExceptionHandler);
        });

        it("should return VerificationFailedHandler if block failed verification", async () => {
            const failedVerifBlock = new Block(blockTemplate);
            failedVerifBlock.verification.verified = false;

            expect(await blockProcessor.getHandler(failedVerifBlock)).toBeInstanceOf(VerificationFailedHandler);
        });
    });

    describe("process", () => {
        const getBlock = transactions =>
            Object.assign({}, blockTemplate, {
                transactions,
                totalAmount: transactions.reduce((acc, curr) => acc + curr.amount, 0),
                totalFee: transactions.reduce((acc, curr) => acc + curr.fee, 0),
                numberOfTransactions: transactions.length,
            });

        describe("should not accept replay transactions", () => {
            let block;
            beforeEach(() => {
                const transfers = TransactionFactory.transfer(delegates[1].address)
                    .withNetwork("unitnet")
                    .withPassphrase(delegates[0].passphrase)
                    .create(11);

                const lastBlock = new Block(getBlock(transfers));

                block = getBlock(transfers);
                block.height = 3;
                block.previousBlock = lastBlock.data.id;
                block.timestamp += 1000;

                jest.spyOn(blockchain, "getLastBlock").mockReturnValue(lastBlock);
                jest.spyOn(database, "getForgedTransactionsIds").mockReturnValue([blockTemplate.id]);
            });
            afterEach(() => {
                jest.restoreAllMocks();
            });

            it("should not validate an already forged transaction", async () => {
                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler).toBeInstanceOf(handlers.AlreadyForgedHandler);

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });

            it("should not validate an already forged transaction - trying to tweak the tx id", async () => {
                block.transactions[0].id = "5".repeat(64); // change the tx id to try to make it accept as a new transaction

                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler).toBeInstanceOf(handlers.AlreadyForgedHandler);

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });
        });

        describe("lastDownloadedBlock", () => {
            let resetLastDownloadedBlock;
            beforeEach(() => {
                jest.spyOn(blockchain, "getLastBlock").mockReturnValueOnce({
                    // @ts-ignore
                    data: {
                        height: 1,
                    },
                });

                resetLastDownloadedBlock = jest.spyOn(blockchain, "resetLastDownloadedBlock");
            });
            afterEach(() => {
                jest.restoreAllMocks();
            });

            it.each([
                "AlreadyForgedHandler",
                "InvalidGeneratorHandler",
                "UnchainedHandler",
                "VerificationFailedHandler",
            ])("should call resetLastDownloadedBlock when processing block fails with %s", async handler => {
                const blockToProcess = new Block(blockTemplate);

                const getHanderBackup = blockProcessor.getHandler; // save for restoring afterwards
                blockProcessor.getHandler = jest.fn(() => new handlers[handler](blockchain, blockToProcess));

                await blockProcessor.process(blockToProcess);

                expect(resetLastDownloadedBlock).toHaveBeenCalledTimes(1);

                blockProcessor.getHandler = getHanderBackup; // restore original function
            });
        });

        describe("Forging delegates", () => {
            let block;
            beforeEach(() => {
                const lastBlock = new Block(getBlock([]));

                block = getBlock([]);
                block.height = 3;
                block.previousBlock = lastBlock.data.id;
                block.timestamp += 1000;

                jest.spyOn(blockchain, "getLastBlock").mockReturnValue(lastBlock);
            });
            afterEach(() => {
                jest.restoreAllMocks();
            });

            it("should use InvalidGeneratorHandler if forging delegate is invalid", async () => {
                const getActiveDelegatesBackup = database.getActiveDelegates; // save for restoring afterwards
                database.getActiveDelegates = jest.fn(() => [delegates[50]]);

                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof handlers.InvalidGeneratorHandler).toBeTrue();

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.Rejected);

                database.getActiveDelegates = getActiveDelegatesBackup; // restore the original function
            });
        });

        describe("Unchained blocks", () => {
            beforeEach(() => {
                const lastBlock = new Block(getBlock([]));

                jest.spyOn(blockchain, "getLastBlock").mockReturnValue(lastBlock);
            });
            afterEach(() => {
                jest.restoreAllMocks();
            });

            it("should 'discard but broadcast' when same block comes again", async () => {
                /* We process a valid block then try processing the same block again.
                    Should detect as "double-forging" and reject the duplicate block. */
                const block = getBlock([]);
                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                // same block as last block, should be handled by UnchainedHandler
                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof handlers.UnchainedHandler).toBeTrue();

                // if we try to process the block, it should be discarded but broadcasted
                const rejected = await blockProcessor.process(blockVerified);
                expect(rejected).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });

            it("should reject a double-forging block", async () => {
                // new block for double-forging : same height different id
                const blockVerified = new Block(getBlock([]));
                blockVerified.data.id = "1111";
                blockVerified.verification.verified = true;

                // get handler on the "new" block, should be handled by UnchainedHandler
                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof handlers.UnchainedHandler).toBeTrue();

                // if we try to process the block, it should be rejected
                const rejected = await blockProcessor.process(blockVerified);
                expect(rejected).toBe(BlockProcessorResult.Rejected);
            });

            it("should reject a block with invalid timestamp", async () => {
                const getActiveDelegatesBackup = database.getActiveDelegates;
                database.getActiveDelegates = jest.fn(() => [delegates[0]]);

                const forkBlockBackup = blockchain.forkBlock;
                blockchain.forkBlock = jest.fn();

                const block = new Block(getBlock([]));
                block.verification.verified = true;
                block.data.timestamp -= 100;
                block.data.height = 3;

                const rejected = await blockProcessor.process(block);
                expect(blockchain.forkBlock).not.toHaveBeenCalled();
                expect(rejected).toBe(BlockProcessorResult.Rejected);

                blockchain.forkBlock = forkBlockBackup;
                database.getActiveDelegates = getActiveDelegatesBackup;
            });

            it("should 'discard but broadcast' a block higher than current height + 1", async () => {
                const blockVerified = new Block(getBlock([]));
                blockVerified.verification.verified = true;
                blockVerified.data.height = 4;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof handlers.UnchainedHandler).toBeTrue();

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });

            it("should 'discard but broadcast' a block lower than current height", async () => {
                // new block with height < last block
                const blockLowerHeight = new Block(getBlock([]));
                blockLowerHeight.verification.verified = true;
                blockLowerHeight.data.id = "123456";
                blockLowerHeight.data.height = 1;

                // get handler on the "new" block, should be handled by UnchainedHandler
                const handler = await blockProcessor.getHandler(blockLowerHeight);
                expect(handler instanceof handlers.UnchainedHandler).toBeTrue();

                // if we try to process the block, it should be 'discarded but can be broadcasted'
                const result = await blockProcessor.process(blockLowerHeight);
                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });
        });
    });
});
