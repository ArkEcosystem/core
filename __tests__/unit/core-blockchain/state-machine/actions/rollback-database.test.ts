import { Container } from "@arkecosystem/core-kernel";
import { RollbackDatabase } from "../../../../../packages/core-blockchain/src/state-machine/actions/rollback-database";

describe("RollbackDatabase", () => {
    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const blockchain = {
        dispatch: jest.fn(),
        removeTopBlocks: jest.fn(),
    };
    const databaseService = {
        restoredDatabaseIntegrity: undefined,
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
            databaseService.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
            databaseService.verifyBlockchain = jest
                .fn()
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValue(true); // returns false 3 times then true
            await rollbackDatabase.handle();

            expect(databaseService.verifyBlockchain).toHaveBeenCalledTimes(5);
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
            databaseService.verifyBlockchain = jest
                .fn()
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValue(true); // returns false 6 times then true
            await rollbackDatabase.handle();

            expect(databaseService.verifyBlockchain).toHaveBeenCalledTimes(6);
            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledWith("FAILURE");
        });
    });
});
