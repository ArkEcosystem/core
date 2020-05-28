import { Container } from "@arkecosystem/core-kernel";
import { StartForkRecovery } from "@packages/core-blockchain/src/state-machine/actions/start-fork-recovery";

describe("StartForkRecovery", () => {
    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const blockchain = {
        dispatch: jest.fn(),
        clearAndStopQueue: jest.fn(),
        removeBlocks: jest.fn(),
        queue: { resume: jest.fn() },
    };
    const stateStore = { numberOfBlocksToRollback: undefined };
    const peerNetworkMonitor = { refreshPeersAfterFork: jest.fn() };

    const application = { get: () => peerNetworkMonitor };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("handle", () => {
        it("should clearAndStopQueue, removeBlocks, refreshPeersAfterFork, dispatch SUCCESS and resume queue", async () => {
            const startForkRecovery = container.resolve<StartForkRecovery>(StartForkRecovery);

            const mockRandomValue = 0.1;
            jest.spyOn(Math, "random").mockReturnValueOnce(mockRandomValue);
            await startForkRecovery.handle();

            expect(blockchain.clearAndStopQueue).toHaveBeenCalledTimes(1);
            expect(blockchain.removeBlocks).toHaveBeenCalledTimes(1);
            expect(blockchain.removeBlocks).toHaveBeenCalledWith(4 + Math.floor(mockRandomValue * 99));
            expect(peerNetworkMonitor.refreshPeersAfterFork).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledWith("SUCCESS");
            expect(blockchain.queue.resume).toHaveBeenCalledTimes(1);
        });

        it("should remove stateStore.numberOfBlocksToRollback blocks when defined", async () => {
            const startForkRecovery = container.resolve<StartForkRecovery>(StartForkRecovery);

            stateStore.numberOfBlocksToRollback = 7;
            await startForkRecovery.handle();

            expect(stateStore.numberOfBlocksToRollback).toBeUndefined();
            expect(blockchain.clearAndStopQueue).toHaveBeenCalledTimes(1);
            expect(blockchain.removeBlocks).toHaveBeenCalledTimes(1);
            expect(blockchain.removeBlocks).toHaveBeenCalledWith(7);
            expect(peerNetworkMonitor.refreshPeersAfterFork).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledWith("SUCCESS");
            expect(blockchain.queue.resume).toHaveBeenCalledTimes(1);
        });
    });
});
