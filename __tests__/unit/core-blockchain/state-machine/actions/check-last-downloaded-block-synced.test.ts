import { Container } from "@packages/core-kernel";
import { CheckLastDownloadedBlockSynced } from "@packages/core-blockchain/src/state-machine/actions/check-last-downloaded-block-synced";

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
            lastDownloadedBlock: undefined,
            networkStart: undefined,
        };
        peerNetworkMonitor = { checkNetworkHealth: jest.fn() };
        logger = { warn: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() };

        container = new Container.Container();
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(peerNetworkMonitor);

        process.env.CORE_ENV = "";
        stateStore.networkStart = false;
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

        it("should dispatch SYNCED when stateStore.networkStart", async () => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                CheckLastDownloadedBlockSynced,
            );

            stateStore.networkStart = true;

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
                stateStore.noBlockCounter = 6;
                blockchain.getQueue().isRunning = jest.fn().mockReturnValue(false);
            });

            describe("when stateStore.p2pUpdateCounter + 1 > 3", () => {
                beforeEach(() => {
                    stateStore.p2pUpdateCounter = 3;
                });

                it("should dispatch NETWORKHALTED when !networkStatus.forked", async () => {
                    const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                        CheckLastDownloadedBlockSynced,
                    );

                    peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValueOnce({ forked: false });
                    await checkLastDownloadedBlockSynced.handle();

                    expect(blockchain.dispatch).toBeCalledTimes(1);
                    expect(blockchain.dispatch).toHaveBeenLastCalledWith("NETWORKHALTED");
                    expect(stateStore.p2pUpdateCounter).toBe(0); // should be reset
                });

                it("should dispatch FORK when networkStatus.forked", async () => {
                    const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                        CheckLastDownloadedBlockSynced,
                    );

                    peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValueOnce({ forked: true });
                    await checkLastDownloadedBlockSynced.handle();

                    expect(blockchain.dispatch).toBeCalledTimes(1);
                    expect(blockchain.dispatch).toHaveBeenLastCalledWith("FORK");
                    expect(stateStore.p2pUpdateCounter).toBe(0); // should be reset
                });
            });

            describe("when stateStore.p2pUpdateCounter + 1 <= 3", () => {
                beforeEach(() => {
                    stateStore.p2pUpdateCounter = 0;
                });

                it("should dispatch NETWORKHALTED and do stateStore.p2pUpdateCounter++", async () => {
                    const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                        CheckLastDownloadedBlockSynced,
                    );

                    await checkLastDownloadedBlockSynced.handle();

                    expect(blockchain.dispatch).toBeCalledTimes(1);
                    expect(blockchain.dispatch).toHaveBeenLastCalledWith("NETWORKHALTED");
                    expect(stateStore.p2pUpdateCounter).toBe(1); // should have done counter++
                });
            });
        });

        it("should dispatch SYNCED when stateStore.lastDownloadedBlock && blockchain.isSynced()", async () => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(
                CheckLastDownloadedBlockSynced,
            );

            stateStore.lastDownloadedBlock = {};
            blockchain.isSynced = jest.fn().mockReturnValueOnce(true);

            await checkLastDownloadedBlockSynced.handle();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("SYNCED");
        });
    });
});
