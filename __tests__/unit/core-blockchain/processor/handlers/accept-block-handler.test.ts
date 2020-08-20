import { Container } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../../../../../packages/core-blockchain/src/processor";
import { AcceptBlockHandler } from "../../../../../packages/core-blockchain/src/processor/handlers/accept-block-handler";

describe("AcceptBlockHandler", () => {
    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const blockchain = { resetLastDownloadedBlock: jest.fn(), resetWakeUp: jest.fn() };
    const state = {
        forkedBlock: undefined,
        started: undefined,
        setLastBlock: jest.fn(),
        lastDownloadedBlock: undefined,
    };
    const transactionPool = { acceptForgedTransaction: jest.fn() };
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
    const application = { get: jest.fn() };

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

            state.started = true;
            const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Accepted);

            expect(databaseInteractions.applyBlock).toBeCalledTimes(1);
            expect(databaseInteractions.applyBlock).toHaveBeenCalledWith(block);

            expect(blockchain.resetWakeUp).toBeCalledTimes(1);

            expect(transactionPool.acceptForgedTransaction).toBeCalledTimes(2);
            expect(transactionPool.acceptForgedTransaction).toHaveBeenCalledWith(block.transactions[0]);
            expect(transactionPool.acceptForgedTransaction).toHaveBeenCalledWith(block.transactions[1]);

            expect(state.setLastBlock).toBeCalledTimes(1);
            expect(state.setLastBlock).toHaveBeenCalledWith(block);
        });

        it("should reset state.forkedBlock if incoming block has same height", async () => {
            const acceptBlockHandler = container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

            state.forkedBlock = { data: { height: block.data.height } };
            const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Accepted);

            expect(state.forkedBlock).toBeUndefined();
        });

        it("should set state.lastDownloadedBlock if incoming block height is higher", async () => {
            const acceptBlockHandler = container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

            state.lastDownloadedBlock = { height: block.data.height - 1 };
            const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Accepted);

            expect(state.lastDownloadedBlock).toBe(block.data);
        });

        it("should return Reject and resetLastDownloadedBlock when something throws", async () => {
            const acceptBlockHandler = container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

            databaseInteractions.applyBlock = jest.fn().mockRejectedValueOnce(new Error("oops"));
            const result = await acceptBlockHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Rejected);

            expect(blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
        });
    });
});
