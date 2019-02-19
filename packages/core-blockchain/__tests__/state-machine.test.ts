import "@arkecosystem/core-test-utils";
import { roundCalculator } from "@arkecosystem/core-utils";
import { slots } from "@arkecosystem/crypto";
import { Block } from "@arkecosystem/crypto/dist/models";
import { asValue } from "awilix";
import { Blockchain } from "../src/blockchain";
import { stateStorage } from "../src/state-storage";
import { config as localConfig } from "./../src/config";
import { setUp, tearDown } from "./__support__/setup";

let stateMachine;
let container;
let blockchain: Blockchain;

beforeAll(async () => {
    container = await setUp();

    process.env.CORE_SKIP_BLOCKCHAIN = "true";
    process.env.CORE_ENV = "";

    // Manually register the blockchain
    const plugin = require("../src").plugin;

    blockchain = await plugin.register(container, {
        networkStart: false,
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

    stateMachine = require("../src/state-machine").stateMachine;
});

afterAll(async () => {
    // Manually stop  the blockchain
    await blockchain.stop();

    await tearDown();
});

beforeEach(async () => {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";
    blockchain.resetState();
});

describe("State Machine", () => {
    describe("actionMap", () => {
        let actionMap;

        beforeEach(() => {
            actionMap = stateMachine.actionMap(blockchain);
        });

        describe("checkLater", () => {
            it('should dispatch the event "WAKEUP" after a delay', async () => {
                jest.useFakeTimers();
                blockchain.dispatch = jest.fn();

                actionMap.checkLater();
                expect(blockchain.dispatch).not.toBeCalled();

                jest.runAllTimers();
                expect(blockchain.dispatch).toHaveBeenCalled();
                expect(blockchain.dispatch).toHaveBeenCalledWith("WAKEUP");

                jest.useRealTimers(); // restore standard timers
            });
        });

        describe("checkLastBlockSynced", () => {
            it('should dispatch the event "SYNCED" if the blockchain is synced', () => {
                blockchain.isSynced = jest.fn(() => true);
                expect(actionMap.checkLastBlockSynced).toDispatch(blockchain, "SYNCED");
            });

            it('should dispatch the event "NOTSYNCED" if the blockchain is not synced', () => {
                blockchain.isSynced = jest.fn(() => false);
                expect(() => actionMap.checkLastBlockSynced()).toDispatch(blockchain, "NOTSYNCED");
            });
        });

        describe("checkRebuildBlockSynced", () => {
            it('should dispatch the event "SYNCED" if the blockchain is synced after a rebuild', () => {
                blockchain.isRebuildSynced = jest.fn(() => true);
                expect(() => actionMap.checkRebuildBlockSynced()).toDispatch(blockchain, "SYNCED");
            });

            it('should dispatch the event "NOTSYNCED" if the blockchain is not synced after a rebuild', () => {
                blockchain.isRebuildSynced = jest.fn(() => false);
                expect(() => actionMap.checkRebuildBlockSynced()).toDispatch(blockchain, "NOTSYNCED");
            });
        });

        describe("checkLastDownloadedBlockSynced", () => {
            it('should dispatch the event "NOTSYNCED" by default', async () => {
                blockchain.isSynced = jest.fn(() => false);
                blockchain.processQueue.length = jest.fn(() => 1);
                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "NOTSYNCED");
            });

            it('should dispatch the event "PAUSED" if the blockchain rebuild / process queue is more than 10000 long', async () => {
                blockchain.isSynced = jest.fn(() => false);
                blockchain.rebuildQueue.length = jest.fn(() => 10001);
                blockchain.processQueue.length = jest.fn(() => 1);
                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "PAUSED");

                blockchain.rebuildQueue.length = jest.fn(() => 1);
                blockchain.processQueue.length = jest.fn(() => 10001);
                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "PAUSED");
            });

            it('should dispatch the event "NETWORKHALTED" if stateStorage.noBlockCounter > 5 and process queue is empty', async () => {
                blockchain.isSynced = jest.fn(() => false);
                blockchain.processQueue.length = jest.fn(() => 0);
                stateStorage.noBlockCounter = 6;
                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "NETWORKHALTED");
            });

            it(`should dispatch the event "FORK" if
                    - stateStorage.noBlockCounter > 5 and process queue is empty
                    - stateStorage.p2pUpdateCounter + 1 > 3 (network keeps missing blocks)
                    - blockchain.p2p.updatePeersOnMissingBlocks() returns "rollback"`, async () => {
                blockchain.isSynced = jest.fn(() => false);
                blockchain.processQueue.length = jest.fn(() => 0);
                stateStorage.noBlockCounter = 6;
                stateStorage.p2pUpdateCounter = 3;
                // @ts-ignore
                jest.spyOn(blockchain.p2p, "updatePeersOnMissingBlocks").mockImplementation(() => "rollback");

                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "FORK");
            });

            it('should dispatch the event "SYNCED" if stateStorage.networkStart is true', async () => {
                blockchain.isSynced = jest.fn(() => false);
                stateStorage.noBlockCounter = 0;
                stateStorage.networkStart = true;
                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "SYNCED");
            });

            it('should dispatch the event "TEST" if process.env.CORE_ENV === "test"', async () => {
                const coreEnv = process.env.CORE_ENV;
                process.env.CORE_ENV = "test";
                blockchain.isSynced = jest.fn(() => false);
                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "TEST");

                process.env.CORE_ENV = coreEnv;
            });
        });

        describe("downloadFinished", () => {
            describe("if the network has started", () => {
                it('should dispatch the event "SYNCFINISHED"', () => {
                    stateMachine.state.networkStart = true;
                    expect(actionMap.downloadFinished).toDispatch(blockchain, "SYNCFINISHED");
                });

                it("should toggle its state", () => {
                    stateMachine.state.networkStart = true;
                    actionMap.downloadFinished();
                    expect(stateMachine.state.networkStart).toBe(false);
                });
            });

            describe("if the network has not started", () => {
                it("should not do anything", () => {
                    stateMachine.state.networkStart = false;
                    expect(() => actionMap.downloadFinished()).not.toDispatch(blockchain, "SYNCFINISHED");
                    expect(stateMachine.state.networkStart).toBe(false);
                });
            });
        });

        describe("rebuildFinished", () => {
            it('should dispatch the event "PROCESSFINISHED"', async () => {
                localConfig.set("state.maxLastBlocks", 50);
                const config = container.getConfig();
                const genesisBlock = config.get("genesisBlock");

                stateStorage.setLastBlock(new Block(genesisBlock));

                await expect(actionMap.rebuildFinished).toDispatch(blockchain, "PROCESSFINISHED");
            });

            it('should dispatch the event "FAILURE" when some called method threw an exception', async () => {
                jest.spyOn(blockchain.database, "commitQueuedQueries").mockImplementationOnce(() => {
                    throw new Error("oops");
                });
                await expect(actionMap.rebuildFinished).toDispatch(blockchain, "FAILURE");
            });
        });

        describe("downloadPaused", () => {
            it('should log the info message "Blockchain download paused"', () => {
                const logger = container.resolvePlugin("logger");
                const loggerInfo = jest.spyOn(logger, "info");
                actionMap.downloadPaused();
                expect(loggerInfo).lastCalledWith("Blockchain download paused :clock1030:");
            });
        });

        describe("syncingComplete", () => {
            it('should dispatch the event "SYNCFINISHED"', () => {
                expect(() => actionMap.syncingComplete()).toDispatch(blockchain, "SYNCFINISHED");
            });
        });

        describe("rebuildingComplete", () => {
            it('should dispatch the event "REBUILDCOMPLETE"', () => {
                expect(() => actionMap.rebuildingComplete()).toDispatch(blockchain, "REBUILDCOMPLETE");
            });
        });

        describe("stopped", () => {
            it('should log the info message "The blockchain has been stopped"', () => {
                const logger = container.resolvePlugin("logger");
                const loggerInfo = jest.spyOn(logger, "info");
                actionMap.stopped();
                expect(loggerInfo).lastCalledWith("The blockchain has been stopped :guitar:");
            });
        });

        describe("exitApp", () => {
            it("should call container forceExit with error message", () => {
                const forceExit = jest.spyOn(container, "forceExit").mockImplementationOnce(() => null);
                actionMap.exitApp();
                expect(forceExit).lastCalledWith("Failed to startup blockchain. Exiting Ark Core! :rotating_light:");
            });
        });

        describe("init", () => {
            let databaseMocks: any = {};
            let loggerInfo;
            let loggerError;
            let loggerWarn;

            beforeAll(() => {
                const logger = container.resolvePlugin("logger");
                loggerInfo = jest.spyOn(logger, "info");
                loggerError = jest.spyOn(logger, "error");
                loggerWarn = jest.spyOn(logger, "warn");
            });

            beforeEach(() => {
                databaseMocks = {
                    getLastBlock: jest.spyOn(blockchain.database, "getLastBlock").mockReturnValue({
                        // @ts-ignore
                        data: {
                            height: 1,
                            timestamp: slots.getTime(),
                        },
                    }),
                    // @ts-ignore
                    saveBlock: jest.spyOn(blockchain.database, "saveBlock").mockReturnValue(true),
                    verifyBlockchain: jest.spyOn(blockchain.database, "verifyBlockchain").mockReturnValue({
                        // @ts-ignore
                        valid: true,
                    }),
                    // @ts-ignore
                    deleteRound: jest.spyOn(blockchain.database, "deleteRound").mockReturnValue(true),
                    // @ts-ignore
                    buildWallets: jest.spyOn(blockchain.database, "buildWallets").mockReturnValue(true),
                    // @ts-ignore
                    saveWallets: jest.spyOn(blockchain.database, "saveWallets").mockReturnValue(true),
                    // @ts-ignore
                    applyRound: jest.spyOn(blockchain.database, "applyRound").mockReturnValue(true),
                    // @ts-ignore
                    getActiveDelegates: jest.spyOn(blockchain.database, "getActiveDelegates").mockReturnValue(true),
                };
            });

            afterEach(() => jest.resetAllMocks());
            afterAll(() => {
                jest.restoreAllMocks();

                process.env.NODE_ENV = "TEST";
            });

            it("should get genesis block from config if there is no last block in database", async () => {
                jest.spyOn(blockchain.database, "getLastBlock").mockReturnValue(null);

                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(databaseMocks.saveBlock).toHaveBeenCalled();
            });

            it("should dispatch FAILURE if there is no last block in database and genesis block payload hash != configured nethash", async () => {
                jest.spyOn(blockchain.database, "getLastBlock").mockReturnValue(null);
                const config = container.getConfig();
                const genesisBlock = config.get("genesisBlock");
                const mockConfigGet = jest
                    .spyOn(config, "get")
                    .mockImplementation(key => (key === "genesisBlock" ? genesisBlock : ""));

                await expect(() => actionMap.init()).toDispatch(blockchain, "FAILURE");

                mockConfigGet.mockRestore();
            });

            it("should verify database integrity if database recovery was not successful (!restoredDatabaseIntegrity)", async () => {
                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(loggerInfo).nthCalledWith(1, "Verifying database integrity :hourglass_flowing_sand:");
                expect(loggerInfo).nthCalledWith(2, "Verified database integrity :smile_cat:");
            });

            it("should dispatch ROLLBACK if database recovery was not successful and verifyBlockchain failed", async () => {
                jest.spyOn(blockchain.database, "verifyBlockchain").mockReturnValue({
                    // @ts-ignore
                    valid: false,
                });

                await expect(() => actionMap.init()).toDispatch(blockchain, "ROLLBACK");
                expect(loggerError).nthCalledWith(1, "FATAL: The database is corrupted :fire:");
            });

            it("should skip database integrity check if database recovery was successful (restoredDatabaseIntegrity)", async () => {
                blockchain.database.restoredDatabaseIntegrity = true;

                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(loggerInfo).nthCalledWith(
                    1,
                    "Skipping database integrity check after successful database recovery :smile_cat:",
                );
            });

            it("should dispatch STARTED if networkStart is enabled", async () => {
                stateStorage.networkStart = true;

                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(databaseMocks.buildWallets).toHaveBeenCalledWith(1);
                expect(databaseMocks.saveWallets).toHaveBeenCalledWith(true);
                expect(databaseMocks.applyRound).toHaveBeenCalledWith(1);

                stateStorage.networkStart = false; // reset to default value
            });

            it('should dispatch STARTED if NODE_ENV === "test"', async () => {
                process.env.NODE_ENV = "test";
                const logger = container.resolvePlugin("logger");
                const loggerVerbose = jest.spyOn(logger, "verbose");

                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(databaseMocks.buildWallets).toHaveBeenCalledWith(1);
                expect(loggerVerbose).toHaveBeenCalledWith(
                    "TEST SUITE DETECTED! SYNCING WALLETS AND STARTING IMMEDIATELY. :bangbang:",
                );
            });

            it("should dispatch REBUILD if stateStorage.fastRebuild", async () => {
                process.env.NODE_ENV = "";

                // mock getLastBlock() timestamp and fastRebuild config to trigger stateStorage.fastRebuild = true
                jest.spyOn(blockchain.database, "getLastBlock").mockReturnValue({
                    // @ts-ignore
                    data: {
                        height: 1,
                        timestamp: 0,
                    },
                });
                const mockConfigGet = jest
                    .spyOn(localConfig, "get")
                    .mockImplementation(key => (key === "fastRebuild" ? true : ""));

                await expect(() => actionMap.init()).toDispatch(blockchain, "REBUILD");

                mockConfigGet.mockRestore();
            });

            it("should rollbackCurrentRound and dispatch STARTED if couldnt get activeDelegates", async () => {
                process.env.NODE_ENV = "";
                jest.spyOn(blockchain.database, "getActiveDelegates").mockReturnValue(undefined);
                const spyRollbackCurrentRound = jest.spyOn(blockchain, "rollbackCurrentRound").mockReturnThis();

                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(spyRollbackCurrentRound).toHaveBeenCalled();
            });

            it("should rebuild wallets table and dispatch STARTED if database.buildWallets() failed", async () => {
                process.env.NODE_ENV = "";
                jest.spyOn(blockchain.database, "getLastBlock").mockReturnValue({
                    // @ts-ignore
                    data: {
                        height: 2,
                        timestamp: slots.getTime(),
                    },
                });
                // @ts-ignore
                jest.spyOn(blockchain.database, "buildWallets").mockReturnValue(false);

                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(loggerWarn).toHaveBeenCalledWith(
                    "Rebuilding wallets table because of some inconsistencies. Most likely due to an unfortunate shutdown. :hammer:",
                );
                expect(databaseMocks.saveWallets).toHaveBeenCalledWith(true);
            });

            it("should clean round data if new round starts at block.height + 1 (and dispatch STARTED)", async () => {
                process.env.NODE_ENV = "";
                const spyIsNewRound = jest.spyOn(roundCalculator, "isNewRound").mockReturnValue(true);

                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(databaseMocks.deleteRound).toHaveBeenCalled();
                expect(loggerInfo).toHaveBeenCalledWith(
                    "New round 1 detected. Cleaning calculated data before restarting!",
                );

                spyIsNewRound.mockRestore();
            });

            it("should log error and dispatch FAILURE if an exception was thrown", async () => {
                jest.spyOn(blockchain.database, "getLastBlock").mockImplementation(() => {
                    throw new Error("oops");
                });

                await expect(() => actionMap.init()).toDispatch(blockchain, "FAILURE");
                expect(loggerError.mock.calls[0][0]).toContain("Error: oops");
            });
        });

        describe("rebuildBlocks", () => {
            let genesisBlock;

            beforeAll(() => {
                const config = container.getConfig();
                genesisBlock = config.get("genesisBlock");
            });

            it("should dispatch NOBLOCK if no new blocks were downloaded from peer", async () => {
                stateStorage.lastDownloadedBlock = new Block(genesisBlock);

                const logger = container.resolvePlugin("logger");
                const loggerInfo = jest.spyOn(logger, "info");

                jest.spyOn(blockchain.p2p, "downloadBlocks").mockReturnValue([]);
                await expect(() => actionMap.rebuildBlocks()).toDispatch(blockchain, "NOBLOCK");
                expect(loggerInfo).toHaveBeenCalledWith("No new blocks found on this peer");
            });

            it("should dispatch DOWNLOADED if new blocks were successfully downloaded from peer", async () => {
                stateStorage.lastDownloadedBlock = new Block(genesisBlock);

                const logger = container.resolvePlugin("logger");
                const loggerInfo = jest.spyOn(logger, "info");

                jest.spyOn(blockchain.p2p, "downloadBlocks").mockReturnValue([
                    {
                        numberOfTransactions: 2,
                        previousBlock: genesisBlock.id,
                    },
                ]);
                await expect(() => actionMap.rebuildBlocks()).toDispatch(blockchain, "DOWNLOADED");
                expect(loggerInfo).toHaveBeenCalledWith(
                    "Downloaded 1 new block accounting for a total of 2 transactions",
                );
            });

            it("should dispatch NOBLOCK if new blocks were downloaded from peer but didnt match last known block", async () => {
                stateStorage.lastDownloadedBlock = new Block(genesisBlock);

                const logger = container.resolvePlugin("logger");
                const loggerWarn = jest.spyOn(logger, "warn");

                const downloadedBlock = {
                    numberOfTransactions: 2,
                    previousBlock: "123456",
                };
                jest.spyOn(blockchain.p2p, "downloadBlocks").mockReturnValue([downloadedBlock]);
                await expect(() => actionMap.rebuildBlocks()).toDispatch(blockchain, "NOBLOCK");
                expect(loggerWarn).toHaveBeenCalledWith(
                    `Downloaded block not accepted: ${JSON.stringify(downloadedBlock)}`,
                );
            });
        });

        describe("downloadBlocks", () => {
            let genesisBlock;
            let loggerInfo;
            let loggerWarn;

            beforeAll(() => {
                const config = container.getConfig();
                genesisBlock = config.get("genesisBlock");

                const logger = container.resolvePlugin("logger");
                loggerInfo = jest.spyOn(logger, "info");
                loggerWarn = jest.spyOn(logger, "warn");
            });

            beforeEach(() => {
                stateStorage.lastDownloadedBlock = new Block(genesisBlock);
            });

            afterEach(() => jest.resetAllMocks());

            it("should just return if blockchain isStopped", async () => {
                blockchain.isStopped = true;
                expect(await actionMap.downloadBlocks()).toBe(undefined);

                blockchain.isStopped = false; // reset to original value
            });

            it("should dispatch DOWNLOADED if new blocks downloaded are chained", async () => {
                jest.spyOn(blockchain.p2p, "downloadBlocks").mockReturnValue([
                    {
                        numberOfTransactions: 2,
                        previousBlock: genesisBlock.id,
                        height: 2,
                        timestamp: genesisBlock.timestamp + 115,
                    },
                ]);
                // @ts-ignore
                const enQueueBlocks = jest.spyOn(blockchain, "enqueueBlocks").mockReturnValue(true);

                await expect(() => actionMap.downloadBlocks()).toDispatch(blockchain, "DOWNLOADED");
                expect(loggerInfo).toHaveBeenCalledWith(
                    "Downloaded 1 new block accounting for a total of 2 transactions",
                );
                expect(enQueueBlocks).toHaveBeenCalled();

                enQueueBlocks.mockRestore();
            });

            it("should dispatch NOBLOCK if new blocks downloaded are not chained", async () => {
                const downloadedBlock = {
                    numberOfTransactions: 2,
                    previousBlock: genesisBlock.id,
                    height: 3,
                    timestamp: genesisBlock.timestamp + 115,
                };
                jest.spyOn(blockchain.p2p, "downloadBlocks").mockReturnValue([downloadedBlock]);
                await expect(() => actionMap.downloadBlocks()).toDispatch(blockchain, "NOBLOCK");
                expect(loggerWarn).toHaveBeenCalledWith(
                    `Downloaded block not accepted: ${JSON.stringify(downloadedBlock)}`,
                );
            });

            it("should dispatch NOBLOCK if new blocks downloaded are empty", async () => {
                jest.spyOn(blockchain.p2p, "downloadBlocks").mockReturnValue([]);
                await expect(() => actionMap.downloadBlocks()).toDispatch(blockchain, "NOBLOCK");
                expect(loggerInfo).toHaveBeenCalledWith("No new block found on this peer");
            });
        });

        describe("analyseFork", () => {
            it("should log 'analysing fork' message", () => {
                const logger = container.resolvePlugin("logger");
                const loggerInfo = jest.spyOn(logger, "info");

                actionMap.analyseFork();

                expect(loggerInfo).toHaveBeenCalledWith("Analysing fork :mag:");
            });
        });

        describe("startForkRecovery", () => {
            it("should proceed to fork recovery and dispatch SUCCESS", async () => {
                const logger = container.resolvePlugin("logger");
                const loggerInfo = jest.spyOn(logger, "info");

                const methodsCalled = [
                    // @ts-ignore
                    jest.spyOn(blockchain.database, "commitQueuedQueries").mockReturnValue(true),
                    // @ts-ignore
                    jest.spyOn(blockchain.transactionPool, "buildWallets").mockReturnValue(true),
                    // @ts-ignore
                    jest.spyOn(blockchain.p2p, "refreshPeersAfterFork").mockReturnValue(true),
                    jest.spyOn(blockchain, "clearAndStopQueue"),
                    // @ts-ignore
                    jest.spyOn(blockchain, "removeBlocks").mockReturnValue(true),
                ];
                await expect(() => actionMap.startForkRecovery()).toDispatch(blockchain, "SUCCESS");

                expect(loggerInfo).toHaveBeenCalledWith("Starting fork recovery :fork_and_knife:");
                methodsCalled.forEach(method => {
                    expect(method).toHaveBeenCalled();
                });
            });
        });

        describe("rollbackDatabase", () => {
            afterEach(() => jest.restoreAllMocks());

            it("should try to remove X blocks based on databaseRollback config until database.verifyBlockchain() passes - and dispatch SUCCESS", async () => {
                const logger = container.resolvePlugin("logger");
                const loggerInfo = jest.spyOn(logger, "info");

                jest.spyOn(localConfig, "get").mockReturnValue({
                    maxBlockRewind: 14,
                    steps: 3,
                });
                // @ts-ignore
                const removeTopBlocks = jest.spyOn(blockchain, "removeTopBlocks").mockReturnValue(true);
                jest.spyOn(blockchain.database, "verifyBlockchain")
                    // @ts-ignore
                    .mockReturnValue({ valid: true }) // default
                    .mockReturnValueOnce({ valid: false }) // first call
                    .mockReturnValueOnce({ valid: false }); // 2nd call
                jest.spyOn(blockchain.database, "getLastBlock").mockReturnValue({
                    // @ts-ignore
                    data: {
                        height: 1,
                    },
                });

                await expect(() => actionMap.rollbackDatabase()).toDispatch(blockchain, "SUCCESS");

                expect(loggerInfo).toHaveBeenCalledWith(
                    "Database integrity verified again after rollback to height 1 :green_heart:",
                );
                expect(removeTopBlocks).toHaveBeenCalledTimes(3); // because the 3rd time verifyBlockchain returned true
            });

            it(`should try to remove X blocks based on databaseRollback config until database.verifyBlockchain() passes
                and dispatch FAILURE as verifyBlockchain never passed`, async () => {
                const logger = container.resolvePlugin("logger");
                const loggerError = jest.spyOn(logger, "error");

                jest.spyOn(localConfig, "get").mockReturnValue({
                    maxBlockRewind: 14,
                    steps: 3,
                });
                // @ts-ignore
                const removeTopBlocks = jest.spyOn(blockchain, "removeTopBlocks").mockReturnValue(true);
                // @ts-ignore
                jest.spyOn(blockchain.database, "verifyBlockchain").mockReturnValue({ valid: false });
                jest.spyOn(blockchain.database, "getLastBlock").mockReturnValue({
                    // @ts-ignore
                    data: {
                        height: 1,
                    },
                });

                await expect(() => actionMap.rollbackDatabase()).toDispatch(blockchain, "FAILURE");

                expect(loggerError).toHaveBeenCalledWith(
                    "FATAL: Failed to restore database integrity :skull: :skull: :skull:",
                );
                expect(removeTopBlocks).toHaveBeenCalledTimes(5); // because after 5 times we get past maxBlockRewind
            });
        });
    });
});
