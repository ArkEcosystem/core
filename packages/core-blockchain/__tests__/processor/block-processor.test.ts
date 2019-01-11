import "@arkecosystem/core-test-utils";
import { fixtures, generators } from "@arkecosystem/core-test-utils";
import genesisBlockTestnet from "@arkecosystem/core-test-utils/src/config/testnet/genesisBlock.json";
import { models } from "@arkecosystem/crypto";
import { Blockchain } from "../../src/blockchain";
import { setUpFull, tearDown } from "../__support__/setup";

const { Block } = models;
const { delegates } = fixtures;
const { generateTransfers } = generators;

let app;
let blockchain: Blockchain;
let blockProcessor;

beforeAll(async () => {
    app = await setUpFull();
    blockchain = app.resolvePlugin("blockchain");

    // using require here because if we import before app is set up, it ends up with some undefined references
    const { BlockProcessor } = require("../../src/processor");

    blockProcessor = new BlockProcessor(blockchain);

    await blockchain.removeBlocks(blockchain.getLastHeight() - 1);
});

afterAll(async () => {
    await tearDown();
});

describe("Block processor", () => {
    describe("process", () => {
        describe("should not accept replay transactions", () => {
            afterEach(async () => blockchain.removeBlocks(blockchain.getLastHeight() - 1)); // reset to block height 1

            const addBlock = async transactions => {
                const block = {
                    id: "17882607875259085966",
                    version: 0,
                    timestamp: 46583330,
                    height: 2,
                    reward: 0,
                    previousBlock: genesisBlockTestnet.id,
                    numberOfTransactions: 1,
                    transactions,
                    totalAmount: transactions.reduce((acc, curr) => acc + curr.amount),
                    totalFee: transactions.reduce((acc, curr) => acc + curr.fee),
                    payloadLength: 0,
                    payloadHash: genesisBlockTestnet.payloadHash,
                    generatorPublicKey: delegates[0].publicKey,
                    blockSignature:
                        "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
                    createdAt: "2019-07-11T16:48:50.550Z",
                };
                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                await blockchain.processBlock(blockVerified, () => null);

                return Object.assign(block, { id: blockVerified.data.id });
            };

            it("should not validate an already forged transaction", async () => {
                const { AlreadyForgedHandler } = require("../../src/processor/handlers/already-forged-handler");
                const { BlockProcessorResult } = require("../../src/processor");
                const transfers = generateTransfers(
                    "unitnet",
                    delegates[0].passphrase,
                    delegates[1].address,
                    11,
                    1,
                    true,
                );
                const block = await addBlock(transfers);
                block.height = 3;
                block.previousBlock = block.id;
                block.id = "17882607875259085967";
                block.timestamp += 1000;

                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof AlreadyForgedHandler).toBeTrue();

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });

            it("should not validate an already forged transaction - trying to tweak the tx id", async () => {
                const { AlreadyForgedHandler } = require("../../src/processor/handlers/already-forged-handler");
                const { BlockProcessorResult } = require("../../src/processor");
                const transfers = generateTransfers(
                    "unitnet",
                    delegates[0].passphrase,
                    delegates[1].address,
                    11,
                    1,
                    true,
                );
                const block = await addBlock(transfers);
                block.height = 3;
                block.previousBlock = block.id;
                block.id = "17882607875259085967";
                block.timestamp += 1000;
                block.transactions[0].id = "123456"; // change the tx id to try to make it accept as a new transaction

                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                const handler = await blockProcessor.getHandler(blockVerified);
                expect(handler instanceof AlreadyForgedHandler).toBeTrue();

                const result = await blockProcessor.process(blockVerified);
                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });
        });
    });
});
