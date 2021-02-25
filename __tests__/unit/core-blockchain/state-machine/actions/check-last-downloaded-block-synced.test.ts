import { CheckLastDownloadedBlockSynced } from "@packages/core-blockchain/src/state-machine/actions/check-last-downloaded-block-synced";
import { Container } from "@packages/core-kernel";

describe("CheckLastDownloadedBlockSynced", () => {
    let container: Container.Container;
    let blockchain;
    let stateStore;
    let peerNetworkMonitor;
    let logger;

    beforeEach(() => {
        jest.resetAllMocks();

        blockchain = {
            isSynced: jest.fn(),
            dispatch: jest.fn(),
            getQueue: jest.fn().mockReturnValue({ size: jest.fn(), isRunning: jest.fn().mockReturnValue(true) }),
        };
        stateStore = {
            noBlockCounter: undefined,
            p2pUpdateCounter: undefined,
            numberOfBlocksToRollback: undefined,
            getLastDownloadedBlock: jest.fn(),
            getNoBlockCounter: jest.fn().mockReturnValue(0),
            setNoBlockCounter: jest.fn(),
            getP2pUpdateCounter: jest.fn().mockReturnValue(0),
            setP2pUpdateCounter: jest.fn(),
            setNumberOfBlocksToRollback: jest.fn(),
            getNetworkStart: jest.fn().mockReturnValue(false),
        };
        peerNetworkMonitor = { checkNetworkHealth: jest.fn() };
        logger = { warn: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() };

        container = new Container.Container();
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(peerNetworkMonitor);

        process.env.CORE_ENV = "";
    });

    describe("handle", () => {
        it("should dispatch NOTSYNCED by default", async () => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                CheckLastDownloadedBlockSynced,
            );

            process.env.CORE_ENV = "";
            await checkLastDownloadedBlockSynced.handle();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("NOTSYNCED");
        });

        it("should dispatch TEST when process.env.CORE_ENV === 'test'", async () => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                CheckLastDownloadedBlockSynced,
            );

            process.env.CORE_ENV = "test";
            await checkLastDownloadedBlockSynced.handle();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("TEST");
        });

        it("should dispatch SYNCED when stateStore.getNetworkStart", async () => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                CheckLastDownloadedBlockSynced,
            );

            stateStore.getNetworkStart = jest.fn().mockReturnValue(true);

            await checkLastDownloadedBlockSynced.handle();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("SYNCED");
        });

        it("should dispatch PAUSED when blockchain.queue.length() > 100", async () => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                CheckLastDownloadedBlockSynced,
            );

            blockchain.getQueue().size = jest.fn().mockReturnValue(101);

            await checkLastDownloadedBlockSynced.handle();

            blockchain.getQueue().size = jest.fn();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("PAUSED");
        });

        describe("when stateStore.noBlockCounter > 5 && !blockchain.getQueue().isRunning()", () => {
            beforeEach(() => {
                stateStore.getNoBlockCounter = jest.fn().mockReturnValue(6);
                blockchain.getQueue().isRunning = jest.fn().mockReturnValue(false);
            });

            describe("when stateStore.getP2pUpdateCounter + 1 > 3", () => {
                beforeEach(() => {
                    stateStore.getP2pUpdateCounter = jest.fn().mockReturnValue(3);
                });

                it("should dispatch NETWORKHALTED when !networkStatus.forked", async () => {
                    const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                        CheckLastDownloadedBlockSynced,
                    );

                    peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValueOnce({ forked: false });
                    await checkLastDownloadedBlockSynced.handle();

                    expect(blockchain.dispatch).toBeCalledTimes(1);
                    expect(blockchain.dispatch).toHaveBeenLastCalledWith("NETWORKHALTED");
                    expect(stateStore.setP2pUpdateCounter).toHaveBeenCalledWith(0); // should be reset
                    expect(stateStore.setNoBlockCounter).toHaveBeenCalledWith(0);
                });

                it("should dispatch FORK when networkStatus.forked", async () => {
                    const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                        CheckLastDownloadedBlockSynced,
                    );

                    peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValueOnce({ forked: true });
                    await checkLastDownloadedBlockSynced.handle();

                    expect(blockchain.dispatch).toBeCalledTimes(1);
                    expect(blockchain.dispatch).toHaveBeenLastCalledWith("FORK");
                    expect(stateStore.setP2pUpdateCounter).toHaveBeenCalledWith(0); // should be reset
                    expect(stateStore.setNumberOfBlocksToRollback).toHaveBeenCalledWith(0);
                });
            });

            describe("when stateStore.getP2pUpdateCounter + 1 <= 3", () => {
                beforeEach(() => {
                    stateStore.getP2pUpdateCounter = jest.fn().mockReturnValue(0);
                });

                it("should dispatch NETWORKHALTED and do stateStore.setP2pUpdateCounter++", async () => {
                    const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                        CheckLastDownloadedBlockSynced,
                    );

                    await checkLastDownloadedBlockSynced.handle();

                    expect(blockchain.dispatch).toBeCalledTimes(1);
                    expect(blockchain.dispatch).toHaveBeenLastCalledWith("NETWORKHALTED");
                    expect(stateStore.setP2pUpdateCounter).toHaveBeenCalledWith(1); // should have done counter++
                });
            });
        });

        it("should dispatch SYNCED when stateStore.getLastDownloadedBlock && blockchain.isSynced()", async () => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                CheckLastDownloadedBlockSynced,
            );

            stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue({});
            blockchain.isSynced = jest.fn().mockReturnValueOnce(true);

            await checkLastDownloadedBlockSynced.handle();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("SYNCED");
            expect(stateStore.setNoBlockCounter).toHaveBeenLastCalledWith(0);
        });
    });
});
