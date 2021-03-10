import "jest-extended";

import { DatabaseService } from "@packages/core-database";
import { Container, Enums } from "@packages/core-kernel";
import { DatabaseInteraction } from "@packages/core-state/src/database-interactions";

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
const roundState = {
    applyBlock: jest.fn(),
    revertBlock: jest.fn(),
    getActiveDelegates: jest.fn(),
    restore: jest.fn(),
    detectMissedBlocks: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);
container.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
container.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
container.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue(roundRepository);
container.bind(Container.Identifiers.DatabaseService).to(DatabaseService);
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
container.bind(Container.Identifiers.RoundState).toConstantValue(roundState);

beforeEach(() => {
    jest.resetAllMocks();
});

describe("DatabaseInteractions", () => {
    it("should dispatch starting event", async () => {
        const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);
        await databaseInteraction.initialize();
        expect(events.dispatch).toBeCalledWith(Enums.StateEvent.Starting);
    });

    it("should reset database when CORE_RESET_DATABASE variable is set", async () => {
        try {
            const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

            process.env.CORE_RESET_DATABASE = "1";
            const genesisBlock = {};
            stateStore.getGenesisBlock.mockReturnValue(genesisBlock);

            await databaseInteraction.initialize();
            // expect(databaseInteraction.reset).toBeCalled();
            expect(stateStore.getGenesisBlock).toBeCalled();
            // expect(databaseInteraction.saveBlocks).toBeCalledWith([genesisBlock]);
            expect(stateStore.setGenesisBlock).toBeCalled();
        } finally {
            delete process.env.CORE_RESET_DATABASE;
        }
    });

    it("should terminate app if exception was raised", async () => {
        const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);
        stateStore.setGenesisBlock.mockImplementationOnce(() => {
            throw new Error("Fail");
        });
        await databaseInteraction.initialize();
        expect(app.terminate).toBeCalled();
    });

    it("should terminate if unable to deserialize last 5 blocks", async () => {
        const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

        const block101data = { id: "block101", height: 101 };
        const block102data = { id: "block102", height: 102 };
        const block103data = { id: "block103", height: 103 };
        const block104data = { id: "block104", height: 104 };
        const block105data = { id: "block105", height: 105 };
        const block106data = { id: "block106", height: 105 };

        blockRepository.findLatest.mockResolvedValueOnce(block106data);

        blockRepository.findLatest.mockResolvedValueOnce(block106data); // this.getLastBlock
        transactionRepository.findByBlockIds.mockResolvedValueOnce([]); // this.getLastBlock

        blockRepository.findLatest.mockResolvedValueOnce(block106data); // blockRepository.deleteBlocks
        blockRepository.findLatest.mockResolvedValueOnce(block105data); // this.getLastBlock
        transactionRepository.findByBlockIds.mockResolvedValueOnce([]); // this.getLastBlock

        blockRepository.findLatest.mockResolvedValueOnce(block105data); // blockRepository.deleteBlocks
        blockRepository.findLatest.mockResolvedValueOnce(block104data); // this.getLastBlock
        transactionRepository.findByBlockIds.mockResolvedValueOnce([]); // this.getLastBlock

        blockRepository.findLatest.mockResolvedValueOnce(block104data); // blockRepository.deleteBlocks
        blockRepository.findLatest.mockResolvedValueOnce(block103data); // this.getLastBlock
        transactionRepository.findByBlockIds.mockResolvedValueOnce([]); // this.getLastBlock

        blockRepository.findLatest.mockResolvedValueOnce(block103data); // blockRepository.deleteBlocks
        blockRepository.findLatest.mockResolvedValueOnce(block102data); // this.getLastBlock
        transactionRepository.findByBlockIds.mockResolvedValueOnce([]); // this.getLastBlock

        blockRepository.findLatest.mockResolvedValueOnce(block102data); // blockRepository.deleteBlocks
        blockRepository.findLatest.mockResolvedValueOnce(block101data); // this.getLastBlock
        transactionRepository.findByBlockIds.mockResolvedValueOnce([]); // this.getLastBlock

        await databaseInteraction.initialize();

        expect(stateStore.setGenesisBlock).toBeCalled();
        expect(blockRepository.findLatest).toBeCalledTimes(12);

        expect(transactionRepository.findByBlockIds).toBeCalledWith([block106data.id]);

        expect(blockRepository.deleteBlocks).toBeCalledWith([block106data]);
        expect(transactionRepository.findByBlockIds).toBeCalledWith([block105data.id]);

        expect(blockRepository.deleteBlocks).toBeCalledWith([block105data]);
        expect(transactionRepository.findByBlockIds).toBeCalledWith([block104data.id]);

        expect(blockRepository.deleteBlocks).toBeCalledWith([block104data]);
        expect(transactionRepository.findByBlockIds).toBeCalledWith([block103data.id]);

        expect(blockRepository.deleteBlocks).toBeCalledWith([block103data]);
        expect(transactionRepository.findByBlockIds).toBeCalledWith([block102data.id]);

        expect(blockRepository.deleteBlocks).toBeCalledWith([block102data]);
        expect(transactionRepository.findByBlockIds).toBeCalledWith([block101data.id]);

        expect(app.terminate).toBeCalled();
    });
});

describe("DatabaseInteraction.restoreCurrentRound", () => {
    it("should call roundState.restore", async () => {
        const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

        await databaseInteraction.restoreCurrentRound();

        expect(roundState.restore).toHaveBeenCalled();
    });
});

describe("DatabaseInteraction.reset", () => {
    it("should reset database", async () => {
        const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

        const genesisBlock = {};
        stateStore.getGenesisBlock.mockReturnValueOnce(genesisBlock);

        // @ts-ignore
        await databaseInteraction.reset();

        expect(connection.query).toBeCalledWith("TRUNCATE TABLE blocks, rounds, transactions RESTART IDENTITY;");
        expect(blockRepository.saveBlocks).toBeCalledWith([genesisBlock]);
    });
});

describe("DatabaseInteraction.applyBlock", () => {
    it("should apply block, round, detect missing blocks, and fire events", async () => {
        const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

        const handler = { emitEvents: jest.fn() };
        handlerRegistry.getActivatedHandlerForData.mockResolvedValueOnce(handler);

        const transaction = { data: { id: "dummy_id" } };
        const block = { data: { height: 54, timestamp: 35 }, transactions: [transaction] };
        await databaseInteraction.applyBlock(block as any);

        expect(roundState.detectMissedBlocks).toBeCalledWith(block);

        expect(blockState.applyBlock).toBeCalledWith(block);
        expect(roundState.applyBlock).toBeCalledWith(block);
        expect(handler.emitEvents).toBeCalledWith(transaction, events);
        expect(events.dispatch).toBeCalledWith(Enums.TransactionEvent.Applied, transaction.data);
        expect(events.dispatch).toBeCalledWith(Enums.BlockEvent.Applied, block.data);
    });
});

describe("DatabaseInteraction.revertBlock", () => {
    it("should revert state, and fire events", async () => {
        const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

        const transaction1 = { data: {} };
        const transaction2 = { data: {} };
        const block = {
            data: { id: "123", height: 100 },
            transactions: [transaction1, transaction2],
        };

        await databaseInteraction.revertBlock(block as any);

        expect(blockState.revertBlock).toBeCalledWith(block);
        expect(roundState.revertBlock).toBeCalledWith(block);
        expect(events.dispatch).toBeCalledWith(Enums.TransactionEvent.Reverted, transaction1.data);
        expect(events.dispatch).toBeCalledWith(Enums.TransactionEvent.Reverted, transaction2.data);
        expect(events.dispatch).toBeCalledWith(Enums.BlockEvent.Reverted, block.data);
    });
});
