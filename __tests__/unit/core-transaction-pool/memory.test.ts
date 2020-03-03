import { Container } from "@arkecosystem/core-kernel";
import { Identities, Interfaces } from "@arkecosystem/crypto";

import { Memory } from "../../../packages/core-transaction-pool/src/memory";

const createSenderState = jest.fn();
const logger = { debug: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolSenderStateFactory).toConstantValue(createSenderState);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);

beforeEach(() => {
    createSenderState.mockClear();
    logger.debug.mockClear();
});

describe("Memory.getSize", () => {
    it("should return sum of transaction counts of sender states", async () => {
        createSenderState
            .mockReturnValueOnce({ addTransaction: jest.fn(), getTransactionsCount: () => 10, isEmpty: () => false })
            .mockReturnValueOnce({ addTransaction: jest.fn(), getTransactionsCount: () => 20, isEmpty: () => false });

        const transaction1 = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const transaction2 = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender2") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction1);
        await memory.addTransaction(transaction2);
        const size = memory.getSize();

        expect(size).toBe(30);
    });
});

describe("Memory.hasSenderState", () => {
    it("should return true if sender's transaction was added previously", async () => {
        createSenderState.mockReturnValueOnce({ addTransaction: jest.fn(), isEmpty: () => false });

        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender's key") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);
        const has = memory.hasSenderState(Identities.PublicKey.fromPassphrase("sender's key"));

        expect(has).toBe(true);
    });

    it("should return false if sender's transaction wasn't added previously", async () => {
        createSenderState.mockReturnValueOnce({ addTransaction: jest.fn(), isEmpty: () => false });

        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender's key") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);
        const has = memory.hasSenderState(Identities.PublicKey.fromPassphrase("not sender's key"));

        expect(has).toBe(false);
    });
});

describe("Memory.getSenderState", () => {
    it("should return sender state if sender's transaction was added previously", async () => {
        const expectedSenderState = { addTransaction: jest.fn(), isEmpty: () => false };
        createSenderState.mockReturnValueOnce(expectedSenderState);

        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender's key") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);
        const senderState = memory.getSenderState(Identities.PublicKey.fromPassphrase("sender's key"));

        expect(senderState).toBe(expectedSenderState);
    });

    it("should throw if sender's transaction wasn't added previously", async () => {
        createSenderState.mockReturnValueOnce({ addTransaction: jest.fn(), isEmpty: () => false });

        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender's key") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);
        const cb = () => memory.getSenderState(Identities.PublicKey.fromPassphrase("not sender's key"));

        expect(cb).toThrow();
    });
});

describe("Memory.getSenderStates", () => {
    it("should return all sender states", async () => {
        const senderState1 = { addTransaction: jest.fn(), isEmpty: () => false };
        const senderState2 = { addTransaction: jest.fn(), isEmpty: () => false };
        createSenderState.mockReturnValueOnce(senderState1).mockReturnValueOnce(senderState2);

        const transaction1 = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const transaction2 = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender2") },
        } as Interfaces.ITransaction;

        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction1);
        await memory.addTransaction(transaction2);
        const senderStates = memory.getSenderStates();

        expect(Array.from(senderStates)).toStrictEqual([senderState1, senderState2]);
    });
});

describe("Memory.addTransaction", () => {
    it("should add transaction to sender state", async () => {
        const senderState = { addTransaction: jest.fn(), isEmpty: () => false };
        createSenderState.mockReturnValueOnce(senderState);

        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);

        expect(senderState.addTransaction).toBeCalledWith(transaction);
        expect(logger.debug).toHaveBeenCalledTimes(1);
    });

    it("should forget sender state if it's empty even if error was thrown", async () => {
        const error = new Error("Something went horribly wrong");
        const senderState = { addTransaction: jest.fn(), isEmpty: () => true };
        senderState.addTransaction.mockRejectedValueOnce(error);
        createSenderState.mockReturnValueOnce(senderState);

        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Memory);
        const promise = memory.addTransaction(transaction);
        await expect(promise).rejects.toThrow(error);
        const has = memory.hasSenderState(transaction.data.senderPublicKey);

        expect(logger.debug).toHaveBeenCalledTimes(2);
        expect(has).toBe(false);
    });
});

describe("Memory.removeTransaction", () => {
    it("should return empty array when removing transaction of sender that wasn't previously added", async () => {
        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Memory);
        const removedTransactions = await memory.removeTransaction(transaction);

        expect(removedTransactions).toStrictEqual([]);
    });

    it("should remove previously added transaction and return list of removed transactions", async () => {
        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const expectedRemovedTransactions = [transaction];
        const senderState = {
            addTransaction: jest.fn(),
            removeTransaction: jest.fn(() => expectedRemovedTransactions),
            isEmpty: () => false,
        };
        createSenderState.mockReturnValueOnce(senderState);

        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);
        const removedTransactions = await memory.removeTransaction(transaction);

        expect(senderState.removeTransaction).toBeCalledWith(transaction);
        expect(removedTransactions).toStrictEqual(expectedRemovedTransactions);
        expect(logger.debug).toHaveBeenCalledTimes(1);
    });

    it("should forget sender state if it's empty even if error was thrown", async () => {
        const error = new Error("Something went horribly wrong");
        const senderState = { addTransaction: jest.fn(), removeTransaction: jest.fn(), isEmpty: jest.fn() };
        senderState.removeTransaction.mockRejectedValueOnce(error);
        senderState.isEmpty.mockReturnValueOnce(false).mockReturnValueOnce(true);
        createSenderState.mockReturnValueOnce(senderState);

        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);
        const promise = memory.removeTransaction(transaction);
        await expect(promise).rejects.toThrow(error);
        const has = memory.hasSenderState(transaction.data.senderPublicKey);

        expect(logger.debug).toHaveBeenCalledTimes(2);
        expect(has).toBe(false);
    });
});

describe("Memory.acceptForgedTransaction", () => {
    it("should return empty array when accepting transaction of sender that wasn't previously added", async () => {
        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Memory);
        const removedTransactions = await memory.acceptForgedTransaction(transaction);

        expect(removedTransactions).toStrictEqual([]);
    });

    it("should accept previously added transaction and return list of removed transactions", async () => {
        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const expectedRemovedTransactions = [transaction];
        const senderState = {
            addTransaction: jest.fn(),
            acceptForgedTransaction: jest.fn(() => expectedRemovedTransactions),
            isEmpty: () => false,
        };
        createSenderState.mockReturnValueOnce(senderState);

        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);
        const removedTransactions = await memory.acceptForgedTransaction(transaction);

        expect(senderState.acceptForgedTransaction).toBeCalledWith(transaction);
        expect(removedTransactions).toStrictEqual(expectedRemovedTransactions);
        expect(logger.debug).toHaveBeenCalledTimes(1);
    });

    it("should forget sender state if it's empty even if error was thrown", async () => {
        const error = new Error("Something went horribly wrong");
        const senderState = { addTransaction: jest.fn(), acceptForgedTransaction: jest.fn(), isEmpty: jest.fn() };
        senderState.acceptForgedTransaction.mockRejectedValueOnce(error);
        senderState.isEmpty.mockReturnValueOnce(false).mockReturnValueOnce(true);
        createSenderState.mockReturnValueOnce(senderState);

        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);
        const promise = memory.acceptForgedTransaction(transaction);
        await expect(promise).rejects.toThrow(error);
        const has = memory.hasSenderState(transaction.data.senderPublicKey);

        expect(logger.debug).toHaveBeenCalledTimes(2);
        expect(has).toBe(false);
    });
});

describe("Memory.flush", () => {
    it("should remove all sender states", async () => {
        const senderState = { addTransaction: jest.fn(), isEmpty: () => false };
        createSenderState.mockReturnValueOnce(senderState);

        const transaction = {
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;
        const memory = container.resolve(Memory);
        await memory.addTransaction(transaction);
        memory.flush();
        const has = memory.hasSenderState(transaction.data.senderPublicKey);

        expect(has).toBe(false);
    });
});
