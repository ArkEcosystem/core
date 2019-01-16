import "@arkecosystem/core-test-utils";
import { asValue } from "awilix";
import { Blockchain } from "../src/blockchain";
import { setUp, tearDown } from "./__support__/setup";

let stateMachine;
let container;
let blockchain: Blockchain;

beforeAll(async () => {
    container = await setUp();

    process.env.CORE_SKIP_BLOCKCHAIN = "true";

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
            it('should dispatch the event "SYNCFINISHED"', () => {
                expect(() => actionMap.syncingComplete()).toDispatch(blockchain, "SYNCFINISHED");
            });
        });

        describe("rebuildingComplete", () => {
            it('should dispatch the event "REBUILDCOMPLETE"', () => {
                expect(() => actionMap.rebuildingComplete()).toDispatch(blockchain, "REBUILDCOMPLETE");
            });
        });
    });
});
