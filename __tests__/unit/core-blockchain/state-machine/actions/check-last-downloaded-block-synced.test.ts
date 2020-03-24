import { Container } from "@arkecosystem/core-kernel";
import { CheckLastDownloadedBlockSynced } from "../../../../../packages/core-blockchain/src/state-machine/actions/check-last-downloaded-block-synced";


describe("CheckLastDownloadedBlockSynced", () => {
    const container = new Container.Container();

    const blockchain = {
        isSynced: jest.fn(),
        dispatch: jest.fn(),
        queue: { length: jest.fn(), idle: jest.fn() }
    };
    const stateStore = {
        noBlockCounter: undefined,
        p2pUpdateCounter: undefined,
        numberOfBlocksToRollback: undefined,
        lastDownloadedBlock: undefined,
        networkStart: undefined,
    };
    const peerNetworkMonitor = { checkNetworkHealth: jest.fn() };
    const logger = { warn: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn(), };

    const application = { resolve: jest.fn(), get: () => peerNetworkMonitor };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);  
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);  
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);  
        container.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(peerNetworkMonitor);  
    });

    beforeEach(() => {
        jest.resetAllMocks();

        process.env.CORE_ENV = "";
        stateStore.networkStart = false;
    });

    describe("handle", () => {
        it("should dispatch NOTSYNCED by default",() => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(CheckLastDownloadedBlockSynced);

            process.env.CORE_ENV = "";
            checkLastDownloadedBlockSynced.handle();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("NOTSYNCED");
        });

        it("should dispatch TEST when process.env.CORE_ENV === 'test'",() => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(CheckLastDownloadedBlockSynced);

            process.env.CORE_ENV = "test";
            checkLastDownloadedBlockSynced.handle();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("TEST");
        });

        it("should dispatch SYNCED when stateStore.networkStart",() => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(CheckLastDownloadedBlockSynced);

            stateStore.networkStart = true;

            checkLastDownloadedBlockSynced.handle();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("SYNCED");
        });

        it("should dispatch PAUSED when blockchain.queue.length() > 100",() => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(CheckLastDownloadedBlockSynced);

            blockchain.queue.length = jest.fn().mockReturnValue(101);

            checkLastDownloadedBlockSynced.handle();

            blockchain.queue.length = jest.fn();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("PAUSED");
        });

        describe("when stateStore.noBlockCounter > 5 && blockchain.queue.idle()", () => {
            beforeEach(() => {
                stateStore.noBlockCounter = 6;
                blockchain.queue.idle = jest.fn().mockReturnValue(true);
            });

            describe("when stateStore.p2pUpdateCounter + 1 > 3", () => {
                beforeEach(() => {
                    stateStore.p2pUpdateCounter = 3;
                });

                it("should dispatch NETWORKHALTED when !networkStatus.forked", async () => {
                    const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(CheckLastDownloadedBlockSynced);
        
                    peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValueOnce({ forked: false });
                    await checkLastDownloadedBlockSynced.handle();
        
                    expect(blockchain.dispatch).toBeCalledTimes(1);
                    expect(blockchain.dispatch).toHaveBeenLastCalledWith("NETWORKHALTED");
                    expect(stateStore.p2pUpdateCounter).toBe(0); // should be reset
                });

                it("should dispatch FORK when networkStatus.forked", async () => {
                    const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(CheckLastDownloadedBlockSynced);
        
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

                it("should dispatch NETWORKHALTED and do stateStore.p2pUpdateCounter++",() => {
                    const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(CheckLastDownloadedBlockSynced);
        
                    checkLastDownloadedBlockSynced.handle();
        
                    expect(blockchain.dispatch).toBeCalledTimes(1);
                    expect(blockchain.dispatch).toHaveBeenLastCalledWith("NETWORKHALTED");
                    expect(stateStore.p2pUpdateCounter).toBe(1); // should have done counter++
                });
            });
        })
        
        it("should dispatch SYNCED when stateStore.lastDownloadedBlock && blockchain.isSynced()", () => {
            const checkLastDownloadedBlockSynced = container.resolve<CheckLastDownloadedBlockSynced>(CheckLastDownloadedBlockSynced);

            stateStore.lastDownloadedBlock = {};
            blockchain.isSynced = jest.fn().mockReturnValueOnce(true);

            checkLastDownloadedBlockSynced.handle();

            expect(blockchain.dispatch).toBeCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("SYNCED");
        });
    })
})