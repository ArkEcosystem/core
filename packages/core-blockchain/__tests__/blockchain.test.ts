/* tslint:disable:max-line-length */
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import "@arkecosystem/core-test-utils";
import { blocks101to155 } from "@arkecosystem/core-test-utils/src/fixtures/testnet/blocks101to155";
import { blocks2to100 } from "@arkecosystem/core-test-utils/src/fixtures/testnet/blocks2to100";
import { crypto, models, slots } from "@arkecosystem/crypto";
import { asValue } from "awilix";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import delay from "delay";
import { Blockchain } from "../dist/blockchain";
import { defaults } from "../dist/defaults";
import { setUp, tearDown } from "./__support__/setup";

const axiosMock = new MockAdapter(axios);
const { Block, Wallet } = models;

let genesisBlock;
let configManager;
let container;
let blockchain: Blockchain;
let logger;
let loggerDebugBackup;
let peerMock;

beforeAll(async () => {
    container = await setUp();

    // Backup logger.debug function as we are going to mock it in the test suite
    logger = container.resolve("logger");
    loggerDebugBackup = logger.debug;

    // Mock peer responses so that we can have blocks
    __mockPeer();

    // Create the genesis block after the setup has finished or else it uses a potentially
    // wrong network config.
    genesisBlock = new Block(require("@arkecosystem/core-test-utils/src/config/testnet/genesisBlock.json"));

    configManager = container.getConfig();

    // Workaround: Add genesis transactions to the exceptions list, because they have a fee of 0
    // and otherwise don't pass validation.
    configManager.set("exceptions.transactions", genesisBlock.transactions.map(tx => tx.id));

    // Manually register the blockchain and start it
    await __start();
});

afterAll(async () => {
    axiosMock.reset();

    configManager.set("exceptions.transactions", []);

    await __resetToHeight1();

    // Manually stop the blockchain
    await blockchain.stop();

    await tearDown();
});

afterEach(async () => {
    // Restore original logger.debug function
    logger.debug = loggerDebugBackup;

    await __resetBlocksInCurrentRound();
});

describe("Blockchain", () => {
    describe("dispatch", () => {
        it("should be ok", () => {
            const nextState = blockchain.dispatch("START");

            expect(blockchain.state.blockchain).toEqual(nextState);
        });
    });

    describe("start", () => {
        it("should be ok", async () => {
            process.env.CORE_SKIP_BLOCKCHAIN = "false";

            const started = await blockchain.start(true);

            expect(started).toBeTrue();
        });
    });

    describe("checkNetwork", () => {
        it("should throw an exception", () => {
            expect(() => blockchain.checkNetwork()).toThrow("Method [checkNetwork] not implemented!");
        });
    });

    describe("rebuild", () => {
        it("should throw an exception", () => {
            expect(() => blockchain.rebuild()).toThrow("Method [rebuild] not implemented!");
        });
    });

    describe("postTransactions", () => {
        it("should be ok", async () => {
            const transactionsWithoutType2 = genesisBlock.transactions.filter(tx => tx.type !== 2);

            blockchain.transactionPool.flush();
            await blockchain.postTransactions(transactionsWithoutType2);
            const transactions = blockchain.transactionPool.getTransactions(0, 200);

            expect(transactions.length).toBe(transactionsWithoutType2.length);

            expect(transactions).toEqual(transactionsWithoutType2.map(transaction => transaction.serialized));

            blockchain.transactionPool.flush();
        });
    });

    describe("handleIncomingBlock", () => {
        it("should be ok", async () => {
            const block = new Block(blocks101to155[54]);

            await blockchain.handleIncomingBlock(blocks101to155[54]);

            expect(blockchain.state.lastDownloadedBlock).toEqual(block);
        });
    });

    describe("rollbackCurrentRound", () => {
        it("should rollback", async () => {
            await blockchain.rollbackCurrentRound();
            expect(blockchain.getLastBlock().data.height).toBe(153);
        });
    });

    describe("removeBlocks", () => {
        it("should remove blocks", async () => {
            const lastBlockHeight = blockchain.getLastBlock().data.height;

            await blockchain.removeBlocks(2);
            expect(blockchain.getLastBlock().data.height).toBe(lastBlockHeight - 2);
        });
    });

    describe("rebuildBlock", () => {
        it("should rebuild with a known block", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();

            await blockchain.rebuildBlock(lastBlock, mockCallback);
            await delay(2000); // wait a bit to give enough time for the callback to be called

            expect(mockCallback.mock.calls.length).toBe(1);
        });

        it("should rebuild with a new chained block", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();

            await blockchain.removeBlocks(1); // remove 1 block so that we can add it then as a chained block

            expect(blockchain.getLastBlock()).not.toEqual(lastBlock);

            await blockchain.rebuildBlock(lastBlock, mockCallback);
            await delay(2000); // wait a bit to give enough time for the callback to be called

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(blockchain.getLastBlock()).toEqual(lastBlock);
        });
    });

    describe("processBlock", () => {
        it("should process a new chained block", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();

            await blockchain.removeBlocks(1); // remove 1 block so that we can add it then as a chained block

            expect(blockchain.getLastBlock()).not.toEqual(lastBlock);

            await blockchain.processBlock(lastBlock, mockCallback);
            await delay(2000); // wait a bit to give enough time for the callback to be called

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(blockchain.getLastBlock()).toEqual(lastBlock);
        });

        it("should process a valid block already known", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();

            await blockchain.processBlock(lastBlock, mockCallback);
            await delay(2000); // wait a bit to give enough time for the callback to be called

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(blockchain.getLastBlock()).toEqual(lastBlock);
        });
    });

    describe("acceptChainedBlock", () => {
        it.skip("should process a new chained block", async () => {
            const lastBlock = blockchain.getLastBlock();

            await blockchain.removeBlocks(1); // remove 1 block so that we can add it then as a chained block

            expect(await blockchain.database.getLastBlock()).not.toEqual(lastBlock);

            // await blockchain.acceptChainedBlock(lastBlock);

            expect(await blockchain.database.getLastBlock()).toEqual(lastBlock);

            // manually set lastBlock because acceptChainedBlock doesn't do it
            blockchain.state.setLastBlock(lastBlock);
        });
    });

    describe("manageUnchainedBlock", () => {
        it.skip("should process a new unchained block", async () => {
            const mockLoggerDebug = jest.fn(message => true);
            logger.debug = mockLoggerDebug;

            const lastBlock = blockchain.getLastBlock();
            await blockchain.removeBlocks(2); // remove 2 blocks so that we can have _lastBlock_ as an unchained block
            // await blockchain.manageUnchainedBlock(lastBlock);

            expect(mockLoggerDebug).toHaveBeenCalled();

            const debugMessage = `Blockchain not ready to accept new block at height ${lastBlock.data.height.toLocaleString()}. Last block: ${(
                lastBlock.data.height - 2
            ).toLocaleString()} :warning:`;
            expect(mockLoggerDebug).toHaveBeenCalledWith(debugMessage);

            expect(blockchain.getLastBlock().data.height).toBe(lastBlock.data.height - 2);
        });
    });

    describe("getUnconfirmedTransactions", () => {
        it("should get unconfirmed transactions", async () => {
            const transactionsWithoutType2 = genesisBlock.transactions.filter(tx => tx.type !== 2);

            blockchain.transactionPool.flush();
            await blockchain.postTransactions(transactionsWithoutType2);
            const unconfirmedTransactions = blockchain.getUnconfirmedTransactions(200);

            expect(unconfirmedTransactions.transactions.length).toBe(transactionsWithoutType2.length);

            expect(unconfirmedTransactions.transactions).toEqual(
                transactionsWithoutType2.map(transaction => transaction.serialized),
            );

            blockchain.transactionPool.flush();
        });
    });

    describe("getLastBlock", () => {
        it("should be ok", () => {
            blockchain.state.setLastBlock(genesisBlock);

            expect(blockchain.getLastBlock()).toEqual(genesisBlock);
        });
    });

    describe("handleIncomingBlock", () => {
        it("should be ok", () => {
            const dispatch = blockchain.dispatch;
            const enqueueBlocks = blockchain.enqueueBlocks;
            blockchain.dispatch = jest.fn(() => true);
            blockchain.enqueueBlocks = jest.fn(() => true);

            const block = {
                height: 100,
                timestamp: slots.getEpochTime(),
            };

            blockchain.handleIncomingBlock(block);

            expect(blockchain.dispatch).toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        });

        it("should not handle block from future slot", () => {
            const dispatch = blockchain.dispatch;
            const enqueueBlocks = blockchain.enqueueBlocks;
            blockchain.dispatch = jest.fn(() => true);
            blockchain.enqueueBlocks = jest.fn(() => true);

            const block = {
                height: 100,
                timestamp: slots.getSlotTime(slots.getNextSlot()),
            };

            blockchain.handleIncomingBlock(block);

            expect(blockchain.dispatch).not.toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).not.toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        });
    });

    describe("isSynced", () => {
        describe("with a block param", () => {
            it("should be ok", () => {
                expect(
                    blockchain.isSynced({
                        data: {
                            timestamp: slots.getTime(),
                            height: genesisBlock.height,
                        },
                    } as models.IBlock),
                ).toBeTrue();
            });
        });

        describe("without a block param", () => {
            it("should use the last block", () => {
                blockchain.getLastBlock = jest.fn().mockReturnValueOnce({
                    data: {
                        timestamp: slots.getTime(),
                        height: genesisBlock.height,
                    },
                });
                expect(blockchain.isSynced()).toBeTrue();
                expect(blockchain.getLastBlock).toHaveBeenCalled();
            });
        });
    });

    describe("isRebuildSynced", () => {
        describe("with a block param", () => {
            it("should be ok", () => {
                expect(
                    blockchain.isRebuildSynced({
                        data: {
                            timestamp: slots.getTime() - 3600 * 24 * 6,
                            height: blocks101to155[52].height,
                        },
                    } as models.IBlock),
                ).toBeTrue();
            });
        });

        describe("without a block param", () => {
            it("should use the last block", () => {
                blockchain.getLastBlock = jest.fn().mockReturnValueOnce({
                    data: {
                        timestamp: slots.getTime(),
                        height: genesisBlock.height,
                    },
                });
                expect(blockchain.isRebuildSynced()).toBeTrue();
                expect(blockchain.getLastBlock).toHaveBeenCalled();
            });
        });
    });

    describe("__registerQueue", () => {
        it("should be ok", () => {
            blockchain.__registerQueue();

            expect(blockchain).toHaveProperty("queue");
            expect(blockchain).toHaveProperty("processQueue");
            expect(blockchain).toHaveProperty("rebuildQueue");
        });
    });
});

async function __start() {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";
    process.env.CORE_ENV = "false";

    const plugin = require("../src").plugin;

    blockchain = await plugin.register(container, {
        networkStart: false,
        ...defaults,
    });

    await container.register(
        "blockchain",
        asValue({
            name: "blockchain",
            version: "0.1.0",
            plugin: blockchain,
            options: {},
        }),
    );

    const p2p = container.resolve("p2p");
    await p2p.acceptNewPeer(peerMock);

    await __resetToHeight1();

    await blockchain.start(true);
    while (!blockchain.getLastBlock() || blockchain.getLastBlock().data.height < 155) {
        await delay(1000);
    }
}

async function __resetBlocksInCurrentRound() {
    await blockchain.database.loadBlocksFromCurrentRound();
}

async function __resetToHeight1() {
    const lastBlock = await blockchain.database.getLastBlock();
    if (lastBlock) {
        // Make sure the wallet manager has been fed or else revertRound
        // cannot determine the previous delegates. This is only necessary, because
        // the database is not dropped after the unit tests are done.
        await blockchain.database.buildWallets(lastBlock.data.height);

        // Index the genesis wallet or else revert block at height 1 fails
        const generator = crypto.getAddress(genesisBlock.data.generatorPublicKey);
        const genesis = new Wallet(generator);
        genesis.publicKey = genesisBlock.data.generatorPublicKey;
        genesis.username = "genesis";
        blockchain.database.walletManager.reindex(genesis);

        blockchain.state.clear();

        blockchain.state.setLastBlock(lastBlock);
        await __resetBlocksInCurrentRound();
        await blockchain.removeBlocks(lastBlock.data.height - 1);
    }
}

function __mockPeer() {
    // Mocking a peer which will send blocks until height 155
    peerMock = new Peer("1.0.0.99", 4002);
    Object.assign(peerMock, peerMock.headers, { status: 200 });

    axiosMock
        .onGet(/.*\/peer\/blocks\/common.*/)
        .reply(() => [200, { status: 200, success: true, common: true }, peerMock.headers]);
    axiosMock.onGet(/.*\/peer\/blocks/).reply(config => {
        let blocks = [];

        if (config.params.lastBlockHeight === 1) {
            blocks = blocks2to100;
        } else if (config.params.lastBlockHeight === 100) {
            blocks = blocks101to155;
        }

        return [200, { status: 200, success: true, blocks }, peerMock.headers];
    });
    axiosMock
        .onGet(/.*\/peer\/status/)
        .reply(() => [200, { status: 200, success: true, height: 155 }, peerMock.headers]);
    axiosMock.onGet(/.*\/peer\/list/).reply(() => [
        200,
        {
            success: true,
            peers: [
                {
                    status: 200,
                    ip: peerMock.ip,
                    port: 4002,
                    height: 155,
                    delay: 8,
                },
            ],
        },
        peerMock.headers,
    ]);
}
