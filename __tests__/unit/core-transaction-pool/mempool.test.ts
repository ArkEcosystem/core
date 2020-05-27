import { Container } from "@arkecosystem/core-kernel";
import { CryptoSuite } from "@packages/core-crypto";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import { Interfaces } from "@packages/crypto";

const createSenderMempool = jest.fn();
const logger = { debug: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolSenderMempoolFactory).toConstantValue(createSenderMempool);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);
const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

container.bind(Container.Identifiers.CryptoManager).toConstantValue(crypto.CryptoManager);
container.bind(Container.Identifiers.TransactionManager).toConstantValue(crypto.TransactionManager);
container.bind(Container.Identifiers.BlockFactory).toConstantValue(crypto.BlockFactory);

beforeEach(() => {
    createSenderMempool.mockReset();
    logger.debug.mockReset();
});

describe("Mempool.getSize", () => {
    it("should return sum of transaction counts of sender states", async () => {
        createSenderMempool
            .mockReturnValueOnce({ addTransaction: jest.fn(), getSize: () => 10, isEmpty: () => false })
            .mockReturnValueOnce({ addTransaction: jest.fn(), getSize: () => 20, isEmpty: () => false });

        const transaction1 = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const transaction2 = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender2") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction1);
        await memory.addTransaction(transaction2);
        const size = memory.getSize();

        expect(size).toBe(30);
    });
});

describe("Mempool.hasSenderMempool", () => {
    it("should return true if sender's transaction was added previously", async () => {
        createSenderMempool.mockReturnValueOnce({ addTransaction: jest.fn(), isEmpty: () => false });

        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender's key") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);
        const has = memory.hasSenderMempool(crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender's key"));

        expect(has).toBe(true);
    });

    it("should return false if sender's transaction wasn't added previously", async () => {
        createSenderMempool.mockReturnValueOnce({ addTransaction: jest.fn(), isEmpty: () => false });

        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender's key") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);
        const has = memory.hasSenderMempool(
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase("not sender's key"),
        );

        expect(has).toBe(false);
    });
});

describe("Mempool.getSenderMempool", () => {
    it("should return sender state if sender's transaction was added previously", async () => {
        const expectedSenderMempool = { addTransaction: jest.fn(), isEmpty: () => false };
        createSenderMempool.mockReturnValueOnce(expectedSenderMempool);

        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender's key") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);
        const SenderMempool = memory.getSenderMempool(
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender's key"),
        );

        expect(SenderMempool).toBe(expectedSenderMempool);
    });

    it("should throw if sender's transaction wasn't added previously", async () => {
        createSenderMempool.mockReturnValueOnce({ addTransaction: jest.fn(), isEmpty: () => false });

        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender's key") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);
        const cb = () =>
            memory.getSenderMempool(crypto.CryptoManager.Identities.PublicKey.fromPassphrase("not sender's key"));

        expect(cb).toThrow();
    });
});

describe("Mempool.getSenderMempools", () => {
    it("should return all sender states", async () => {
        const SenderMempool1 = { addTransaction: jest.fn(), isEmpty: () => false };
        const SenderMempool2 = { addTransaction: jest.fn(), isEmpty: () => false };
        createSenderMempool.mockReturnValueOnce(SenderMempool1).mockReturnValueOnce(SenderMempool2);

        const transaction1 = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const transaction2 = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender2") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction1);
        await memory.addTransaction(transaction2);
        const SenderMempools = memory.getSenderMempools();

        expect(Array.from(SenderMempools)).toStrictEqual([SenderMempool1, SenderMempool2]);
    });
});

describe("Mempool.addTransaction", () => {
    it("should add transaction to sender state", async () => {
        const SenderMempool = { addTransaction: jest.fn(), isEmpty: () => false };
        createSenderMempool.mockReturnValueOnce(SenderMempool);

        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);

        expect(SenderMempool.addTransaction).toBeCalledWith(transaction);
        expect(logger.debug).toHaveBeenCalledTimes(1);
    });

    it("should forget sender state if it's empty even if error was thrown", async () => {
        const error = new Error("Something went horribly wrong");
        const SenderMempool = { addTransaction: jest.fn(), isEmpty: () => true };
        SenderMempool.addTransaction.mockRejectedValueOnce(error);
        createSenderMempool.mockReturnValueOnce(SenderMempool);

        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Mempool);
        const promise = memory.addTransaction(transaction);
        await expect(promise).rejects.toThrow(error);
        const has = memory.hasSenderMempool(transaction.data.senderPublicKey);

        expect(logger.debug).toHaveBeenCalledTimes(2);
        expect(has).toBe(false);
    });
});

describe("Mempool.removeTransaction", () => {
    it("should return empty array when removing transaction of sender that wasn't previously added", async () => {
        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Mempool);
        const removedTransactions = await memory.removeTransaction(transaction);

        expect(removedTransactions).toStrictEqual([]);
    });

    it("should remove previously added transaction and return list of removed transactions", async () => {
        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const expectedRemovedTransactions = [transaction];
        const SenderMempool = {
            addTransaction: jest.fn(),
            removeTransaction: jest.fn(() => expectedRemovedTransactions),
            isEmpty: () => false,
        };
        createSenderMempool.mockReturnValueOnce(SenderMempool);

        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);
        const removedTransactions = await memory.removeTransaction(transaction);

        expect(SenderMempool.removeTransaction).toBeCalledWith(transaction);
        expect(removedTransactions).toStrictEqual(expectedRemovedTransactions);
        expect(logger.debug).toHaveBeenCalledTimes(1);
    });

    it("should forget sender state if it's empty even if error was thrown", async () => {
        const error = new Error("Something went horribly wrong");
        const SenderMempool = { addTransaction: jest.fn(), removeTransaction: jest.fn(), isEmpty: jest.fn() };
        SenderMempool.removeTransaction.mockRejectedValueOnce(error);
        SenderMempool.isEmpty.mockReturnValueOnce(false).mockReturnValueOnce(true);
        createSenderMempool.mockReturnValueOnce(SenderMempool);

        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);
        const promise = memory.removeTransaction(transaction);
        await expect(promise).rejects.toThrow(error);
        const has = memory.hasSenderMempool(transaction.data.senderPublicKey);

        expect(logger.debug).toHaveBeenCalledTimes(2);
        expect(has).toBe(false);
    });
});

describe("Mempool.acceptForgedTransaction", () => {
    it("should return empty array when accepting transaction of sender that wasn't previously added", async () => {
        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Mempool);
        const removedTransactions = await memory.acceptForgedTransaction(transaction);

        expect(removedTransactions).toStrictEqual([]);
    });

    it("should accept previously added transaction and return list of removed transactions", async () => {
        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const expectedRemovedTransactions = [transaction];
        const SenderMempool = {
            addTransaction: jest.fn(),
            acceptForgedTransaction: jest.fn(() => expectedRemovedTransactions),
            isEmpty: () => false,
        };
        createSenderMempool.mockReturnValueOnce(SenderMempool);

        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);
        const removedTransactions = await memory.acceptForgedTransaction(transaction);

        expect(SenderMempool.acceptForgedTransaction).toBeCalledWith(transaction);
        expect(removedTransactions).toStrictEqual(expectedRemovedTransactions);
        expect(logger.debug).toHaveBeenCalledTimes(1);
    });

    it("should forget sender state if it's empty even if error was thrown", async () => {
        const error = new Error("Something went horribly wrong");
        const SenderMempool = { addTransaction: jest.fn(), acceptForgedTransaction: jest.fn(), isEmpty: jest.fn() };
        SenderMempool.acceptForgedTransaction.mockRejectedValueOnce(error);
        SenderMempool.isEmpty.mockReturnValueOnce(false).mockReturnValueOnce(true);
        createSenderMempool.mockReturnValueOnce(SenderMempool);

        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);
        const promise = memory.acceptForgedTransaction(transaction);
        await expect(promise).rejects.toThrow(error);
        const has = memory.hasSenderMempool(transaction.data.senderPublicKey);

        expect(logger.debug).toHaveBeenCalledTimes(2);
        expect(has).toBe(false);
    });
});

describe("Mempool.flush", () => {
    it("should remove all sender states", async () => {
        const SenderMempool = { addTransaction: jest.fn(), isEmpty: () => false };
        createSenderMempool.mockReturnValueOnce(SenderMempool);

        const transaction = {
            data: { senderPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Mempool);
        await memory.addTransaction(transaction);
        memory.flush();
        const has = memory.hasSenderMempool(transaction.data.senderPublicKey);

        expect(has).toBe(false);
    });
});
