import "jest-extended";

import { DatabaseService } from "@packages/core-database";
import { Container } from "@packages/core-kernel";
import { DatabaseInterceptor } from "@packages/core-state/src/database-interceptor";

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

const stateStore = {
    setGenesisBlock: jest.fn(),
    getGenesisBlock: jest.fn(),
    setLastBlock: jest.fn(),
    getLastBlock: jest.fn(),
    getLastBlocks: jest.fn(),
    getLastBlocksByHeight: jest.fn(),
    getCommonBlocks: jest.fn(),
    getLastBlockIds: jest.fn(),
};

const stateBlockStore = {
    resize: jest.fn(),
};

const stateTransactionStore = {
    resize: jest.fn(),
};

const handlerRegistry = {
    getActivatedHandlerForData: jest.fn(),
};

const walletRepository = {
    createWallet: jest.fn(),
    findByPublicKey: jest.fn(),
    findByUsername: jest.fn(),
};

const blockState = {
    applyBlock: jest.fn(),
    revertBlock: jest.fn(),
};

const dposState = {
    buildDelegateRanking: jest.fn(),
    setDelegatesRound: jest.fn(),
    getRoundDelegates: jest.fn(),
};

const getDposPreviousRoundState = jest.fn();

const triggers = {
    call: jest.fn(),
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
container.bind(Container.Identifiers.DatabaseService).to(DatabaseService).inSingletonScope();
container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
container.bind(Container.Identifiers.StateBlockStore).toConstantValue(stateBlockStore);
container.bind(Container.Identifiers.StateTransactionStore).toConstantValue(stateTransactionStore);
container.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(handlerRegistry);
container.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);
container.bind(Container.Identifiers.BlockState).toConstantValue(blockState);
container.bind(Container.Identifiers.DposState).toConstantValue(dposState);
container.bind(Container.Identifiers.DposPreviousRoundStateProvider).toConstantValue(getDposPreviousRoundState);
container.bind(Container.Identifiers.TriggerService).toConstantValue(triggers);
container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(events);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);

beforeEach(() => {
    jest.resetAllMocks();
});

describe("DatabaseInterceptor.getBlock", () => {
    it("should return block from state store", async () => {
        const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);

        const block = { data: { id: "block_id", height: 100, transactions: [] } };

        stateStore.getLastBlocks.mockReturnValueOnce([block]);

        await expect(databaseInterceptor.getBlock("block_id")).resolves.toEqual(block);
    });

    it("should return block from database", async () => {
        const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);
        const databaseService = container.get<DatabaseService>(Container.Identifiers.DatabaseService);

        const block = { data: { id: "block_id", height: 100, transactions: [] } };

        stateStore.getLastBlocks.mockReturnValueOnce([]);
        // @ts-ignore
        jest.spyOn(databaseService, "getBlock").mockResolvedValueOnce(block);

        await expect(databaseInterceptor.getBlock("block_id")).resolves.toEqual(block);
    });
});

describe("DatabaseInterceptor.getCommonBlocks", () => {
    it("should return blocks by ids", async () => {
        const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);

        const block100 = { id: "00100", height: 100, transactions: [] };
        const block101 = { id: "00101", height: 101, transactions: [] };
        const block102 = { id: "00102", height: 102, transactions: [] };

        stateStore.getCommonBlocks.mockReturnValueOnce([block101, block102]);
        blockRepository.findByIds.mockResolvedValueOnce([block100, block101, block102]);

        const result = await databaseInterceptor.getCommonBlocks([block100.id, block101.id, block102.id]);

        expect(stateStore.getCommonBlocks).toBeCalledWith([block100.id, block101.id, block102.id]);
        expect(blockRepository.findByIds).toBeCalledWith([block100.id, block101.id, block102.id]);
        expect(result).toEqual([block100, block101, block102]);
    });
});

describe("DatabaseInterceptor.getBlocksByHeight", () => {
    it("should return blocks with transactions when full blocks are requested", async () => {
        const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);

        const block100 = { height: 100, transactions: [] };
        const block101 = { height: 101, transactions: [] };
        const block102 = { height: 102, transactions: [] };

        stateStore.getLastBlocksByHeight.mockReturnValueOnce([block100]);
        stateStore.getLastBlocksByHeight.mockReturnValueOnce([]);
        stateStore.getLastBlocksByHeight.mockReturnValueOnce([block102]);

        blockRepository.findByHeights.mockResolvedValueOnce([block101]);

        const result = await databaseInterceptor.getBlocksByHeight([100, 101, 102]);

        expect(stateStore.getLastBlocksByHeight).toBeCalledWith(100, 100, true);
        expect(stateStore.getLastBlocksByHeight).toBeCalledWith(101, 101, true);
        expect(stateStore.getLastBlocksByHeight).toBeCalledWith(102, 102, true);
        expect(blockRepository.findByHeights).toBeCalledWith([101]);
        expect(result).toEqual([block100, block101, block102]);
    });
});
