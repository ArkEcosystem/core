import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";

import { Service } from "../../../packages/core-transaction-pool/src/service";

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

Managers.configManager.getMilestone().aip11 = true;
const transaction1 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .fee("900")
    .sign("sender's secret")
    .build();
const transaction2 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("2")
    .fee("900")
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
        const service = container.resolve(Service);
        await service.addTransaction(transaction1);

        expect(storage.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction1);
    });
});
