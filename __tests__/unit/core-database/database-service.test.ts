import { Container } from "@arkecosystem/core-kernel";
import { Blocks } from "@arkecosystem/crypto";

import { DatabaseService } from "../../../packages/core-database/src/database-service";
import block1760000 from "./__fixtures__/block1760000";

const app = {
    get: jest.fn(),
    terminate: jest.fn(),
};

const connection = {
    query: jest.fn(),
    close: jest.fn(),
};

const blockRepository = {
    findOne: jest.fn(),
    findByHeightRange: jest.fn(),
    findByHeightRangeWithTransactions: jest.fn(),
    findByHeightRangeWithTransactionsForDownload: jest.fn(),
    findByHeights: jest.fn(),
    findLatest: jest.fn(),
    findByIds: jest.fn(),
    findRecent: jest.fn(),
    findTop: jest.fn(),
    count: jest.fn(),
    getStatistics: jest.fn(),
    saveBlocks: jest.fn(),
    deleteBlocks: jest.fn(),
};

const transactionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findByBlockIds: jest.fn(),
    getStatistics: jest.fn(),
};

const roundRepository = {
    getRound: jest.fn(),
    save: jest.fn(),
    deleteFrom: jest.fn(),
};

const events = {
    call: jest.fn(),
    dispatch: jest.fn(),
};

const logger = {
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);
container.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
container.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
container.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue(roundRepository);
container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(events);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);

beforeEach(() => {
    jest.resetAllMocks();
});

describe("DatabaseService.initialize", () => {
    it("should reset database when CORE_RESET_DATABASE variable is set", async () => {
        try {
            const databaseService = container.resolve(DatabaseService);

            process.env.CORE_RESET_DATABASE = "1";

            await databaseService.initialize();

            expect(connection.query).toBeCalledWith("TRUNCATE TABLE blocks, rounds, transactions RESTART IDENTITY;");
        } finally {
            delete process.env.CORE_RESET_DATABASE;
        }
    });

    it("should terminate app if exception was raised", async () => {
        try {
            const databaseService = container.resolve(DatabaseService);

            process.env.CORE_RESET_DATABASE = "1";

            jest.spyOn(databaseService, "reset").mockImplementationOnce(() => {
                throw new Error("Fail");
            });
            await databaseService.initialize();
            expect(app.terminate).toBeCalled();
        } finally {
            delete process.env.CORE_RESET_DATABASE;
        }
    });
});

describe("DatabaseService.disconnect", () => {
    it("should close connection", async () => {
        const databaseService = container.resolve(DatabaseService);
        await databaseService.disconnect();
        expect(connection.close).toBeCalled();
    });

    it("should emit disconnect events", async () => {
        const databaseService = container.resolve(DatabaseService);
        await databaseService.disconnect();
        expect(events.dispatch).toBeCalledWith("database.preDisconnect");
        expect(events.dispatch).toBeCalledWith("database.postDisconnect");
    });
});

describe("DatabaseService.reset", () => {
    it("should reset database", async () => {
        const databaseService = container.resolve(DatabaseService);

        await databaseService.reset();

        expect(connection.query).toBeCalledWith("TRUNCATE TABLE blocks, rounds, transactions RESTART IDENTITY;");
    });
});

describe("DatabaseService.getBlock", () => {
    it("should return block", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block = Blocks.BlockFactory.fromData(block1760000);
        // @ts-ignore
        blockRepository.findOne.mockResolvedValueOnce({ ...block.data });
        // @ts-ignore
        transactionRepository.find.mockResolvedValueOnce(block.transactions);

        // @ts-ignore
        const result = await databaseService.getBlock(block.data.id);
        // @ts-ignore
        Object.assign(result, { getBlockTimeStampLookup: block["getBlockTimeStampLookup"] });

        // @ts-ignore
        expect(blockRepository.findOne).toBeCalledWith(block.data.id);
        // @ts-ignore
        expect(transactionRepository.find).toBeCalledWith({ blockId: block.data.id });
        expect(result).toEqual(block);
    });

    it("should return undefined when block was not found", async () => {
        const databaseService = container.resolve(DatabaseService);

        blockRepository.findOne.mockResolvedValueOnce(undefined);

        const blockId = "non_existing_id";
        const result = await databaseService.getBlock(blockId);

        expect(blockRepository.findOne).toBeCalledWith(blockId);
        expect(result).toBeUndefined();
    });
});

describe("DatabaseService.getBlocks", () => {
    it("should return blocks with transactions when full blocks are requested", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block100 = { height: 100, transactions: [] };
        const block101 = { height: 101, transactions: [] };
        const block102 = { height: 102, transactions: [] };

        blockRepository.findByHeightRangeWithTransactions.mockResolvedValueOnce([block100, block101, block102]);

        const result = await databaseService.getBlocks(100, 102);

        expect(blockRepository.findByHeightRangeWithTransactions).toBeCalledWith(100, 102);
        expect(result).toEqual([block100, block101, block102]);
    });

    it("should return blocks without transactions when block headers are requested", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block100 = { height: 100 };
        const block101 = { height: 101 };
        const block102 = { height: 102 };

        blockRepository.findByHeightRange.mockResolvedValueOnce([block100, block101, block102]);

        const result = await databaseService.getBlocks(100, 102, true);

        expect(blockRepository.findByHeightRange).toBeCalledWith(100, 102);
        expect(result).toEqual([block100, block101, block102]);
    });
});

describe("DatabaseService.getBlocksForDownload", () => {
    it("should return blocks with transactions when full blocks are requested", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block100 = { height: 100, transactions: [] };
        const block101 = { height: 101, transactions: [] };
        const block102 = { height: 102, transactions: [] };

        blockRepository.findByHeightRangeWithTransactionsForDownload.mockResolvedValueOnce([
            block100,
            block101,
            block102,
        ]);

        const result = await databaseService.getBlocksForDownload(100, 3);

        expect(blockRepository.findByHeightRangeWithTransactionsForDownload).toBeCalledWith(100, 102);
        expect(result).toEqual([block100, block101, block102]);
    });

    it("should return blocks without transactions when block headers are requested", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block100 = { height: 100 };
        const block101 = { height: 101 };
        const block102 = { height: 102 };

        blockRepository.findByHeightRange.mockResolvedValueOnce([block100, block101, block102]);

        const result = await databaseService.getBlocksForDownload(100, 3, true);

        expect(blockRepository.findByHeightRange).toBeCalledWith(100, 102);
        expect(result).toEqual([block100, block101, block102]);
    });
});

describe("DatabaseService.getLastBlock", () => {
    it("should return undefined if there are no blocks", async () => {
        const databaseService = container.resolve(DatabaseService);

        blockRepository.findLatest.mockResolvedValueOnce(undefined);

        const result = await databaseService.getLastBlock();

        expect(blockRepository.findLatest).toBeCalled();
        expect(result).toBeUndefined();
    });

    it("should return last block from repository", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = Blocks.BlockFactory.fromData(block1760000);
        blockRepository.findLatest.mockResolvedValueOnce({ ...lastBlock.data });
        transactionRepository.findByBlockIds.mockResolvedValueOnce(lastBlock.transactions);

        const result = await databaseService.getLastBlock();
        Object.assign(result, { getBlockTimeStampLookup: lastBlock["getBlockTimeStampLookup"] });

        expect(blockRepository.findLatest).toBeCalled();
        expect(transactionRepository.findByBlockIds).toBeCalledWith([lastBlock.data.id]);
        expect(result).toEqual(lastBlock);
    });
});

describe("DatabaseService.getTopBlocks", () => {
    it("should return top blocks with transactions", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block = Blocks.BlockFactory.fromData(block1760000);
        blockRepository.findTop.mockResolvedValueOnce([block.data]);

        const dbTransactions = block.transactions.map((t) => ({
            id: t.data.id,
            blockId: block.data.id,
            serialized: t.serialized,
        }));
        transactionRepository.findByBlockIds.mockResolvedValueOnce(dbTransactions);

        const topCount = 1;
        const result = await databaseService.getTopBlocks(topCount);

        expect(blockRepository.findTop).toBeCalledWith(topCount);
        expect(transactionRepository.findByBlockIds).toBeCalledWith([block.data.id]);
        expect(result).toEqual([block.data]);
    });

    it("should return empty array when there are no blocks", async () => {
        const databaseService = container.resolve(DatabaseService);

        blockRepository.findTop.mockResolvedValueOnce([]);

        const topCount = 1;
        const result = await databaseService.getTopBlocks(topCount);

        expect(blockRepository.findTop).toBeCalledWith(topCount);
        expect(result).toEqual([]);
    });
});

describe("DatabaseService.getTransaction", () => {
    it("should return transaction from transaction repository", async () => {
        const databaseService = container.resolve(DatabaseService);

        const dbTransaction = {};
        transactionRepository.findOne.mockResolvedValueOnce(dbTransaction);

        const transactionId = "123";
        const result = await databaseService.getTransaction(transactionId);

        expect(transactionRepository.findOne).toBeCalledWith(transactionId);
        expect(result).toBe(dbTransaction);
    });
});

describe("DatabaseService.saveRound", () => {
    it("should save delegates to round repository and fire events", async () => {
        const databaseService = container.resolve(DatabaseService);

        const round = 2;
        const delegate1 = { publicKey: "delegate1 public key", getAttribute: jest.fn() };
        const delegate2 = { publicKey: "delegate2 public key", getAttribute: jest.fn() };
        delegate1.getAttribute.mockReturnValueOnce(round);

        const activeDelegates = [delegate1, delegate2];
        await databaseService.saveRound(activeDelegates as any);

        expect(delegate1.getAttribute).toBeCalledWith("delegate.round");
        expect(roundRepository.save).toBeCalledWith(activeDelegates);
        expect(events.dispatch).toBeCalledWith("round.created", activeDelegates);
    });
});

describe("DatabaseService.deleteRound", () => {
    it("should delete round from round repository", async () => {
        const databaseService = container.resolve(DatabaseService);

        const round = 2;
        await databaseService.deleteRound(round);

        expect(roundRepository.deleteFrom).toBeCalledWith(round);
    });
});

describe("DatabaseService.verifyBlockchain", () => {
    it("should return false when there are no blocks", async () => {
        const databaseService = container.resolve(DatabaseService);

        const numberOfBlocks = 0;
        const numberOfTransactions = 0;
        const totalFee = "0";
        const totalAmount = "0";

        const blockStats = { numberOfTransactions, totalFee, totalAmount, count: numberOfBlocks };
        blockRepository.getStatistics.mockResolvedValueOnce(blockStats);

        const transactionStats = { totalFee, totalAmount, count: numberOfTransactions };
        transactionRepository.getStatistics.mockResolvedValueOnce(transactionStats);

        const result = await databaseService.verifyBlockchain();

        expect(blockRepository.getStatistics).toBeCalledWith();
        expect(transactionRepository.getStatistics).toBeCalledWith();
        expect(result).toBe(false);
    });

    it("should return false when there are discrepancies", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = Blocks.BlockFactory.fromData(block1760000);

        const numberOfBlocks = 1760000;
        const numberOfTransactions = 999999;
        const totalFee = "100000";
        const totalAmount = "10000000";

        blockRepository.count.mockResolvedValueOnce(numberOfBlocks + 1);

        const blockStats = { numberOfTransactions, totalFee, totalAmount, count: numberOfBlocks };
        blockRepository.getStatistics.mockResolvedValueOnce(blockStats);

        const transactionStats = {
            totalFee: totalAmount,
            totalAmount: totalFee,
            count: numberOfTransactions + 1,
        };
        transactionRepository.getStatistics.mockResolvedValueOnce(transactionStats);

        const result = await databaseService.verifyBlockchain(lastBlock);

        expect(blockRepository.count).toBeCalledWith();
        expect(blockRepository.getStatistics).toBeCalledWith();
        expect(transactionRepository.getStatistics).toBeCalledWith();
        expect(result).toBe(false);
    });

    it("should check last block statistics", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = Blocks.BlockFactory.fromData(block1760000);

        const numberOfBlocks = 1760000;
        const numberOfTransactions = 999999;
        const totalFee = "100000";
        const totalAmount = "10000000";

        blockRepository.count.mockResolvedValueOnce(numberOfBlocks);

        const blockStats = { numberOfTransactions, totalFee, totalAmount, count: numberOfBlocks };
        blockRepository.getStatistics.mockResolvedValueOnce(blockStats);

        const transactionStats = { totalFee, totalAmount, count: numberOfTransactions };
        transactionRepository.getStatistics.mockResolvedValueOnce(transactionStats);

        const result = await databaseService.verifyBlockchain(lastBlock);

        expect(blockRepository.count).toBeCalled();
        expect(blockRepository.getStatistics).toBeCalled();
        expect(transactionRepository.getStatistics).toBeCalled();
        expect(result).toBe(true);
    });
});
