import { Container, Enums } from "@arkecosystem/core-kernel";
import { Blocks, Identities, Utils } from "@arkecosystem/crypto";

import { DatabaseService } from "../../../packages/core-database/src/database-service";
import block1760000 from "./__fixtures__/block1760000";

const getTimeStampForBlock = () => {
    throw new Error("Unreachable");
};

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
    delete: jest.fn(),
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

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);
container.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
container.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
container.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue(roundRepository);
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
    app.get.mockReset();
    app.terminate.mockReset();

    connection.query.mockReset();
    connection.close.mockReset();

    blockRepository.findOne.mockReset();
    blockRepository.findByHeightRange.mockReset();
    blockRepository.findByHeightRangeWithTransactionsForDownload.mockReset();
    blockRepository.findByHeightRangeWithTransactions.mockReset();
    blockRepository.findByHeights.mockReset();
    blockRepository.findLatest.mockReset();
    blockRepository.findByIds.mockReset();
    blockRepository.findRecent.mockReset();
    blockRepository.findTop.mockReset();
    blockRepository.count.mockReset();
    blockRepository.getStatistics.mockReset();
    blockRepository.saveBlocks.mockReset();
    blockRepository.deleteBlocks.mockReset();

    transactionRepository.find.mockReset();
    transactionRepository.findOne.mockReset();
    transactionRepository.findByBlockIds.mockReset();
    transactionRepository.getStatistics.mockReset();

    roundRepository.getRound.mockReset();
    roundRepository.save.mockReset();
    roundRepository.delete.mockReset();

    stateStore.setGenesisBlock.mockReset();
    stateStore.getGenesisBlock.mockReset();
    stateStore.setLastBlock.mockReset();
    stateStore.getLastBlock.mockReset();
    stateStore.getLastBlocksByHeight.mockReset();
    stateStore.getCommonBlocks.mockReset();
    stateStore.getLastBlockIds.mockReset();

    stateBlockStore.resize.mockReset();
    stateTransactionStore.resize.mockReset();

    handlerRegistry.getActivatedHandlerForData.mockReset();

    walletRepository.createWallet.mockReset();
    walletRepository.findByPublicKey.mockReset();
    walletRepository.findByUsername.mockReset();

    blockState.applyBlock.mockReset();
    blockState.revertBlock.mockReset();

    dposState.buildDelegateRanking.mockReset();
    dposState.setDelegatesRound.mockReset();
    dposState.getRoundDelegates.mockReset();

    getDposPreviousRoundState.mockReset();

    triggers.call.mockReset();

    logger.error.mockReset();
    logger.warning.mockReset();
    logger.info.mockReset();
    logger.debug.mockReset();

    events.call.mockReset();
    events.dispatch.mockReset();
});

describe("DatabaseService.initialize", () => {
    it("should dispatch starting event", async () => {
        const databaseService = container.resolve(DatabaseService);
        await databaseService.initialize();
        expect(events.dispatch).toBeCalledWith(Enums.StateEvent.Starting);
    });

    it("should reset database when CORE_RESET_DATABASE variable is set", async () => {
        try {
            const databaseService = container.resolve(DatabaseService);

            process.env.CORE_RESET_DATABASE = "1";
            const genesisBlock = {};
            stateStore.getGenesisBlock.mockReturnValueOnce(genesisBlock);

            await databaseService.initialize();

            expect(connection.query).toBeCalledWith("TRUNCATE TABLE blocks, rounds, transactions RESTART IDENTITY;");
            expect(stateStore.getGenesisBlock).toBeCalled();
            expect(blockRepository.saveBlocks).toBeCalledWith([genesisBlock]);
        } finally {
            delete process.env.CORE_RESET_DATABASE;
        }
    });

    it("should terminate app if exception was raised", async () => {
        const databaseService = container.resolve(DatabaseService);
        stateStore.setGenesisBlock.mockImplementationOnce(() => {
            throw new Error("Fail");
        });
        await databaseService.initialize();
        expect(app.terminate).toBeCalled();
    });

    it("should terminate if unable to deserialize last 5 blocks", async () => {
        const databaseService = container.resolve(DatabaseService);

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

        await databaseService.initialize();

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

describe("DatabaseService.restoreCurrentRound", () => {
    it("should restore round to its initial state", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

        const lastBlocksByHeight = [lastBlock.data];
        stateStore.getLastBlocksByHeight.mockReturnValueOnce(lastBlocksByHeight);
        blockRepository.findByHeightRangeWithTransactions.mockReturnValueOnce(lastBlocksByHeight);

        const prevRoundState = { getAllDelegates: jest.fn(), getRoundDelegates: jest.fn(), revert: jest.fn() };
        getDposPreviousRoundState.mockReturnValueOnce(prevRoundState);

        const delegateWallet = { setAttribute: jest.fn(), getAttribute: jest.fn() };
        walletRepository.findByUsername.mockReturnValueOnce(delegateWallet);

        const dposStateRoundDelegates = [delegateWallet];
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);

        const forgingDelegates = [delegateWallet];
        triggers.call.mockResolvedValue(forgingDelegates);

        await databaseService.restoreCurrentRound(1760000);

        expect(getDposPreviousRoundState).not.toBeCalled(); // restoring current round should not need previous round state
        // important: getActiveDelegates should be called with only roundInfo (restoreCurrentRound does *not* provide delegates to it)
        expect(triggers.call).toHaveBeenLastCalledWith("getActiveDelegates", {
            roundInfo: expect.anything(),
            delegates: undefined,
        });
        // @ts-ignore
        expect(databaseService.forgingDelegates).toEqual(forgingDelegates);
    });
});

describe("DatabaseService.reset", () => {
    it("should reset database", async () => {
        const databaseService = container.resolve(DatabaseService);

        const genesisBlock = {};
        stateStore.getGenesisBlock.mockReturnValueOnce(genesisBlock);

        await databaseService.reset();

        expect(connection.query).toBeCalledWith("TRUNCATE TABLE blocks, rounds, transactions RESTART IDENTITY;");
        expect(blockRepository.saveBlocks).toBeCalledWith([genesisBlock]);
    });
});

describe("DatabaseService.applyBlock", () => {
    it("should apply block, round, detect missing blocks, and fire events", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = { data: { height: 53, timestamp: 0 } };
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

        const delegateWallet = { publicKey: "delegate public key", getAttribute: jest.fn() };
        const delegateUsername = "test_delegate";
        delegateWallet.getAttribute.mockReturnValueOnce(delegateUsername);

        const handler = { emitEvents: jest.fn() };
        handlerRegistry.getActivatedHandlerForData.mockResolvedValueOnce(handler);

        // still previous last block!
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

        // @ts-ignore
        databaseService.blocksInCurrentRound = [];
        // @ts-ignore
        databaseService.forgingDelegates = [delegateWallet] as any;

        const transaction = {};
        const block = { data: { height: 54, timestamp: 35 }, transactions: [transaction] };
        await databaseService.applyBlock(block as any);

        expect(stateStore.getLastBlock).toBeCalledTimes(1);
        expect(blockState.applyBlock).toBeCalledWith(block);
        // @ts-ignore
        expect(databaseService.blocksInCurrentRound).toEqual([block]);
        expect(events.dispatch).toBeCalledWith("forger.missing", { delegate: delegateWallet });
        expect(handler.emitEvents).toBeCalledWith(transaction, events);
        expect(events.dispatch).toBeCalledWith("block.applied", block.data);
    });

    it("should apply block, not apply round, and not detect missed blocks when last block height is 1", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = { data: { height: 1 } };
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

        const handler = { emitEvents: jest.fn() };
        handlerRegistry.getActivatedHandlerForData.mockResolvedValueOnce(handler);

        // still previous last block!
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

        const transaction = {};
        const block = { data: { height: 2, timestamp: 35 }, transactions: [transaction] };
        await databaseService.applyBlock(block as any);

        expect(stateStore.getLastBlock).toBeCalledTimes(1);
        expect(handler.emitEvents).toBeCalledWith(transaction, events);
        expect(events.dispatch).toBeCalledWith("block.applied", block.data);
    });
});

describe("DatabaseService.applyRound", () => {
    it("should build delegates, save round, dispatch events when round changes on next height", async () => {
        const databaseService = container.resolve(DatabaseService);

        const forgingDelegate = { getAttribute: jest.fn() };
        const forgingDelegateRound = 1;
        forgingDelegate.getAttribute.mockReturnValueOnce(forgingDelegateRound);
        // @ts-ignore
        databaseService.forgingDelegates = [forgingDelegate] as any;

        // @ts-ignore
        databaseService.blocksInCurrentRound = [{ data: { generatorPublicKey: "delegate public key" } }] as any;

        const delegateWallet = { publicKey: "delegate public key", getAttribute: jest.fn() };
        const dposStateRoundDelegates = [delegateWallet];
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);

        const delegateWalletRound = 2;
        delegateWallet.getAttribute.mockReturnValueOnce(delegateWalletRound);

        walletRepository.findByPublicKey.mockReturnValueOnce(delegateWallet);

        const delegateUsername = "test_delegate";
        delegateWallet.getAttribute.mockReturnValueOnce(delegateUsername);

        const height = 51;
        await databaseService.applyRound(height);

        expect(dposState.buildDelegateRanking).toBeCalled();
        expect(dposState.setDelegatesRound).toBeCalledWith({
            round: 2,
            nextRound: 2,
            roundHeight: 52,
            maxDelegates: 51,
        });
        expect(roundRepository.save).toBeCalledWith(dposStateRoundDelegates);
        expect(events.dispatch).toBeCalledWith("round.applied");
    });

    it("should build delegates, save round, dispatch events when height is 1", async () => {
        const databaseService = container.resolve(DatabaseService);

        const forgingDelegate = { getAttribute: jest.fn() };
        const forgingDelegateRound = 1;
        forgingDelegate.getAttribute.mockReturnValueOnce(forgingDelegateRound);
        // @ts-ignore
        databaseService.forgingDelegates = [forgingDelegate] as any;

        // @ts-ignore
        databaseService.blocksInCurrentRound = [];

        const delegateWallet = { publicKey: "delegate public key", getAttribute: jest.fn() };
        const dposStateRoundDelegates = [delegateWallet];
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);

        const delegateWalletRound = 1;
        delegateWallet.getAttribute.mockReturnValueOnce(delegateWalletRound);

        walletRepository.findByPublicKey.mockReturnValueOnce(delegateWallet);

        const delegateUsername = "test_delegate";
        delegateWallet.getAttribute.mockReturnValueOnce(delegateUsername);

        const height = 1;
        await databaseService.applyRound(height);

        expect(dposState.buildDelegateRanking).toBeCalled();
        expect(dposState.setDelegatesRound).toBeCalledWith({
            round: 1,
            nextRound: 1,
            roundHeight: 1,
            maxDelegates: 51,
        });
        expect(roundRepository.save).toBeCalledWith(dposStateRoundDelegates);
        expect(events.dispatch).toBeCalledWith("round.applied");
    });

    it("should build delegates, save round, dispatch events, and skip missing round checks when first round has genesis block only", async () => {
        const databaseService = container.resolve(DatabaseService);

        const forgingDelegate = { getAttribute: jest.fn() };
        const forgingDelegateRound = 1;
        forgingDelegate.getAttribute.mockReturnValueOnce(forgingDelegateRound);
        // @ts-ignore
        databaseService.forgingDelegates = [forgingDelegate] as any;

        // @ts-ignore
        databaseService.blocksInCurrentRound = [{ data: { height: 1 } }] as any;

        const delegateWallet = { publicKey: "delegate public key", getAttribute: jest.fn() };
        const dposStateRoundDelegates = [delegateWallet];
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);

        const delegateWalletRound = 2;
        delegateWallet.getAttribute.mockReturnValueOnce(delegateWalletRound);

        walletRepository.findByPublicKey.mockReturnValueOnce(delegateWallet);

        const delegateUsername = "test_delegate";
        delegateWallet.getAttribute.mockReturnValueOnce(delegateUsername);

        const height = 51;
        await databaseService.applyRound(height);

        expect(dposState.buildDelegateRanking).toBeCalled();
        expect(dposState.setDelegatesRound).toBeCalledWith({
            round: 2,
            nextRound: 2,
            roundHeight: 52,
            maxDelegates: 51,
        });
        expect(roundRepository.save).toBeCalledWith(dposStateRoundDelegates);
        expect(events.dispatch).toBeCalledWith("round.applied");
    });

    it("should delete round and rethrow error when error was thrown", async () => {
        const databaseService = container.resolve(DatabaseService);

        dposState.buildDelegateRanking.mockImplementation(() => {
            throw new Error("Fail");
        });

        const height = 51;
        const check = () => databaseService.applyRound(height);

        await expect(check()).rejects.toThrowError("Fail");
        expect(roundRepository.delete).toBeCalledWith({ round: 2 });
    });

    it("should do nothing when next height is same round", async () => {
        const databaseService = container.resolve(DatabaseService);
        const height = 50;
        await databaseService.applyRound(height);
        expect(logger.info).not.toBeCalled();
    });

    it("should warn when, and do nothing when round was already applied", async () => {
        const databaseService = container.resolve(DatabaseService);

        const forgingDelegate = { getAttribute: jest.fn() };
        const forgingDelegateRound = 2;
        forgingDelegate.getAttribute.mockReturnValueOnce(forgingDelegateRound);
        // @ts-ignore
        databaseService.forgingDelegates = [forgingDelegate] as any;

        const height = 51;
        await databaseService.applyRound(height);

        expect(logger.warning).toBeCalledWith(
            "Round 2 has already been applied. This should happen only if you are a forger.",
        );
    });
});

describe("DatabaseService.getActiveDelegates", () => {
    it("should return shuffled round delegates", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);

        // @ts-ignore
        blockRepository.findLatest.mockResolvedValueOnce(lastBlock.data);
        // @ts-ignore
        transactionRepository.findByBlockIds.mockResolvedValueOnce(lastBlock.transactions);

        const delegatePublicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        const delegateVoteBalance = Utils.BigNumber.make("100");
        const roundDelegateModel = { publicKey: delegatePublicKey, balance: delegateVoteBalance };
        roundRepository.getRound.mockResolvedValueOnce([roundDelegateModel]);

        const newDelegateWallet = { setAttribute: jest.fn(), clone: jest.fn() };
        walletRepository.createWallet.mockReturnValueOnce(newDelegateWallet);

        const oldDelegateWallet = { getAttribute: jest.fn() };
        walletRepository.findByPublicKey.mockReturnValueOnce(oldDelegateWallet);

        const delegateUsername = "test_delegate";
        oldDelegateWallet.getAttribute.mockReturnValueOnce(delegateUsername);

        const cloneDelegateWallet = {};
        newDelegateWallet.clone.mockReturnValueOnce(cloneDelegateWallet);

        await databaseService.getActiveDelegates();

        expect(walletRepository.findByPublicKey).toBeCalledWith(delegatePublicKey);
        expect(walletRepository.createWallet).toBeCalledWith(Identities.Address.fromPublicKey(delegatePublicKey));
        expect(oldDelegateWallet.getAttribute).toBeCalledWith("delegate.username", "");
        expect(newDelegateWallet.setAttribute).toBeCalledWith("delegate", {
            voteBalance: delegateVoteBalance,
            username: delegateUsername,
        });
        expect(newDelegateWallet.clone).toBeCalled();
    });

    it("should return cached forgingDelegates when round is the same", async () => {
        const databaseService = container.resolve(DatabaseService);

        const forgingDelegate = { getAttribute: jest.fn() };
        const forgingDelegateRound = 2;
        forgingDelegate.getAttribute.mockReturnValueOnce(forgingDelegateRound);
        // @ts-ignore
        databaseService.forgingDelegates = [forgingDelegate] as any;

        const roundInfo = { round: 2 };
        const result = await databaseService.getActiveDelegates(roundInfo as any);

        expect(forgingDelegate.getAttribute).toBeCalledWith("delegate.round");
        // @ts-ignore
        expect(result).toBe(databaseService.forgingDelegates);
    });
});

describe("DatabaseService.getBlock", () => {
    it("should return block", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
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

        stateStore.getLastBlocksByHeight.mockReturnValueOnce([block101, block102]);
        blockRepository.findByHeightRangeWithTransactions.mockResolvedValueOnce([block100]);

        const result = await databaseService.getBlocks(100, 3);

        expect(stateStore.getLastBlocksByHeight).toBeCalledWith(100, 102, undefined);
        expect(blockRepository.findByHeightRangeWithTransactions).toBeCalledWith(100, 100);
        expect(result).toEqual([block100, block101, block102]);
    });

    it("should return blocks without transactions when block headers are requested", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block100 = { height: 100 };
        const block101 = { height: 101 };
        const block102 = { height: 102 };

        stateStore.getLastBlocksByHeight.mockReturnValueOnce([block101, block102]);
        blockRepository.findByHeightRange.mockResolvedValueOnce([block100]);

        const result = await databaseService.getBlocks(100, 3, true);

        expect(stateStore.getLastBlocksByHeight).toBeCalledWith(100, 102, true);
        expect(blockRepository.findByHeightRange).toBeCalledWith(100, 100);
        expect(result).toEqual([block100, block101, block102]);
    });
});

describe("DatabaseService.getBlocksForDownload", () => {
    it("should return blocks with transactions when full blocks are requested", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block100 = { height: 100, transactions: [] };
        const block101 = { height: 101, transactions: [] };
        const block102 = { height: 102, transactions: [] };

        blockRepository.findByHeightRangeWithTransactionsForDownload.mockResolvedValueOnce([block100, block101, block102]);

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

describe("DatabaseService.getBlocksByHeight", () => {
    it("should return blocks with transactions when full blocks are requested", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block100 = { height: 100, transactions: [] };
        const block101 = { height: 101, transactions: [] };
        const block102 = { height: 102, transactions: [] };

        stateStore.getLastBlocksByHeight.mockReturnValueOnce([block100]);
        stateStore.getLastBlocksByHeight.mockReturnValueOnce([]);
        stateStore.getLastBlocksByHeight.mockReturnValueOnce([block102]);

        blockRepository.findByHeights.mockResolvedValueOnce([block101]);

        const result = await databaseService.getBlocksByHeight([100, 101, 102]);

        expect(stateStore.getLastBlocksByHeight).toBeCalledWith(100, 100, true);
        expect(stateStore.getLastBlocksByHeight).toBeCalledWith(101, 101, true);
        expect(stateStore.getLastBlocksByHeight).toBeCalledWith(102, 102, true);
        expect(blockRepository.findByHeights).toBeCalledWith([101]);
        expect(result).toEqual([block100, block101, block102]);
    });
});

describe("DatabaseService.getBlocksForRound", () => {
    it("should return empty array if there are no blocks", async () => {
        const databaseService = container.resolve(DatabaseService);

        stateStore.getLastBlock.mockReturnValueOnce(undefined);
        blockRepository.findLatest.mockResolvedValueOnce(undefined);

        const roundInfo = { roundHeight: 52, maxDelegates: 51 };
        const result = await databaseService.getBlocksForRound(roundInfo as any);

        expect(stateStore.getLastBlock).toBeCalled();
        expect(blockRepository.findLatest).toBeCalled();
        expect(result).toEqual([]);
    });

    it("should return array with genesis block only when last block is genesis block", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = { data: { height: 1 } };
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

        const roundInfo = { roundHeight: 1, maxDelegates: 51 };
        const result = await databaseService.getBlocksForRound(roundInfo as any);

        expect(stateStore.getLastBlock).toBeCalled();
        expect(result).toEqual([lastBlock]);
    });

    it("should return current round blocks", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block1 = { data: { height: 1 } };
        const block2 = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
        stateStore.getLastBlock.mockReturnValueOnce(block2);
        stateStore.getLastBlocksByHeight.mockReturnValueOnce([
            block1.data,
            { ...block2.data, transactions: block2.transactions.map((t) => t.data) },
        ]);
        stateStore.getGenesisBlock.mockReturnValueOnce(block1);

        const roundInfo = { roundHeight: 1, maxDelegates: 2 };
        const result = await databaseService.getBlocksForRound(roundInfo as any);
        Object.assign(result[1], { getBlockTimeStampLookup: block2["getBlockTimeStampLookup"] });

        expect(stateStore.getLastBlock).toBeCalled();
        expect(stateStore.getLastBlocksByHeight).toBeCalledWith(1, 2, undefined);
        expect(result).toEqual([block1, block2]);
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

        const lastBlock = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
        blockRepository.findLatest.mockResolvedValueOnce({ ...lastBlock.data });
        transactionRepository.findByBlockIds.mockResolvedValueOnce(lastBlock.transactions);

        const result = await databaseService.getLastBlock();
        Object.assign(result, { getBlockTimeStampLookup: lastBlock["getBlockTimeStampLookup"] });

        expect(blockRepository.findLatest).toBeCalled();
        expect(transactionRepository.findByBlockIds).toBeCalledWith([lastBlock.data.id]);
        expect(result).toEqual(lastBlock);
    });
});

describe("DatabaseService.getCommonBlocks", () => {
    it("should return blocks by ids", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block100 = { id: "00100", height: 100, transactions: [] };
        const block101 = { id: "00101", height: 101, transactions: [] };
        const block102 = { id: "00102", height: 102, transactions: [] };

        stateStore.getCommonBlocks.mockReturnValueOnce([block101, block102]);
        blockRepository.findByIds.mockResolvedValueOnce([block100, block101, block102]);

        const result = await databaseService.getCommonBlocks([block100.id, block101.id, block102.id]);

        expect(stateStore.getCommonBlocks).toBeCalledWith([block100.id, block101.id, block102.id]);
        expect(blockRepository.findByIds).toBeCalledWith([block100.id, block101.id, block102.id]);
        expect(result).toEqual([block100, block101, block102]);
    });
});

describe("DatabaseService.getRecentBlockIds", () => {
    it("should return last 10 block ids", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block101 = { id: "00101", height: 101, transactions: [] };
        const block102 = { id: "00102", height: 102, transactions: [] };
        const block103 = { id: "00103", height: 103, transactions: [] };
        const block104 = { id: "00104", height: 104, transactions: [] };
        const block105 = { id: "00105", height: 105, transactions: [] };
        const block106 = { id: "00106", height: 106, transactions: [] };
        const block107 = { id: "00107", height: 107, transactions: [] };
        const block108 = { id: "00108", height: 108, transactions: [] };
        const block109 = { id: "00109", height: 109, transactions: [] };
        const block110 = { id: "00110", height: 110, transactions: [] };

        stateStore.getLastBlockIds.mockReturnValueOnce([
            block101,
            block102,
            block103,
            block104,
            block105,
            block106,
            block107,
            block108,
            block109,
        ]);

        blockRepository.findRecent.mockResolvedValueOnce([
            block110,
            block109,
            block108,
            block107,
            block106,
            block105,
            block104,
            block103,
            block102,
            block101,
        ]);

        const result = await databaseService.getRecentBlockIds();

        expect(result).toEqual([
            block110.id,
            block109.id,
            block108.id,
            block107.id,
            block106.id,
            block105.id,
            block104.id,
            block103.id,
            block102.id,
            block101.id,
        ]);
    });
});

describe("DatabaseService.getTopBlocks", () => {
    it("should return top blocks with transactions", async () => {
        const databaseService = container.resolve(DatabaseService);

        const block = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
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

describe("DatabaseService.loadBlocksFromCurrentRound", () => {
    it("should initialize blocksInCurrentRound property", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);
        stateStore.getLastBlocksByHeight.mockReturnValueOnce([lastBlock.data]);
        blockRepository.findByHeightRangeWithTransactions.mockReturnValueOnce([lastBlock.data]);

        await databaseService.loadBlocksFromCurrentRound();

        expect(stateStore.getLastBlock).toBeCalled();
    });
});

describe("DatabaseService.revertBlock", () => {
    it("should revert state, and fire events", async () => {
        const databaseService = container.resolve(DatabaseService);

        const transaction1 = { data: {} };
        const transaction2 = { data: {} };
        const block = {
            data: { id: "123", height: 100 },
            transactions: [transaction1, transaction2],
        };
        // @ts-ignore
        databaseService.blocksInCurrentRound = [block as any];

        await databaseService.revertBlock(block as any);

        expect(blockState.revertBlock).toBeCalledWith(block);
        expect(events.dispatch).toBeCalledWith("transaction.reverted", transaction1.data);
        expect(events.dispatch).toBeCalledWith("transaction.reverted", transaction2.data);
        expect(events.dispatch).toBeCalledWith("block.reverted", block.data);
    });
});

describe("DatabaseService.revertRound", () => {
    it("should revert, and delete round when reverting to previous round", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);
        stateStore.getLastBlocksByHeight.mockReturnValueOnce([lastBlock.data]);
        blockRepository.findByHeightRangeWithTransactions.mockReturnValueOnce([lastBlock.data]);

        const prevRoundState = { getAllDelegates: jest.fn(), getRoundDelegates: jest.fn(), revert: jest.fn() };
        getDposPreviousRoundState.mockReturnValueOnce(prevRoundState).mockReturnValueOnce(prevRoundState);

        const prevRoundDelegateWallet = { getAttribute: jest.fn() };
        const prevRoundDposStateAllDelegates = [prevRoundDelegateWallet];
        prevRoundState.getAllDelegates.mockReturnValueOnce(prevRoundDposStateAllDelegates);

        const prevRoundDelegateUsername = "test_delegate";
        prevRoundDelegateWallet.getAttribute.mockReturnValueOnce(prevRoundDelegateUsername);

        const delegateWallet = { setAttribute: jest.fn(), getAttribute: jest.fn() };
        walletRepository.findByUsername.mockReturnValueOnce(delegateWallet);

        const prevRoundDelegateRank = 1;
        prevRoundDelegateWallet.getAttribute.mockReturnValueOnce(prevRoundDelegateRank);

        const prevRoundDposStateRoundDelegates = [prevRoundDelegateWallet];
        prevRoundState.getRoundDelegates.mockReturnValueOnce(prevRoundDposStateRoundDelegates);

        const dposStateRoundDelegates = [delegateWallet];
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);
        dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);

        const forgingDelegates = [delegateWallet];
        triggers.call.mockResolvedValue(forgingDelegates);

        await databaseService.revertRound(51);

        expect(getDposPreviousRoundState).toBeCalled();
        expect(walletRepository.findByUsername).toBeCalledWith(prevRoundDelegateUsername);
        expect(delegateWallet.setAttribute).toBeCalledWith("delegate.rank", prevRoundDelegateRank);
        // @ts-ignore
        expect(databaseService.forgingDelegates).toEqual(forgingDelegates);
        expect(roundRepository.delete).toBeCalledWith({ round: 2 });
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

        expect(roundRepository.delete).toBeCalledWith({ round });
    });
});

describe("DatabaseService.verifyBlockchain", () => {
    it("should return false when there are no blocks", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = undefined;
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

        const numberOfBlocks = 0;
        const numberOfTransactions = 0;
        const totalFee = "0";
        const totalAmount = "0";

        const blockStats = { numberOfTransactions, totalFee, totalAmount, count: numberOfBlocks };
        blockRepository.getStatistics.mockResolvedValueOnce(blockStats);

        const transactionStats = { totalFee, totalAmount, count: numberOfTransactions };
        transactionRepository.getStatistics.mockResolvedValueOnce(transactionStats);

        const result = await databaseService.verifyBlockchain();

        expect(stateStore.getLastBlock).toBeCalledWith();
        expect(blockRepository.getStatistics).toBeCalledWith();
        expect(transactionRepository.getStatistics).toBeCalledWith();
        expect(result).toBe(false);
    });

    it("should return false when there are discrepancies", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

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

        const result = await databaseService.verifyBlockchain();

        expect(stateStore.getLastBlock).toBeCalledWith();
        expect(blockRepository.count).toBeCalledWith();
        expect(blockRepository.getStatistics).toBeCalledWith();
        expect(transactionRepository.getStatistics).toBeCalledWith();
        expect(result).toBe(false);
    });

    it("should check last block statistics", async () => {
        const databaseService = container.resolve(DatabaseService);

        const lastBlock = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
        stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

        const numberOfBlocks = 1760000;
        const numberOfTransactions = 999999;
        const totalFee = "100000";
        const totalAmount = "10000000";

        blockRepository.count.mockResolvedValueOnce(numberOfBlocks);

        const blockStats = { numberOfTransactions, totalFee, totalAmount, count: numberOfBlocks };
        blockRepository.getStatistics.mockResolvedValueOnce(blockStats);

        const transactionStats = { totalFee, totalAmount, count: numberOfTransactions };
        transactionRepository.getStatistics.mockResolvedValueOnce(transactionStats);

        const result = await databaseService.verifyBlockchain();

        expect(stateStore.getLastBlock).toBeCalled();
        expect(blockRepository.count).toBeCalled();
        expect(blockRepository.getStatistics).toBeCalled();
        expect(transactionRepository.getStatistics).toBeCalled();
        expect(result).toBe(true);
    });
});
