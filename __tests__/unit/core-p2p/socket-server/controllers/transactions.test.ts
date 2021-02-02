import { Container } from "@arkecosystem/core-kernel";
import { TransactionsController } from "@arkecosystem/core-p2p/src/socket-server/controllers/transactions";
import { Managers, Networks } from "@arkecosystem/crypto";

Managers.configManager.getMilestone().aip11 = true; // for creating aip11 v2 transactions

describe("TransactionsController", () => {
    let transactionsController: TransactionsController;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const peerRepository = { getPeers: jest.fn() };
    const database = { getCommonBlocks: jest.fn(), getBlocksForDownload: jest.fn() };
    const blockchain = {
        getLastBlock: jest.fn(),
        handleIncomingBlock: jest.fn(),
        pingBlock: jest.fn(),
        getLastDownloadedBlock: jest.fn(),
    };
    const processor = {
        process: jest.fn().mockReturnValue({ accept: [] }),
    };
    const createProcessor = jest.fn();
    const appPlugins = [{ package: "@arkecosystem/core-api", options: {} }];
    const coreApiServiceProvider = {
        name: () => "core-api",
        configDefaults: () => ({
            server: { http: { port: 4003 } },
        }),
    };
    const serviceProviders = { "@arkecosystem/core-api": coreApiServiceProvider };
    const configRepository = { get: () => appPlugins }; // get("app.plugins")
    const serviceProviderRepository = { get: (plugin) => serviceProviders[plugin] };
    const appGet = {
        [Container.Identifiers.BlockchainService]: blockchain,
        [Container.Identifiers.TransactionPoolProcessorFactory]: createProcessor,
        [Container.Identifiers.ConfigRepository]: configRepository,
        [Container.Identifiers.ServiceProviderRepository]: serviceProviderRepository,
    };
    const config = { getOptional: jest.fn().mockReturnValue(["127.0.0.1"]) }; // remoteAccess
    const app = {
        get: (key) => appGet[key],
        getTagged: () => config,
        version: () => "3.0.9",
        resolve: () => ({
            from: () => ({
                merge: () => ({
                    all: () => ({
                        server: { http: { port: "4003" } },
                        options: {
                            estimateTotalCount: true,
                        },
                    }),
                }),
            }),
        }),
    };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerRepository).toConstantValue(peerRepository);
        container.bind(Container.Identifiers.DatabaseService).toConstantValue(database);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
        container.bind(Container.Identifiers.TransactionPoolProcessor).toConstantValue(processor);
    });

    beforeEach(() => {
        transactionsController = container.resolve<TransactionsController>(TransactionsController);
    });

    describe("postTransactions", () => {
        it("should create transaction processor and use it to process the transactions", async () => {
            const transactions = Networks.testnet.genesisBlock.transactions;
            processor.process.mockReturnValueOnce({ accept: [transactions[0].id] });

            expect(await transactionsController.postTransactions({ payload: { transactions } }, {})).toEqual([
                transactions[0].id,
            ]);

            expect(processor.process).toBeCalledTimes(1);
            expect(processor.process).toBeCalledWith(transactions);
        });
    });
});
