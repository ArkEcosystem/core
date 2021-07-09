import { Container } from "@arkecosystem/core-kernel";
import { RollbackDatabase } from "@packages/core-blockchain/src/state-machine/actions/rollback-database";

describe("RollbackDatabase", () => {
    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const blockchain = {
        dispatch: jest.fn(),
        removeTopBlocks: jest.fn(),
    };
    const stateStore = {
        setRestoredDatabaseIntegrity: jest.fn(),
        setLastBlock: jest.fn(),
        setLastStoredBlockHeight: jest.fn(),
    };
    const databaseService = {
        verifyBlockchain: jest.fn(),
        getLastBlock: jest.fn(),
    };
    const mapConfiguration = {
        "databaseRollback.maxBlockRewind": 20,
        "databaseRollback.steps": 5,
    };
    const configuration = { getRequired: (key) => mapConfiguration[key] };

    const application = { get: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        container.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("handle", () => {
        it("should remove top blocks until databaseService.verifyBlockchain()", async () => {
            const rollbackDatabase = container.resolve<RollbackDatabase>(RollbackDatabase);

            const lastBlock = {
                data: {
                    id: "123",
                    height: 5556,
                },
            };
            const lastBlockAfterRollback = {
                data: {
                    id: "122",
                    height: 5536,
                },
            };
            databaseService.getLastBlock = jest
                .fn()
                .mockReturnValueOnce(lastBlock)
                .mockReturnValueOnce(lastBlockAfterRollback);
            databaseService.verifyBlockchain = jest
                .fn()
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true); // returns false 3 times then true
            await rollbackDatabase.handle();

            expect(databaseService.verifyBlockchain).toHaveBeenCalledTimes(4);
            expect(stateStore.setRestoredDatabaseIntegrity).toHaveBeenCalledWith(true);
            expect(stateStore.setLastBlock).toHaveBeenCalledWith(lastBlockAfterRollback);
            expect(stateStore.setLastStoredBlockHeight).toHaveBeenCalledWith(lastBlockAfterRollback.data.height);
            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledWith("SUCCESS");
        });

        it("should dispatch FAILURE when !databaseService.verifyBlockchain() after trying according to maxBlockRewind and steps", async () => {
            const rollbackDatabase = container.resolve<RollbackDatabase>(RollbackDatabase);

            const lastBlock = {
                data: {
                    id: "123",
                    height: 5556,
                },
            };
            databaseService.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
            databaseService.verifyBlockchain = jest.fn().mockReturnValue(false);
            await rollbackDatabase.handle();

            expect(databaseService.verifyBlockchain).toHaveBeenCalledTimes(4);
            expect(stateStore.setRestoredDatabaseIntegrity).not.toHaveBeenCalled();
            expect(stateStore.setLastBlock).not.toHaveBeenCalled();
            expect(stateStore.setLastStoredBlockHeight).not.toHaveBeenCalled();
            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledWith("FAILURE");
        });

        it("should dispatch FAILURE when !databaseService.verifyBlockchain() after rollback to genesisBlock", async () => {
            const rollbackDatabase = container.resolve<RollbackDatabase>(RollbackDatabase);

            const lastBlock = {
                data: {
                    id: "123",
                    height: 3,
                },
            };
            databaseService.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
            databaseService.verifyBlockchain = jest.fn().mockReturnValue(false);
            await rollbackDatabase.handle();

            expect(databaseService.verifyBlockchain).toHaveBeenCalledTimes(1);
            expect(stateStore.setRestoredDatabaseIntegrity).not.toHaveBeenCalled();
            expect(stateStore.setLastBlock).not.toHaveBeenCalled();
            expect(stateStore.setLastStoredBlockHeight).not.toHaveBeenCalled();
            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledWith("FAILURE");
        });
    });
});
