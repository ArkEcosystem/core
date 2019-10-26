import "../../utils";

import "./mocks/";
import { blockchain } from "./mocks/blockchain";
import { config } from "./mocks/config";
import { container } from "./mocks/container";
import { logger } from "./mocks/logger";
import { getMonitor } from "./mocks/p2p/network-monitor";
import { stateStorageStub as stateStorage } from "./stubs/state-storage";

import { Crypto } from "@arkecosystem/crypto";
import { defaults } from "../../../packages/core-blockchain/src/defaults";
import { genesisBlock } from "../../utils/config/testnet/genesisBlock";

let stateMachine;

beforeAll(async () => {
    ({ stateMachine } = require("../../../packages/core-blockchain/src/state-machine"));

    process.env.CORE_ENV = "";

    container.app.resolveOptions = jest.fn(() => defaults);
});

describe("State Machine", () => {
    describe("actionMap", () => {
        let actionMap;

        beforeEach(() => {
            actionMap = stateMachine.actionMap(blockchain);
        });

        describe("checkLater", () => {
            it("should call blockchain.setWakeUp", async () => {
                const setWakeUp = jest.spyOn(blockchain, "setWakeUp").mockReturnValueOnce(undefined);
                actionMap.checkLater();

                expect(setWakeUp).toHaveBeenCalledTimes(1);
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

        describe("checkLastDownloadedBlockSynced", () => {
            it('should dispatch the event "NOTSYNCED" by default', async () => {
                blockchain.isSynced = jest.fn(() => false);
                blockchain.queue.idle = jest.fn(() => false);
                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "NOTSYNCED");
            });

            it('should dispatch the event "PAUSED" if the blockchain process queue is more than 100 long', async () => {
                blockchain.isSynced = jest.fn(() => false);
                blockchain.queue.length = jest.fn(() => 101);
                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "PAUSED");
            });

            it('should dispatch the event "NETWORKHALTED" if stateStorage.noBlockCounter > 5 and process queue is empty', async () => {
                blockchain.isSynced = jest.fn(() => false);
                blockchain.queue.idle = jest.fn(() => true);
                stateStorage.noBlockCounter = 6;
                await expect(actionMap.checkLastDownloadedBlockSynced).toDispatch(blockchain, "NETWORKHALTED");
            });

            it(`should dispatch the event "FORK" if
                    - stateStorage.noBlockCounter > 5 and process queue is empty
                    - stateStorage.p2pUpdateCounter + 1 > 3 (network keeps missing blocks)
                    - blockchain.p2p.checkNetworkHealth() returns a forked network status`, async () => {
                blockchain.isSynced = jest.fn(() => false);
                blockchain.queue.idle = jest.fn(() => true);
                stateStorage.noBlockCounter = 6;
                stateStorage.p2pUpdateCounter = 3;

                jest.spyOn(getMonitor, "checkNetworkHealth").mockImplementation(() => ({
                    forked: true,
                }));

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

        describe("downloadPaused", () => {
            it('should log the info message "Blockchain download paused"', () => {
                const loggerInfo = jest.spyOn(logger, "info");
                actionMap.downloadPaused();
                expect(loggerInfo).lastCalledWith("Blockchain download paused");
            });
        });

        describe("syncingComplete", () => {
            it('should dispatch the event "SYNCFINISHED"', () => {
                expect(() => actionMap.syncingComplete()).toDispatch(blockchain, "SYNCFINISHED");
            });
        });

        describe("stopped", () => {
            it('should log the info message "The blockchain has been stopped"', () => {
                const loggerInfo = jest.spyOn(logger, "info");
                actionMap.stopped();
                expect(loggerInfo).lastCalledWith("The blockchain has been stopped");
            });
        });

        describe("exitApp", () => {
            it("should call container forceExit with error message", () => {
                const forceExit = jest.spyOn(container.app, "forceExit").mockImplementationOnce(() => undefined);
                actionMap.exitApp();
                expect(forceExit).lastCalledWith("Failed to startup blockchain. Exiting ARK Core!");
            });
        });

        describe("init", () => {
            let databaseMocks: any = {};
            let loggerInfo;
            let loggerError;

            beforeEach(() => {
                const config = container.app.getConfig();
                jest.spyOn(config, "get").mockImplementation(key => (key === "genesisBlock" ? genesisBlock : ""));

                loggerInfo = jest.spyOn(logger, "info");
                loggerError = jest.spyOn(logger, "error");

                databaseMocks = {
                    // @ts-ignore
                    saveBlock: jest.spyOn(blockchain.database, "saveBlock").mockReturnValue(true),
                    verifyBlockchain: jest.spyOn(blockchain.database, "verifyBlockchain").mockReturnValue(true),
                    // @ts-ignore
                    deleteRound: jest.spyOn(blockchain.database, "deleteRound").mockReturnValue(true),
                    // @ts-ignore
                    buildWallets: jest.spyOn(blockchain.database, "buildWallets").mockReturnValue(true),
                    // @ts-ignore
                    applyRound: jest.spyOn(blockchain.database, "applyRound").mockReturnValue(true),
                    // @ts-ignore
                    restoreCurrentRound: jest.spyOn(blockchain.database, "restoreCurrentRound").mockReturnValue(true),
                };
            });

            afterEach(() => jest.restoreAllMocks());
            afterAll(() => {
                jest.restoreAllMocks();
            });

            it("should dispatch FAILURE if there is no last block in database and genesis block payload hash != configured nethash", async () => {
                jest.spyOn(blockchain.state, "getLastBlock").mockReturnValue(undefined);
                const backupConfig = { ...config };
                config["network.nethash"] = undefined;

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.init()).toDispatch(blockchain, "FAILURE");

                config["network.nethash"] = backupConfig["network.nethash"];
            });

            it("should verify database integrity if database recovery was not successful (!restoredDatabaseIntegrity)", async () => {
                blockchain.database.restoredDatabaseIntegrity = false;

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(loggerInfo).nthCalledWith(1, "Verifying database integrity");
                expect(loggerInfo).nthCalledWith(2, "Verified database integrity");

                blockchain.database.restoredDatabaseIntegrity = true;
            });

            it("should dispatch ROLLBACK if database recovery was not successful and verifyBlockchain failed", async () => {
                blockchain.database.restoredDatabaseIntegrity = false;

                jest.spyOn(blockchain.database, "verifyBlockchain").mockReturnValue(false);

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.init()).toDispatch(blockchain, "ROLLBACK");

                blockchain.database.restoredDatabaseIntegrity = true;
            });

            it("should skip database integrity check if database recovery was successful (restoredDatabaseIntegrity)", async () => {
                blockchain.database.restoredDatabaseIntegrity = true;

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(loggerInfo).nthCalledWith(
                    1,
                    "Skipping database integrity check after successful database recovery",
                );
            });

            it("should dispatch STARTED if networkStart is enabled", async () => {
                stateStorage.networkStart = true;

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(databaseMocks.buildWallets).toHaveBeenCalled();
                expect(databaseMocks.restoreCurrentRound).toHaveBeenCalledWith(1);

                stateStorage.networkStart = false; // reset to default value
            });

            it('should dispatch STARTED if NODE_ENV === "test"', async () => {
                const loggerVerbose = jest.spyOn(logger, "verbose");

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(databaseMocks.buildWallets).toHaveBeenCalled();
                expect(loggerVerbose).toHaveBeenCalledWith(
                    "TEST SUITE DETECTED! SYNCING WALLETS AND STARTING IMMEDIATELY.",
                );
            });

            it("should rebuild wallets table and dispatch STARTED if database.buildWallets() failed", async () => {
                delete process.env.NODE_ENV;
                jest.spyOn(blockchain.state, "getLastBlock").mockReturnValue({
                    // @ts-ignore
                    data: {
                        height: 2,
                        timestamp: Crypto.Slots.getTime(),
                    },
                });
                // @ts-ignore
                jest.spyOn(blockchain.database, "buildWallets").mockReturnValue(false);

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                process.env.NODE_ENV = "test";
            });

            it("should clean round data if new round starts at block.height + 1 (and dispatch STARTED)", async () => {
                delete process.env.NODE_ENV;

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.init()).toDispatch(blockchain, "STARTED");
                expect(databaseMocks.deleteRound).toHaveBeenCalled();
                process.env.NODE_ENV = "test";
            });

            it("should log error and dispatch FAILURE if an exception was thrown", async () => {
                jest.spyOn(blockchain.state, "getLastBlock").mockImplementation(() => {
                    throw new Error("oops");
                });

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.init()).toDispatch(blockchain, "FAILURE");
                expect(loggerError.mock.calls[0][0]).toContain("Error: oops");
            });
        });

        describe("downloadBlocks", () => {
            let loggerInfo;

            beforeAll(() => {
                loggerInfo = jest.spyOn(logger, "info");
            });

            beforeEach(() => {
                stateStorage.lastDownloadedBlock = genesisBlock;
            });

            afterEach(() => jest.resetAllMocks());

            it("should just return if blockchain isStopped", async () => {
                blockchain.isStopped = true;
                expect(await actionMap.downloadBlocks()).toBe(undefined);

                blockchain.isStopped = false; // reset to original value
            });

            it("should dispatch DOWNLOADED if new blocks downloaded are chained", async () => {
                jest.spyOn(getMonitor, "downloadBlocksFromHeight").mockReturnValue([
                    {
                        numberOfTransactions: 2,
                        previousBlock: genesisBlock.id,
                        height: 2,
                        timestamp: genesisBlock.timestamp + 115,
                    },
                ]);
                // @ts-ignore
                const enQueueBlocks = jest.spyOn(blockchain, "enqueueBlocks").mockReturnValue(true);

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.downloadBlocks()).toDispatch(blockchain, "DOWNLOADED");
                expect(loggerInfo).toHaveBeenCalledWith(
                    "Downloaded 1 new block accounting for a total of 2 transactions",
                );
                expect(enQueueBlocks).toHaveBeenCalled();

                enQueueBlocks.mockRestore();
            });

            it("should dispatch NOBLOCK if new blocks downloaded are not chained and NETWORKHALTED if it keeps failing", async () => {
                stateStorage.noBlockCounter = 0;
                stateStorage.p2pUpdateCounter = 0;

                const downloadedBlock = {
                    numberOfTransactions: 2,
                    previousBlock: genesisBlock.id,
                    height: 3,
                    timestamp: genesisBlock.timestamp + 115,
                };

                blockchain.queue.idle = () => true;
                blockchain.queue.length = () => 0;

                jest.spyOn(getMonitor, "downloadBlocksFromHeight").mockReturnValue([downloadedBlock]);
                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.downloadBlocks()).toDispatch(blockchain, "NOBLOCK");

                expect(stateStorage.noBlockCounter).toBe(1);

                for (let i = 0; i < 5; i++) {
                    // tslint:disable-next-line: await-promise
                    await expect(() => actionMap.downloadBlocks()).toDispatch(blockchain, "NOBLOCK");
                }

                expect(stateStorage.noBlockCounter).toBe(6);
                expect(stateStorage.p2pUpdateCounter).toBe(0);

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.checkLastDownloadedBlockSynced()).toDispatch(blockchain, "NETWORKHALTED");

                blockchain.queue.idle = () => undefined;
            });

            it("should dispatch NOBLOCK if new blocks downloaded are empty", async () => {
                jest.spyOn(getMonitor, "downloadBlocksFromHeight").mockReturnValue([]);
                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.downloadBlocks()).toDispatch(blockchain, "NOBLOCK");
                expect(loggerInfo).toHaveBeenCalledWith("Could not download any blocks from any peer from height 2");
            });
        });

        describe("startForkRecovery", () => {
            it("should proceed to fork recovery and dispatch SUCCESS", async () => {
                const loggerInfo = jest.spyOn(logger, "info");

                const methodsCalled = [
                    // // @ts-ignore
                    // jest.spyOn(blockchain.transactionPool, "buildWallets").mockReturnValue(true),
                    // @ts-ignore
                    jest.spyOn(getMonitor, "refreshPeersAfterFork").mockReturnValue(true),
                    jest.spyOn(blockchain, "clearAndStopQueue"),
                    // @ts-ignore
                    jest.spyOn(blockchain, "removeBlocks").mockReturnValue(true),
                ];
                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.startForkRecovery()).toDispatch(blockchain, "SUCCESS");

                expect(loggerInfo).toHaveBeenCalledWith("Starting fork recovery");
                for (const method of methodsCalled) {
                    expect(method).toHaveBeenCalled();
                }
            });
        });

        describe("rollbackDatabase", () => {
            afterEach(() => jest.restoreAllMocks());

            beforeEach(() => {
                jest.spyOn(container.app, "resolveOptions").mockImplementation(plugin =>
                    plugin === "blockchain"
                        ? {
                              databaseRollback: {
                                  maxBlockRewind: 14,
                                  steps: 3,
                              },
                          }
                        : {},
                );
            });

            it("should try to remove X blocks based on databaseRollback config until database.verifyBlockchain() passes - and dispatch SUCCESS", async () => {
                const loggerInfo = jest.spyOn(logger, "info");

                // @ts-ignore
                const removeTopBlocks = jest.spyOn(blockchain, "removeTopBlocks").mockReturnValue(true);
                jest.spyOn(blockchain.database, "verifyBlockchain")
                    // @ts-ignore
                    .mockReturnValue(true) // default
                    .mockReturnValueOnce(false) // first call
                    .mockReturnValueOnce(false); // 2nd call
                jest.spyOn(blockchain.state, "getLastBlock").mockReturnValue({
                    // @ts-ignore
                    data: {
                        height: 1,
                    },
                });

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.rollbackDatabase()).toDispatch(blockchain, "SUCCESS");

                expect(loggerInfo).toHaveBeenCalledWith("Database integrity verified again after rollback to height 1");
                expect(removeTopBlocks).toHaveBeenCalledTimes(3); // because the 3rd time verifyBlockchain returned true
            });

            it(`should try to remove X blocks based on databaseRollback config until database.verifyBlockchain() passes
                    and dispatch FAILURE as verifyBlockchain never passed`, async () => {
                // @ts-ignore
                const removeTopBlocks = jest.spyOn(blockchain, "removeTopBlocks").mockReturnValue(true);
                // @ts-ignore
                jest.spyOn(blockchain.database, "verifyBlockchain").mockReturnValue(false);
                jest.spyOn(blockchain.state, "getLastBlock").mockReturnValue({
                    // @ts-ignore
                    data: {
                        height: 1,
                    },
                });

                // tslint:disable-next-line: await-promise
                await expect(() => actionMap.rollbackDatabase()).toDispatch(blockchain, "FAILURE");

                expect(removeTopBlocks).toHaveBeenCalledTimes(5); // because after 5 times we get past maxBlockRewind
            });
        });
    });
});
