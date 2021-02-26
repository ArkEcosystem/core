import { BlockProcessorResult } from "@packages/core-blockchain/src/processor";
import { AcceptBlockHandler } from "@packages/core-blockchain/src/processor/handlers/accept-block-handler";
import { Container } from "@packages/core-kernel";
import { Interfaces } from "@packages/crypto";

describe("AcceptBlockHandler", () => {
    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const blockchain = { resetLastDownloadedBlock: jest.fn(), resetWakeUp: jest.fn() };
    const state = {
        setLastBlock: jest.fn(),
        getLastBlock: jest.fn(),
        getLastDownloadedBlock: jest.fn(),
        setLastDownloadedBlock: jest.fn(),
        isStarted: jest.fn().mockReturnValue(false),
        getForkedBlock: jest.fn(),
        setForkedBlock: jest.fn(),
        clearForkedBlock: jest.fn(),
    };
    const transactionPool = { removeForgedTransaction: jest.fn() };
    const databaseInteractions = {
        walletRepository: {
            getNonce: jest.fn(),
        },
        applyBlock: jest.fn(),
        getTopBlocks: jest.fn(),
        getLastBlock: jest.fn(),
        loadBlocksFromCurrentRound: jest.fn(),
        revertBlock: jest.fn(),
        deleteRound: jest.fn(),
        getActiveDelegates: jest.fn().mockReturnValue([]),
    };
    const revertBlockHandler = {
        execute: jest.fn(),
    };
    const application = { get: jest.fn(), resolve: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        container.bind(Container.Identifiers.StateStore).toConstantValue(state);
        container.bind(Container.Identifiers.DatabaseInteraction).toConstantValue(databaseInteractions);
        container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(transactionPool);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("execute", () => {
        const block = {
            data: { id: "1222", height: 5544 },
            transactions: [{ id: "11" }, { id: "12" }],
        };

        it("should apply block to database, transaction pool, blockchain and state", async () => {
            const acceptBlockHandler = container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

            state.isStarted = jest.fn().mockReturnValue(true);
            const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Accepted);

            expect(databaseInteractions.applyBlock).toBeCalledTimes(1);
            expect(databaseInteractions.applyBlock).toHaveBeenCalledWith(block);

            expect(blockchain.resetWakeUp).toBeCalledTimes(1);

            expect(transactionPool.removeForgedTransaction).toBeCalledTimes(2);
            expect(transactionPool.removeForgedTransaction).toHaveBeenCalledWith(block.transactions[0]);
            expect(transactionPool.removeForgedTransaction).toHaveBeenCalledWith(block.transactions[1]);
        });

        it("should clear forkedBlock if incoming block has same height", async () => {
            const acceptBlockHandler = container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

            state.getForkedBlock = jest.fn().mockReturnValue({ data: { height: block.data.height } });
            const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Accepted);

            expect(state.clearForkedBlock).toHaveBeenCalled();
        });

        it("should set state.lastDownloadedBlock if incoming block height is higher", async () => {
            const acceptBlockHandler = container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

            state.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: block.data.height - 1 });
            const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Accepted);

            expect(state.setLastDownloadedBlock).toHaveBeenCalledWith(block.data);
            expect(state.setLastDownloadedBlock).toHaveBeenCalledTimes(1);
        });

        describe("Revert", () => {
            it("should call revertBlockHandler when block is accepted, but execute throws", async () => {
                revertBlockHandler.execute.mockReturnValue(BlockProcessorResult.Reverted);
                application.resolve.mockReturnValue(revertBlockHandler);
                state.getLastBlock.mockReturnValue({ data: { height: 5544 } });

                const acceptBlockHandler = container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

                databaseInteractions.applyBlock = jest.fn().mockRejectedValueOnce(new Error("oops"));
                const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

                expect(result).toBe(BlockProcessorResult.Rejected);

                expect(blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
                expect(revertBlockHandler.execute).toBeCalledTimes(1);
            });

            it("should call not revertBlockHandler when block not accepted and execute throws", async () => {
                revertBlockHandler.execute.mockReturnValue(BlockProcessorResult.Reverted);
                state.getLastBlock.mockReturnValue({ data: { height: 5543 } }); // Current block was not accpeted

                const acceptBlockHandler = container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

                databaseInteractions.applyBlock = jest.fn().mockRejectedValueOnce(new Error("oops"));
                const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

                expect(result).toBe(BlockProcessorResult.Rejected);

                expect(blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
                expect(revertBlockHandler.execute).not.toBeCalled();
            });

            it("should return Corrupted when reverting block fails", async () => {
                revertBlockHandler.execute.mockReturnValue(BlockProcessorResult.Corrupted);
                application.resolve.mockReturnValue(revertBlockHandler);
                state.getLastBlock.mockReturnValue({ data: { height: 5544 } });

                const acceptBlockHandler = container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

                databaseInteractions.applyBlock = jest.fn().mockRejectedValueOnce(new Error("oops"));
                const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

                expect(result).toBe(BlockProcessorResult.Corrupted);

                expect(blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
                expect(revertBlockHandler.execute).toBeCalledTimes(1);
            });
        });
    });
});
