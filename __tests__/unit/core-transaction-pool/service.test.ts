import { Container, Contracts, Enums } from "@arkecosystem/core-kernel";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";

import { Service } from "../../../packages/core-transaction-pool/src/service";

const configuration = {
    getRequired: jest.fn(),
};
const stateStore = {
    getLastHeight: jest.fn(),
};
const dynamicFeeMatcher = {
    throwIfCannotEnterPool: jest.fn(),
};
const storage = {
    hasTransaction: jest.fn(),
    addTransaction: jest.fn(),
    removeTransaction: jest.fn(),
    getAllTransactions: jest.fn(),
    getOldTransactions: jest.fn(),
    flush: jest.fn(),
};
const mempool = {
    getSize: jest.fn(),
    addTransaction: jest.fn(),
    removeTransaction: jest.fn(),
    removeForgedTransaction: jest.fn(),
    flush: jest.fn(),
};
const poolQuery = {
    getAll: jest.fn(),
    getFromLowestPriority: jest.fn(),
};
const expirationService = {
    isExpired: jest.fn(),
};
const events = {
    listen: jest.fn(),
    forget: jest.fn(),
    dispatch: jest.fn(),
};
const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
container.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).toConstantValue(dynamicFeeMatcher);
container.bind(Container.Identifiers.TransactionPoolStorage).toConstantValue(storage);
container.bind(Container.Identifiers.TransactionPoolMempool).toConstantValue(mempool);
container.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue(poolQuery);
container.bind(Container.Identifiers.TransactionPoolExpirationService).toConstantValue(expirationService);
container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(events);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);

beforeEach(() => {
    jest.resetAllMocks();
});

Managers.configManager.getMilestone().aip11 = true;
const transaction1 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .fee("1000")
    .sign("sender's secret")
    .build();
const transaction2 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("2")
    .fee("2000")
    .sign("sender's secret")
    .build();
const transaction3 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("3")
    .fee("3000")
    .sign("sender's secret")
    .build();

describe("Service.boot", () => {
    it("should flush everything when CORE_RESET_DATABASE env is set", async () => {
        process.env["CORE_RESET_DATABASE"] = "1";

        try {
            const service = container.resolve(Service);
            jest.spyOn(service, "flush").mockImplementation(() => Promise.resolve());
            await service.boot();

            expect(service.flush).toBeCalled();
        } finally {
            delete process.env["CORE_RESET_DATABASE"];
        }
    });

    it("should subscribe to events", async () => {
        const service = container.resolve(Service);
        await service.boot();

        expect(events.listen).toBeCalledWith(Enums.StateEvent.BuilderFinished, service);
        expect(events.listen).toBeCalledWith(Enums.CryptoEvent.MilestoneChanged, service);
        expect(events.listen).toBeCalledWith(Enums.BlockEvent.Applied, service);
    });
});

describe("Service.dispose", () => {
    it("should unsubscribe from crypto and state events", () => {
        const service = container.resolve(Service);
        service.dispose();

        expect(events.forget).toBeCalledWith(Enums.StateEvent.BuilderFinished, service);
        expect(events.forget).toBeCalledWith(Enums.CryptoEvent.MilestoneChanged, service);
        expect(events.forget).toBeCalledWith(Enums.BlockEvent.Applied, service);
    });
});

describe("Service.handle", () => {
    it("should re-add transactions after state builder had finished", async () => {
        const service = container.resolve(Service);
        jest.spyOn(service, "readdTransactions").mockImplementation(() => Promise.resolve());

        await service.handle({ name: Enums.StateEvent.BuilderFinished });

        expect(service.readdTransactions).toBeCalled();
    });

    it("should re-add transactions after milestone had changed", async () => {
        const service = container.resolve(Service);
        jest.spyOn(service, "readdTransactions").mockImplementation(() => Promise.resolve());

        await service.handle({ name: Enums.CryptoEvent.MilestoneChanged });

        expect(service.readdTransactions).toBeCalled();
    });

    it("should cleanup transactions after block is applied", async () => {
        const service = container.resolve(Service);
        jest.spyOn(service, "cleanUp").mockImplementation(() => Promise.resolve());

        await service.handle({ name: Enums.BlockEvent.Applied });

        expect(service.cleanUp).toBeCalled();
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
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);
        configuration.getRequired.mockReturnValue(10); // maxTransactionsInPool
        mempool.getSize.mockReturnValue(0);

        const service = container.resolve(Service);
        await service.addTransaction(transaction1);

        expect(storage.addTransaction).toBeCalledWith({
            height,
            id: transaction1.id,
            senderPublicKey: transaction1.data.senderPublicKey,
            serialized: transaction1.serialized,
        });
        expect(mempool.addTransaction).toBeCalledWith(transaction1);

        expect(events.dispatch).toHaveBeenCalledTimes(1);
        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.AddedToPool, expect.anything());
    });

    it("should remove transaction from storage that failed dynamic fee check", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);
        configuration.getRequired.mockReturnValue(10); // maxTransactionsInPool
        mempool.getSize.mockReturnValue(0);
        dynamicFeeMatcher.throwIfCannotEnterPool.mockRejectedValueOnce(new Error("Nope"));

        const service = container.resolve(Service);
        const promise = service.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Error);

        expect(storage.addTransaction).toBeCalledWith({
            height,
            id: transaction1.id,
            senderPublicKey: transaction1.data.senderPublicKey,
            serialized: transaction1.serialized,
        });
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);

        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.RejectedByPool, expect.anything());
    });

    it("should remove transaction from storage that failed adding to mempool", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);
        configuration.getRequired.mockReturnValue(10); // maxTransactionsInPool
        mempool.getSize.mockReturnValue(0);
        mempool.addTransaction.mockRejectedValueOnce(new Error("Nope"));

        const service = container.resolve(Service);
        const promise = service.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Error);

        expect(storage.addTransaction).toBeCalledWith({
            height,
            id: transaction1.id,
            senderPublicKey: transaction1.data.senderPublicKey,
            serialized: transaction1.serialized,
        });
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);

        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.RejectedByPool, expect.anything());
    });

    it("should remove old transactions when pool is full", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);
        configuration.getRequired.mockReturnValueOnce(1); // maxTransactionsInPool
        configuration.getRequired.mockReturnValueOnce(100); // maxTransactionAge
        mempool.getSize.mockReturnValueOnce(1);
        storage.getOldTransactions.mockReturnValueOnce([
            { senderPublicKey: transaction2.data.senderPublicKey, id: transaction2.id },
        ]);
        poolQuery.getAll.mockReturnValueOnce([]);
        mempool.removeTransaction.mockReturnValueOnce([transaction2]);
        mempool.getSize.mockReturnValueOnce(0);

        const service = container.resolve(Service);
        await service.addTransaction(transaction1);

        expect(storage.getOldTransactions).toBeCalledWith(900);
        expect(mempool.removeTransaction).toBeCalledWith(transaction2.data.senderPublicKey, transaction2.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);

        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.Expired, expect.anything());
    });

    it("should remove expired transactions when pool is full", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);
        configuration.getRequired.mockReturnValue(1); // maxTransactionsInPool
        mempool.getSize.mockReturnValueOnce(1);
        storage.getOldTransactions.mockReturnValueOnce([]);
        poolQuery.getAll.mockReturnValueOnce([transaction2]);
        expirationService.isExpired.mockReturnValueOnce(true);
        mempool.removeTransaction.mockReturnValueOnce([transaction2]);
        mempool.getSize.mockReturnValueOnce(0);

        const service = container.resolve(Service);
        await service.addTransaction(transaction1);

        expect(expirationService.isExpired).toBeCalledWith(transaction2);
        expect(mempool.removeTransaction).toBeCalledWith(transaction2.data.senderPublicKey, transaction2.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);

        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.Expired, expect.anything());
    });

    it("should throw if fee isn't higher than lowest priority transaction when pool is full", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);
        configuration.getRequired.mockReturnValue(1); // maxTransactionsInPool
        mempool.getSize.mockReturnValue(1);
        storage.getOldTransactions.mockReturnValue([]);
        poolQuery.getAll.mockReturnValueOnce([transaction2]);
        expirationService.isExpired.mockReturnValueOnce(false);
        poolQuery.getFromLowestPriority.mockReturnValueOnce({ first: () => transaction2 });

        const service = container.resolve(Service);
        const promise = service.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_POOL_FULL");

        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.RejectedByPool, expect.anything());
    });

    it("should remove low priority transactions when pool is full", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 1;
            throw new Error("Unreachable");
        });

        mempool.getSize.mockReturnValueOnce(2);
        storage.getOldTransactions.mockReturnValueOnce([]);
        poolQuery.getAll.mockReturnValueOnce([transaction1, transaction2]);
        expirationService.isExpired.mockReturnValueOnce(false).mockReturnValueOnce(false);

        mempool.getSize.mockReturnValueOnce(2);

        mempool.getSize.mockReturnValueOnce(2);
        poolQuery.getFromLowestPriority.mockReturnValueOnce({ first: () => transaction1 });
        mempool.removeTransaction.mockReturnValueOnce([transaction1]);

        const service = container.resolve(Service);
        await service.addTransaction(transaction3);

        expect(mempool.removeTransaction).toBeCalledWith(transaction1.data.senderPublicKey, transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);

        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.RemovedFromPool, expect.anything());
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

        expect(mempool.removeTransaction).toBeCalledWith(transaction1.data.senderPublicKey, transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);

        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.RemovedFromPool, expect.anything());
    });

    it("should log error if transaction wasn't found in mempool", async () => {
        storage.hasTransaction.mockReturnValueOnce(true);
        mempool.removeTransaction.mockReturnValueOnce([transaction2]);

        const service = container.resolve(Service);
        await service.removeTransaction(transaction1);

        expect(mempool.removeTransaction).toBeCalledWith(transaction1.data.senderPublicKey, transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
        expect(logger.error).toBeCalled();
    });
});

describe("Service.removeForgedTransaction", () => {
    it("should do nothing if transaction wasn't added previously", async () => {
        storage.hasTransaction.mockReturnValueOnce(false);

        const service = container.resolve(Service);
        await service.removeForgedTransaction(transaction1);

        expect(mempool.removeForgedTransaction).not.toBeCalled();
    });

    it("should remove from storage every transaction removed by mempool", async () => {
        storage.hasTransaction.mockReturnValueOnce(true);
        mempool.removeForgedTransaction.mockReturnValueOnce([transaction1, transaction2]);

        const service = container.resolve(Service);
        await service.removeForgedTransaction(transaction1);

        expect(mempool.removeForgedTransaction).toBeCalledWith(transaction1.data.senderPublicKey, transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
    });

    it("should log error if transaction wasn't found in mempool", async () => {
        storage.hasTransaction.mockReturnValueOnce(true);
        mempool.removeForgedTransaction.mockReturnValueOnce([transaction2]);

        const service = container.resolve(Service);
        await service.removeForgedTransaction(transaction1);

        expect(mempool.removeForgedTransaction).toBeCalledWith(transaction1.data.senderPublicKey, transaction1.id);
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
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 100;
            throw new Error("Unreachable");
        });

        storage.getAllTransactions.mockReturnValueOnce([
            { height: 1000, id: transaction1.id, serialized: transaction1.serialized },
            { height: 1000, id: transaction2.id, serialized: transaction2.serialized },
            { height: 1000, id: transaction3.id, serialized: transaction3.serialized },
        ]);

        const service = container.resolve(Service);
        await service.readdTransactions();

        expect(mempool.addTransaction).toBeCalledTimes(3);
        expect(mempool.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction2);
        expect(mempool.addTransaction).toBeCalledWith(transaction3);

        expect(storage.removeTransaction).toBeCalledTimes(0);
    });

    it("should remove transaction from storage that cannot be added to mempool", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 100;
            throw new Error("Unreachable");
        });

        storage.getAllTransactions.mockReturnValueOnce([
            { height: 1000, id: transaction1.id, serialized: transaction1.serialized },
        ]);
        mempool.addTransaction.mockRejectedValueOnce(new Error("Something wrong"));

        const service = container.resolve(Service);
        await service.readdTransactions();

        expect(mempool.addTransaction).toBeCalledTimes(1);
        expect(mempool.addTransaction).toBeCalledWith(transaction1);

        expect(storage.removeTransaction).toBeCalledTimes(1);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
    });

    it("should remove all transactions from storage that cannot be added to mempool", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 100;
            throw new Error("Unreachable");
        });

        storage.getAllTransactions.mockReturnValueOnce([
            { height: 1000, id: transaction1.id, serialized: transaction1.serialized },
            { height: 1000, id: transaction2.id, serialized: transaction2.serialized },
        ]);

        mempool.addTransaction.mockRejectedValueOnce(new Error("Something wrong"));
        mempool.addTransaction.mockRejectedValueOnce(new Error("Something wrong"));

        const service = container.resolve(Service);
        await service.readdTransactions();

        expect(mempool.addTransaction).toBeCalledTimes(2);
        expect(mempool.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction2);

        expect(storage.removeTransaction).toBeCalledTimes(2);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);
    });

    it("should add previously forged transactions first", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 100;
            throw new Error("Unreachable");
        });

        storage.getAllTransactions.mockReturnValueOnce([
            { height: 1000, id: transaction3.id, serialized: transaction3.serialized },
        ]);

        const service = container.resolve(Service);
        await service.readdTransactions([transaction1, transaction2]);

        expect(mempool.addTransaction).toBeCalledTimes(3);
        expect(mempool.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction2);
        expect(mempool.addTransaction).toBeCalledWith(transaction3);

        expect(storage.addTransaction).toBeCalledTimes(2);
        expect(storage.addTransaction).toBeCalledWith({
            height,
            id: transaction1.id,
            senderPublicKey: transaction1.data.senderPublicKey,
            serialized: transaction1.serialized,
        });
        expect(storage.addTransaction).toBeCalledWith({
            height,
            id: transaction2.id,
            senderPublicKey: transaction2.data.senderPublicKey,
            serialized: transaction2.serialized,
        });

        expect(storage.removeTransaction).toBeCalledTimes(0);
    });

    it("should ignore error when adding previously forged transactions", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 100;
            throw new Error("Unreachable");
        });

        storage.getAllTransactions.mockReturnValueOnce([
            { height: 1000, id: transaction3.id, serialized: transaction3.serialized },
        ]);
        mempool.addTransaction.mockRejectedValueOnce(new Error("Something wrong"));

        const service = container.resolve(Service);
        await service.readdTransactions([transaction1, transaction2]);

        expect(mempool.addTransaction).toBeCalledTimes(3);
        expect(mempool.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction2);
        expect(mempool.addTransaction).toBeCalledWith(transaction3);

        expect(storage.addTransaction).toBeCalledTimes(1);
        expect(storage.addTransaction).toBeCalledWith({
            height,
            id: transaction2.id,
            senderPublicKey: transaction2.data.senderPublicKey,
            serialized: transaction2.serialized,
        });

        expect(storage.removeTransaction).toBeCalledTimes(0);
    });

    it("should ignore all errors when adding previously forged", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 100;
            throw new Error("Unreachable");
        });

        storage.getAllTransactions.mockReturnValueOnce([
            { height: 1000, id: transaction3.id, serialized: transaction3.serialized },
        ]);
        mempool.addTransaction.mockRejectedValueOnce(new Error("Something wrong"));
        mempool.addTransaction.mockRejectedValueOnce(new Error("Something wrong"));

        const service = container.resolve(Service);
        await service.readdTransactions([transaction1, transaction2]);

        expect(mempool.addTransaction).toBeCalledTimes(3);
        expect(mempool.addTransaction).toBeCalledWith(transaction1);
        expect(mempool.addTransaction).toBeCalledWith(transaction2);
        expect(mempool.addTransaction).toBeCalledWith(transaction3);

        expect(storage.addTransaction).toBeCalledTimes(0);

        expect(storage.removeTransaction).toBeCalledTimes(0);
    });
});

describe("Service.cleanUp", () => {
    it("should remove old transactions", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 100;
            throw new Error("Unreachable");
        });

        storage.getOldTransactions.mockReturnValue([
            { height: 900, senderPublicKey: transaction3.data.senderPublicKey, id: transaction3.id },
        ]);
        mempool.removeTransaction.mockReturnValueOnce([transaction3]);
        poolQuery.getAll.mockReturnValueOnce([]);

        const service = container.resolve(Service);
        await service.cleanUp();

        expect(mempool.removeTransaction).toBeCalledWith(transaction3.data.senderPublicKey, transaction3.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction3.id);

        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.Expired, expect.anything());
    });

    it("should remove expired transactions", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 100;
            throw new Error("Unreachable");
        });

        storage.getOldTransactions.mockReturnValue([]);
        poolQuery.getAll.mockReturnValueOnce([transaction2]);
        expirationService.isExpired.mockReturnValueOnce(true);
        mempool.removeTransaction.mockReturnValueOnce([transaction2]);

        const service = container.resolve(Service);
        await service.cleanUp();

        expect(mempool.removeTransaction).toBeCalledWith(transaction2.data.senderPublicKey, transaction2.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction2.id);

        expect(events.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.Expired, expect.anything());
    });

    it("should remove lowest priority transactions", async () => {
        const height = 1000;
        stateStore.getLastHeight.mockReturnValue(height);

        configuration.getRequired.mockImplementation((key) => {
            if (key === "maxTransactionAge") return 100;
            if (key === "maxTransactionsInPool") return 1;
            throw new Error("Unreachable");
        });

        mempool.getSize.mockReturnValueOnce(2);
        storage.getOldTransactions.mockReturnValue([]);
        poolQuery.getAll.mockReturnValueOnce([transaction1, transaction2]);
        expirationService.isExpired.mockReturnValueOnce(false).mockReturnValueOnce(false);

        mempool.getSize.mockReturnValueOnce(2);
        poolQuery.getFromLowestPriority.mockReturnValueOnce({ first: () => transaction1 });
        mempool.removeTransaction.mockReturnValueOnce([transaction1]);

        const service = container.resolve(Service);
        await service.addTransaction(transaction3);

        expect(mempool.removeTransaction).toBeCalledWith(transaction1.data.senderPublicKey, transaction1.id);
        expect(storage.removeTransaction).toBeCalledWith(transaction1.id);
    });
});
