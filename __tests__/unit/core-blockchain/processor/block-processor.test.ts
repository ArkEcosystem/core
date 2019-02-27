import "../../../utils";
import { fixtures, generators } from "../../../utils";
import genesisBlockTestnet from "../../../utils/config/testnet/genesisBlock.json";
import { models } from "@arkecosystem/crypto";
import { Blockchain } from "../../../../packages/core-blockchain/src/blockchain";
import { BlockProcessor, BlockProcessorResult } from "../../../../packages/core-blockchain/src/processor";
import * as handlers from "../../../../packages/core-blockchain/src/processor/handlers";
import {
    ExceptionHandler,
    VerificationFailedHandler,
} from "../../../../packages/core-blockchain/src/processor/handlers";
import { setUpFull, tearDownFull } from "../__support__/setup";

const { Block } = models;
const { delegates } = fixtures;
const { generateTransfers } = generators;

let app;
let blockchain: Blockchain;
let blockProcessor: BlockProcessor;

beforeAll(async () => {
    app = await setUpFull();
    blockchain = app.resolvePlugin("blockchain");
    blockProcessor = new BlockProcessor(blockchain);
});

afterAll(async () => {
    await tearDownFull();
});

const resetBlocks = async () => blockchain.removeBlocks(blockchain.getLastHeight() - 1); // reset to block height 1

beforeEach(resetBlocks);
afterEach(resetBlocks);

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

            const configManager = app.getConfig();

            configManager.set("exceptions.blocks", ["998877"]);

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
        const processBlock = async transactions => {
            const block = getBlock(transactions);
            const blockVerified = new Block(block);
            blockVerified.verification.verified = true;

            await blockchain.processBlock(blockVerified, () => null);

            return Object.assign(block, { id: blockVerified.data.id });
        };

        describe("should not accept replay transactions", () => {
            it("should not validate an already forged transaction", async () => {
                const transfers = generateTransfers(
                    "unitnet",
                    delegates[0].passphrase,
                    delegates[1].address,
                    11,
                    1,
                    true,
                );
                const block = await processBlock(transfers);
                block.height = 3;
                block.previousBlock = block.id;
                block.id = "17882607875259085967";
                block.timestamp += 1000;

                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof handlers.AlreadyForgedHandler).toBeTrue();

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });

            it("should not validate an already forged transaction - trying to tweak the tx id", async () => {
                const transfers = generateTransfers(
                    "unitnet",
                    delegates[0].passphrase,
                    delegates[1].address,
                    11,
                    1,
                    true,
                );
                const block = await processBlock(transfers);
                block.height = 3;
                block.previousBlock = block.id;
                block.id = "17882607875259085967";
                block.timestamp += 1000;
                block.transactions[0].id = "5".repeat(64); // change the tx id to try to make it accept as a new transaction

                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof handlers.AlreadyForgedHandler).toBeTrue();

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });
        });

        describe("lastDownloadedBlock", () => {
            it.each([
                "AlreadyForgedHandler",
                "InvalidGeneratorHandler",
                "UnchainedHandler",
                "VerificationFailedHandler",
            ])(
                "should not increment lastDownloadedBlock or lastBlock when processing block fails with %s",
                async handler => {
                    const lastBlock = blockchain.getLastBlock();
                    const lastDownloadedBlock = blockchain.getLastDownloadedBlock();
                    const blockToProcess = new Block(blockTemplate);

                    const getHanderBackup = blockProcessor.getHandler; // save for restoring afterwards
                    blockProcessor.getHandler = jest.fn(() => new handlers[handler](blockchain, blockToProcess));

                    await blockProcessor.process(blockToProcess);

                    expect(blockchain.getLastBlock()).toEqual(lastBlock);
                    expect(blockchain.getLastDownloadedBlock()).toEqual(lastDownloadedBlock);

                    blockProcessor.getHandler = getHanderBackup; // restore original function
                },
            );
        });

        describe("Forging delegates", () => {
            it("should use InvalidGeneratorHandler if forging delegate is invalid", async () => {
                const database = app.resolvePlugin("database");
                const getActiveDelegatesBackup = database.getActiveDelegates; // save for restoring afterwards
                database.getActiveDelegates = jest.fn(() => [delegates[50]]);

                const blockVerified = new Block(getBlock([]));
                blockVerified.verification.verified = true;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof handlers.InvalidGeneratorHandler).toBeTrue();

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.Rejected);

                database.getActiveDelegates = getActiveDelegatesBackup; // restore the original function
            });
        });

        describe("Unchained blocks", () => {
            it("should 'discard but broadcast' when same block comes again", async () => {
                /* We process a valid block then try processing the same block again.
                    Should detect as "double-forging" and reject the duplicate block. */
                const blockVerified = new Block(getBlock([]));
                blockVerified.verification.verified = true;

                // accept a valid first block
                const accepted = await blockProcessor.process(blockVerified);
                expect(accepted).toBe(BlockProcessorResult.Accepted);

                // get handler on same block, should be handled by UnchainedHandler
                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof handlers.UnchainedHandler).toBeTrue();

                // if we try to process the block, it should be discarded but broadcasted
                const rejected = await blockProcessor.process(blockVerified);
                expect(rejected).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });

            it("should reject a double-forging block", async () => {
                /* We process a valid block then try processing the same block again.
                    Should detect as "double-forging" and reject the duplicate block. */
                const blockVerified = new Block(getBlock([]));
                blockVerified.verification.verified = true;

                // accept a valid first block
                const accepted = await blockProcessor.process(blockVerified);
                expect(accepted).toBe(BlockProcessorResult.Accepted);

                // new block for double-forging : same height different id
                const blockDoubleForging = new Block(getBlock([]));
                blockDoubleForging.verification.verified = true;
                blockDoubleForging.data.id = "123456";

                // get handler on the "new" block, should be handled by UnchainedHandler
                const handler = await blockProcessor.getHandler(blockDoubleForging);
                expect(handler instanceof handlers.UnchainedHandler).toBeTrue();

                // if we try to process the block, it should be rejected
                const rejected = await blockProcessor.process(blockDoubleForging);
                expect(rejected).toBe(BlockProcessorResult.Rejected);
            });

            it("should reject a block with invalid timestamp", async () => {
                const database = app.resolvePlugin("database");
                const getActiveDelegatesBackup = database.getActiveDelegates;
                database.getActiveDelegates = jest.fn(() => [delegates[0]]);

                const forkBlockBackup = blockchain.forkBlock;
                blockchain.forkBlock = jest.fn();

                const block = new Block(getBlock([]));
                block.verification.verified = true;
                block.data.timestamp = 46582922;

                blockchain.getLastBlock().data.timestamp = 46583330;

                const rejected = await blockProcessor.process(block);
                expect(blockchain.forkBlock).not.toHaveBeenCalled();
                expect(rejected).toBe(BlockProcessorResult.Rejected);

                blockchain.getLastBlock().data.timestamp = 0;
                blockchain.forkBlock = forkBlockBackup;
                database.getActiveDelegates = getActiveDelegatesBackup;
            });

            it("should 'discard but broadcast' a block higher than current height + 1", async () => {
                const blockVerified = new Block(getBlock([]));
                blockVerified.verification.verified = true;
                blockVerified.data.height = 3;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof handlers.UnchainedHandler).toBeTrue();

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });

            it("should 'discard but broadcast' a block lower than current height", async () => {
                const blockVerified = new Block(getBlock([]));
                blockVerified.verification.verified = true;

                // accept a valid first block
                const accepted = await blockProcessor.process(blockVerified);
                expect(accepted).toBe(BlockProcessorResult.Accepted);

                // new block with height < current
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
