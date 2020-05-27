import { Container, Contracts } from "@arkecosystem/core-kernel";
import { CryptoSuite } from "@packages/core-crypto";
import { Service } from "@packages/core-transaction-pool/src/service";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

crypto.CryptoManager.HeightTracker.setHeight(2);
crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = true;

const logger = {
    debug: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
};
const configuration = {
    getRequired: jest.fn(),
};
const storage = {
    hasTransaction: jest.fn(),
    addTransaction: jest.fn(),
    removeTransaction: jest.fn(),
    getAllTransactions: jest.fn(),
    flush: jest.fn(),
};
const mempool = {
    getSize: jest.fn(),
    addTransaction: jest.fn(),
    removeTransaction: jest.fn(),
    acceptForgedTransaction: jest.fn(),
    flush: jest.fn(),
};
const poolQuery = {
    getAll: jest.fn(),
    getFromLowestPriority: jest.fn(),
};
const expirationService = {
    isExpired: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.LogService).toConstantValue(logger);
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
container.bind(Container.Identifiers.TransactionPoolStorage).toConstantValue(storage);
container.bind(Container.Identifiers.TransactionPoolMempool).toConstantValue(mempool);
container.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue(poolQuery);
container.bind(Container.Identifiers.TransactionPoolExpirationService).toConstantValue(expirationService);

container.bind(Container.Identifiers.CryptoManager).toConstantValue(crypto.CryptoManager);
container.bind(Container.Identifiers.TransactionManager).toConstantValue(crypto.TransactionManager);
container.bind(Container.Identifiers.BlockFactory).toConstantValue(crypto.BlockFactory);

beforeEach(() => {
    logger.debug.mockReset();
    logger.warning.mockReset();
    logger.error.mockReset();
    configuration.getRequired.mockReset();
    storage.hasTransaction.mockReset();
    storage.addTransaction.mockReset();
    storage.removeTransaction.mockReset();
    storage.getAllTransactions.mockReset();
    storage.flush.mockReset();
    mempool.getSize.mockReset();
    mempool.addTransaction.mockReset();
    mempool.removeTransaction.mockReset();
    mempool.acceptForgedTransaction.mockReset();
    mempool.flush.mockReset();
    poolQuery.getAll.mockReset();
    poolQuery.getFromLowestPriority.mockReset();
});

const transaction1 = crypto.TransactionManager.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .fee("1000")
    .sign("sender's secret")
    .build();
const transaction2 = crypto.TransactionManager.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("2")
    .fee("2000")
    .sign("sender's secret")
    .build();
const transaction3 = crypto.TransactionManager.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("3")
    .fee("3000")
    .sign("sender's secret")
    .build();

describe("Service.boot", () => {
    it("should flush everything when CORE_RESET_DATABASE env is set", async () => {
        process.env["CORE_RESET_DATABASE"] = "1";

        try {
            const service = container.resolve(Service);
            await service.boot();

            expect(mempool.flush).toBeCalled();
            expect(storage.flush).toBeCalled();
        } finally {
            delete process.env["CORE_RESET_DATABASE"];
        }
    });

    it("should readd stored transactions", async () => {
        storage.getAllTransactions.mockReturnValueOnce([transaction1, transaction2]);

        const service = container.resolve(Service);
        await service.boot();

        expect(mempool.flush).toBeCalled();
        expect(mempool.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction2);
    });
});

describe("Service.getPoolSize", () => {
    it("should return value from mempool", () => {
        mempool.getSize.mockReturnValueOnce(100);

        const service = container.resolve(Service);
        const size = service.getPoolSize();

        expect(size).toBe(100);
        expect(mempool.getSize).toBeCalled();
    });
});

describe("Service.addTransaction", () => {
    it("should throw if transaction is already in storage", async () => {
        storage.hasTransaction.mockReturnValueOnce(true);

        const service = container.resolve(Service);
        const promise = service.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_DUPLICATE");
    });

    it("should add transaction to storage and mempool", async () => {
        configuration.getRequired.mockReturnValue(10); // maxTransactionsInPool
        mempool.getSize.mockReturnValue(0);

        const service = container.resolve(Service);
        await service.addTransaction(transaction1);

        expect(storage.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction1);
    });

    it("should remove transaction from storage that failed adding to mempool", async () => {
        configuration.getRequired.mockReturnValue(10); // maxTransactionsInPool
        mempool.getSize.mockReturnValue(0);
        mempool.addTransaction.mockRejectedValueOnce(new Error("Nope"));

        const service = container.resolve(Service);
        const promise = service.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Error);
        expect(storage.addTransaction).toBeCalledWith(transaction1);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
    });

    it("should remove expired transactions when pool is full", async () => {
        configuration.getRequired.mockReturnValue(1); // maxTransactionsInPool
        mempool.getSize.mockReturnValueOnce(1);
        poolQuery.getAll.mockReturnValueOnce([transaction2]);
        expirationService.isExpired.mockReturnValueOnce(true);
        mempool.removeTransaction.mockReturnValueOnce([transaction2]);
        mempool.getSize.mockReturnValueOnce(0);

        const service = container.resolve(Service);
        await service.addTransaction(transaction1);

        expect(expirationService.isExpired).toBeCalledWith(transaction2);
        expect(mempool.removeTransaction).toBeCalledWith(transaction2);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
    });

    it("should throw if fee isn't higher than lowest priority transaction when pool is full", async () => {
        configuration.getRequired.mockReturnValue(1); // maxTransactionsInPool
        mempool.getSize.mockReturnValue(1);
        poolQuery.getAll.mockReturnValueOnce([transaction2]);
        expirationService.isExpired.mockReturnValueOnce(false);
        poolQuery.getFromLowestPriority.mockReturnValueOnce({ first: () => transaction2 });

        const service = container.resolve(Service);
        const promise = service.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_POOL_FULL");
    });

    it("should remove low priority transactions when pool is full", async () => {
        configuration.getRequired.mockReturnValue(1); // maxTransactionsInPool

        mempool.getSize.mockReturnValueOnce(2);
        poolQuery.getAll.mockReturnValueOnce([transaction1, transaction2]);
        expirationService.isExpired.mockReturnValueOnce(false).mockReturnValueOnce(false);

        mempool.getSize.mockReturnValueOnce(2);

        mempool.getSize.mockReturnValueOnce(2);
        poolQuery.getFromLowestPriority.mockReturnValueOnce({ first: () => transaction1 });
        mempool.removeTransaction.mockReturnValueOnce([transaction1]);

        mempool.getSize.mockReturnValueOnce(1);
        poolQuery.getFromLowestPriority.mockReturnValueOnce({ first: () => transaction2 });
        mempool.removeTransaction.mockReturnValueOnce([transaction2]);

        const service = container.resolve(Service);
        await service.addTransaction(transaction3);

        expect(mempool.removeTransaction).toBeCalledWith(transaction1);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);

        expect(mempool.removeTransaction).toBeCalledWith(transaction2);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
    });
});

describe("Service.removeTransaction", () => {
    it("should log error if transaction wasn't added previously", async () => {
        storage.hasTransaction.mockReturnValueOnce(false);

        const service = container.resolve(Service);
        await service.removeTransaction(transaction1);

        expect(logger.error).toBeCalled();
    });

    it("should remove from storage every transaction removed by mempool", async () => {
        storage.hasTransaction.mockReturnValueOnce(true);
        mempool.removeTransaction.mockReturnValueOnce([transaction1, transaction2]);

        const service = container.resolve(Service);
        await service.removeTransaction(transaction1);

        expect(mempool.removeTransaction).toBeCalledWith(transaction1);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
    });

    it("should log error if transaction wasn't found in mempool", async () => {
        storage.hasTransaction.mockReturnValueOnce(true);
        mempool.removeTransaction.mockReturnValueOnce([transaction2]);

        const service = container.resolve(Service);
        await service.removeTransaction(transaction1);

        expect(mempool.removeTransaction).toBeCalledWith(transaction1);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
        expect(logger.error).toBeCalled();
    });
});

describe("Service.acceptForgedTransaction", () => {
    it("should do nothing if transaction wasn't added previously", async () => {
        storage.hasTransaction.mockReturnValueOnce(false);

        const service = container.resolve(Service);
        await service.acceptForgedTransaction(transaction1);

        expect(mempool.acceptForgedTransaction).not.toBeCalled();
    });

    it("should remove from storage every transaction removed by mempool", async () => {
        storage.hasTransaction.mockReturnValueOnce(true);
        mempool.acceptForgedTransaction.mockReturnValueOnce([transaction1, transaction2]);

        const service = container.resolve(Service);
        await service.acceptForgedTransaction(transaction1);

        expect(mempool.acceptForgedTransaction).toBeCalledWith(transaction1);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
    });

    it("should log error if transaction wasn't found in mempool", async () => {
        storage.hasTransaction.mockReturnValueOnce(true);
        mempool.acceptForgedTransaction.mockReturnValueOnce([transaction2]);

        const service = container.resolve(Service);
        await service.acceptForgedTransaction(transaction1);

        expect(mempool.acceptForgedTransaction).toBeCalledWith(transaction1);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
        expect(logger.error).toBeCalled();
    });
});

describe("Service.readdTransactions", () => {
    it("should flush mempool", async () => {
        storage.getAllTransactions.mockReturnValueOnce([]);

        const service = container.resolve(Service);
        await service.readdTransactions();

        expect(mempool.flush).toBeCalled();
    });

    it("should add all transactions from storage", async () => {
        storage.getAllTransactions.mockReturnValueOnce([transaction1, transaction2, transaction3]);

        const service = container.resolve(Service);
        await service.readdTransactions();

        expect(mempool.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction2);
        expect(mempool.addTransaction).toBeCalledWith(transaction3);
    });

    it("should remove transaction from storage that failed adding to mempool", async () => {
        storage.getAllTransactions.mockReturnValueOnce([transaction1]);
        mempool.addTransaction.mockRejectedValueOnce(new Error("Something wrong"));

        const service = container.resolve(Service);
        await service.readdTransactions();

        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
    });

    it("should first add transactions passed in argument", async () => {
        storage.getAllTransactions.mockReturnValueOnce([transaction3]);

        const service = container.resolve(Service);
        await service.readdTransactions([transaction1, transaction2]);

        expect(mempool.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction2);
        expect(mempool.addTransaction).toBeCalledWith(transaction3);
    });

    it("should ignore errors when adding transaction that was passed in argument", async () => {
        storage.getAllTransactions.mockReturnValueOnce([transaction3]);
        mempool.addTransaction.mockRejectedValueOnce(new Error("Something wrong"));

        const service = container.resolve(Service);
        await service.readdTransactions([transaction1, transaction2]);

        expect(mempool.addTransaction).toBeCalledWith(transaction2);
        expect(mempool.addTransaction).toBeCalledWith(transaction3);
    });
});

describe("Service.cleanUp", () => {
    it("should remove expired transactions", async () => {
        poolQuery.getAll.mockReturnValueOnce([transaction2]);
        expirationService.isExpired.mockReturnValueOnce(true);
        mempool.removeTransaction.mockReturnValueOnce([transaction2]);

        const service = container.resolve(Service);
        await service.cleanUp();

        expect(mempool.removeTransaction).toBeCalledWith(transaction2);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
    });

    it("should remove lowest priority transactions", async () => {
        configuration.getRequired.mockReturnValue(1); // maxTransactionsInPool

        mempool.getSize.mockReturnValueOnce(2);
        poolQuery.getAll.mockReturnValueOnce([transaction1, transaction2]);
        expirationService.isExpired.mockReturnValueOnce(false).mockReturnValueOnce(false);

        mempool.getSize.mockReturnValueOnce(2);
        poolQuery.getFromLowestPriority.mockReturnValueOnce({ first: () => transaction1 });
        mempool.removeTransaction.mockReturnValueOnce([transaction1]);

        const service = container.resolve(Service);
        await service.addTransaction(transaction3);

        expect(mempool.removeTransaction).toBeCalledWith(transaction1);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
    });
});
