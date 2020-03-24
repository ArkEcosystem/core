import { Container } from "@arkecosystem/core-kernel";
import { Initialize } from "../../../../../packages/core-blockchain/src/state-machine/actions/initialize";
import { Managers } from "@arkecosystem/crypto";

describe("Initialize", () => {
    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn(), notice: jest.fn(), };
    const blockchain = { dispatch: jest.fn() };
    const stateStore = {
        getLastBlock: jest.fn(),
        setLastBlock: jest.fn(),
        networkStart: undefined
    };
    const transactionPool = { readdTransactions: jest.fn() };
    const databaseService = {
        restoredDatabaseIntegrity: undefined,
        verifyBlockchain: jest.fn(),
        deleteRound: jest.fn(),
        buildWallets: jest.fn(),
        restoreCurrentRound: jest.fn(),
    };
    const peerNetworkMonitor = { boot: jest.fn() };

    const application = { get: () => peerNetworkMonitor };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);
        container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(transactionPool);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("handle", () => {
        describe("when databaseService.restoredDatabaseIntegrity", () => {
            it("should initialize state, database, transaction pool and peer network monitor", async () => {
                const initialize = container.resolve<Initialize>(Initialize);

                const lastBlock = {
                    data: {
                        id: "345",
                        height: 5554
                    }
                };
                stateStore.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
                databaseService.restoredDatabaseIntegrity = true;
                process.env.NODE_ENV = "";
                await initialize.handle();

                expect(stateStore.setLastBlock).toHaveBeenCalledTimes(1);
                expect(databaseService.deleteRound).toHaveBeenCalledTimes(1);
                expect(databaseService.buildWallets).toHaveBeenCalledTimes(1);
                expect(databaseService.restoreCurrentRound).toHaveBeenCalledTimes(1);
                expect(transactionPool.readdTransactions).toHaveBeenCalledTimes(1);
                expect(peerNetworkMonitor.boot).toHaveBeenCalledTimes(1);
                expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
                expect(blockchain.dispatch).toHaveBeenCalledWith("STARTED");
            })
        })

        describe("when !databaseService.restoredDatabaseIntegrity", () => {
            it("should dispatch ROLLBACK when databaseService.verifyBlockchain() returns false", async () => {
                const initialize = container.resolve<Initialize>(Initialize);

                const lastBlock = {
                    data: {
                        id: "345",
                        height: 5554
                    }
                };
                stateStore.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
                databaseService.restoredDatabaseIntegrity = false;
                databaseService.verifyBlockchain = jest.fn().mockReturnValueOnce(false);
                process.env.NODE_ENV = "";
                await initialize.handle();

                expect(blockchain.dispatch).toHaveBeenCalledWith("ROLLBACK");
            })

            it("should dispatch STARTED when databaseService.verifyBlockchain() returns true", async () => {
                const initialize = container.resolve<Initialize>(Initialize);

                const lastBlock = {
                    data: {
                        id: "345",
                        height: 5554
                    }
                };
                stateStore.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
                databaseService.restoredDatabaseIntegrity = false;
                databaseService.verifyBlockchain = jest.fn().mockReturnValueOnce(true);
                process.env.NODE_ENV = "";
                await initialize.handle();

                expect(blockchain.dispatch).toHaveBeenCalledWith("STARTED");
            })
        })

        describe("when block.data.height === 1", () => {
            it("should dispatch FAILURE when block payloadHash is !== network hash", async () => {
                const initialize = container.resolve<Initialize>(Initialize);

                const lastBlock = {
                    data: {
                        id: "345",
                        height: 1,
                        payloadHash: "6d84d08bd299ed97c212c886c98a57e36545c8f5d645ca7eeae63a8bd62d8988"
                    }
                };
                stateStore.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
                databaseService.restoredDatabaseIntegrity = true;
                process.env.NODE_ENV = "";
                await initialize.handle();

                expect(blockchain.dispatch).toHaveBeenCalledWith("FAILURE");
            })

            it("should dispatch STARTED and databaseService.deleteRound(1) when block payloadHash === network hash", async () => {
                const initialize = container.resolve<Initialize>(Initialize);

                const lastBlock = {
                    data: {
                        id: "345",
                        height: 1,
                        payloadHash: Managers.configManager.get("network.nethash")
                    }
                };
                stateStore.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
                databaseService.restoredDatabaseIntegrity = true;
                process.env.NODE_ENV = "";
                await initialize.handle();

                expect(databaseService.deleteRound).toHaveBeenCalledWith(1);
                expect(blockchain.dispatch).toHaveBeenCalledWith("STARTED");
            })
        })

        describe("when stateStore.networkStart", () => {
            it("should dispatch STARTED", async () => {
                const initialize = container.resolve<Initialize>(Initialize);

                const lastBlock = {
                    data: {
                        id: "345",
                        height: 334,
                        payloadHash: Managers.configManager.get("network.nethash")
                    }
                };
                stateStore.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
                stateStore.networkStart = true;
                databaseService.restoredDatabaseIntegrity = true;
                process.env.NODE_ENV = "";
                await initialize.handle();

                expect(blockchain.dispatch).toHaveBeenCalledWith("STARTED");
            })
        })

        describe("when process.env.NODE_ENV === 'test'", () => {
            it("should dispatch STARTED", async () => {
                const initialize = container.resolve<Initialize>(Initialize);

                const lastBlock = {
                    data: {
                        id: "345",
                        height: 334,
                        payloadHash: Managers.configManager.get("network.nethash")
                    }
                };
                stateStore.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
                stateStore.networkStart = false;
                databaseService.restoredDatabaseIntegrity = true;
                process.env.NODE_ENV = "test";
                await initialize.handle();

                expect(stateStore.setLastBlock).toHaveBeenCalledTimes(1);
                expect(databaseService.deleteRound).toHaveBeenCalledTimes(1);
                expect(databaseService.buildWallets).toHaveBeenCalledTimes(1);
                expect(databaseService.restoreCurrentRound).toHaveBeenCalledTimes(0);
                expect(transactionPool.readdTransactions).toHaveBeenCalledTimes(0);
                expect(peerNetworkMonitor.boot).toHaveBeenCalledTimes(1);
                expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
                expect(blockchain.dispatch).toHaveBeenCalledWith("STARTED");
            })
        })

        describe("when something throws an exception", () => {
            it("should dispatch FAILURE", async () => {
                const initialize = container.resolve<Initialize>(Initialize);

                stateStore.getLastBlock = jest.fn().mockImplementationOnce(() => {
                    throw new Error("oops")
                });
                databaseService.restoredDatabaseIntegrity = true;
                process.env.NODE_ENV = "";
                await initialize.handle();

                expect(blockchain.dispatch).toHaveBeenCalledWith("FAILURE");
            })
        })
    })
})