import { Application, Container } from "@packages/core-kernel";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import { Identities, Interfaces } from "@packages/crypto";

const createSenderMempool = jest.fn();
const logger = { debug: jest.fn() };
const mempoolIndexRegistry = { clear: jest.fn() };
const handlerRegistry = {
    getActivatedHandlerForData: jest.fn(),
};

const app = new Application(new Container.Container());
app.bind(Container.Identifiers.TransactionPoolSenderMempoolFactory).toConstantValue(createSenderMempool);
app.bind(Container.Identifiers.TransactionPoolMempoolIndexRegistry).toConstantValue(mempoolIndexRegistry);
app.bind(Container.Identifiers.LogService).toConstantValue(logger);
app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(handlerRegistry);

beforeEach(() => {
    createSenderMempool.mockReset();
    logger.debug.mockReset();
});

describe("Mempool.getSize", () => {
    it("should return sum of transaction counts of sender states", async () => {
        const senderMempool1 = {
            addTransaction: jest.fn(),
            getSize: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool1.getSize.mockReturnValue(10);
        senderMempool1.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool1);

        const senderMempool2 = {
            addTransaction: jest.fn(),
            getSize: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool2.getSize.mockReturnValue(20);
        senderMempool2.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool2);

        const transaction1 = {
            id: "transaction1-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const transaction2 = {
            id: "transaction2-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender2") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction1);
        await memory.addTransaction(transaction2);
        const size = memory.getSize();

        expect(size).toBe(30);
    });
});

describe("Mempool.hasSenderMempool", () => {
    it("should return true if sender's transaction was added previously", async () => {
        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction);
        const has = memory.hasSenderMempool(transaction.data.senderPublicKey);

        expect(has).toBe(true);
    });

    it("should return false if sender's transaction wasn't added previously", async () => {
        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction);
        const has = memory.hasSenderMempool(Identities.PublicKey.fromPassphrase("not sender"));

        expect(has).toBe(false);
    });
});

describe("Mempool.getSenderMempool", () => {
    it("should return sender state if sender's transaction was added previously", async () => {
        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction);

        expect(memory.getSenderMempool(transaction.data.senderPublicKey)).toBe(senderMempool);
    });

    it("should throw if sender's transaction wasn't added previously", async () => {
        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction);
        const cb = () => memory.getSenderMempool(Identities.PublicKey.fromPassphrase("not sender"));

        expect(cb).toThrow();
    });
});

describe("Mempool.getSenderMempools", () => {
    it("should return all sender states", async () => {
        const senderMempool1 = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool1.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool1);

        const senderMempool2 = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool2.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool2);

        const transaction1 = {
            id: "transaction1-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const transaction2 = {
            id: "transaction2-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender2") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction1);
        await memory.addTransaction(transaction2);
        const senderMempools = memory.getSenderMempools();

        expect(Array.from(senderMempools)).toEqual([senderMempool1, senderMempool2]);
    });
});

describe("Mempool.addTransaction", () => {
    it("should add transaction to sender state", async () => {
        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction);

        expect(senderMempool.addTransaction).toBeCalledWith(transaction);
        expect(logger.debug).toHaveBeenCalledTimes(1);
    });

    it("should forget sender state if it's empty even if error was thrown", async () => {
        const error = new Error("Something went horribly wrong");

        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool.addTransaction.mockRejectedValueOnce(error);
        senderMempool.isDisposable.mockReturnValue(true);
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
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
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
        const removedTransactions = await memory.removeTransaction(transaction.data.senderPublicKey, transaction.id);

        expect(removedTransactions).toStrictEqual([]);
    });

    it("should remove previously added transaction and return list of removed transactions", async () => {
        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const senderMempool = {
            addTransaction: jest.fn(),
            removeTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool.removeTransaction.mockReturnValue([transaction]);
        senderMempool.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction);
        const removedTransactions = await memory.removeTransaction(transaction.data.senderPublicKey, transaction.id);

        expect(senderMempool.removeTransaction).toBeCalledWith(transaction.id);
        expect(removedTransactions).toEqual([transaction]);
        expect(logger.debug).toHaveBeenCalledTimes(1);
    });

    it("should forget sender state if it's empty even if error was thrown", async () => {
        const error = new Error("Something went horribly wrong");
        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const senderMempool = {
            addTransaction: jest.fn(),
            removeTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool.removeTransaction.mockRejectedValueOnce(error);
        senderMempool.isDisposable.mockReturnValueOnce(false).mockReturnValueOnce(true);
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction);
        const promise = memory.removeTransaction(transaction.data.senderPublicKey, transaction.id);
        await expect(promise).rejects.toThrow(error);
        const has = memory.hasSenderMempool(transaction.data.senderPublicKey);

        expect(logger.debug).toHaveBeenCalledTimes(2);
        expect(has).toBe(false);
    });
});

describe("applyBlock", () => {
    it("should return empty list when block doesn't contains transactions", async () => {
        const block = {
            transactions: [],
        } as Interfaces.IBlock;

        const mempool = app.resolve(Mempool);

        await expect(mempool.applyBlock(block)).resolves.toEqual([]);
    });

    it("should return empty list when block contains transactions that are not in pool", async () => {
        const handler = {
            onPoolLeave: jest.fn(),
            getInvalidPoolTransactions: jest.fn().mockResolvedValue([]),
        };

        handlerRegistry.getActivatedHandlerForData.mockReturnValue(handler);

        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const block = {
            transactions: [transaction],
        } as Interfaces.IBlock;

        const mempool = app.resolve(Mempool);

        await expect(mempool.applyBlock(block)).resolves.toEqual([]);

        expect(handler.onPoolLeave).not.toBeCalled();
        expect(handler.getInvalidPoolTransactions).toBeCalledTimes(1);
    });

    it("should return empty list when block contains transactions that are in pool", async () => {
        const handler = {
            onPoolLeave: jest.fn().mockImplementation(async () => {}),
            getInvalidPoolTransactions: jest.fn().mockResolvedValue([]),
        };

        handlerRegistry.getActivatedHandlerForData.mockReturnValue(handler);

        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
            removeForgedTransaction: jest.fn().mockReturnValue(true),
        };
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const mempool = app.resolve(Mempool);
        await mempool.addTransaction(transaction);

        const block = {
            transactions: [transaction],
        } as Interfaces.IBlock;

        await expect(mempool.applyBlock(block)).resolves.toEqual([]);

        expect(handler.onPoolLeave).toBeCalledTimes(1);
        expect(handler.getInvalidPoolTransactions).toBeCalledTimes(1);
        expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining("Removed forged"));
    });

    it("should return list of invalid transactions when forged transaction is not first in the list", async () => {
        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const invalidTransaction = {
            id: "invalid-transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const block = {
            transactions: [transaction],
        } as Interfaces.IBlock;

        const handler = {
            onPoolLeave: jest.fn(),
            getInvalidPoolTransactions: jest.fn().mockResolvedValue([]),
        };

        handlerRegistry.getActivatedHandlerForData.mockReturnValue(handler);

        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn().mockReturnValue(false),
            removeForgedTransaction: jest.fn().mockReturnValue(false),
            getFromLatest: jest.fn().mockReturnValue([invalidTransaction]),
            getFromEarliest: jest.fn().mockReturnValue([invalidTransaction]),
        };

        const newSenderMempool = {
            addTransaction: jest.fn().mockImplementation(() => {
                throw new Error("Transaction error");
            }),
            getSize: jest.fn().mockReturnValue(0),
        };
        createSenderMempool.mockReturnValueOnce(senderMempool).mockReturnValueOnce(newSenderMempool);

        const mempool = app.resolve(Mempool);

        await mempool.addTransaction(invalidTransaction);

        await expect(mempool.applyBlock(block)).resolves.toEqual([invalidTransaction]);

        expect(handler.onPoolLeave).toBeCalledTimes(1);
        expect(handler.onPoolLeave).toBeCalledWith(invalidTransaction);
        expect(handler.getInvalidPoolTransactions).toBeCalledTimes(1);
        expect(handler.getInvalidPoolTransactions).toBeCalledWith(transaction);
        expect(newSenderMempool.addTransaction).toBeCalledTimes(1);
        expect(newSenderMempool.addTransaction).toBeCalledWith(invalidTransaction);
        expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining("Removed invalid"));
    });

    it("should return list of invalid transactions when getInvalidTransactions returns transaction", async () => {
        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const invalidTransaction = {
            id: "invalid-transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender2") },
        } as Interfaces.ITransaction;

        const block = {
            transactions: [transaction],
        } as Interfaces.IBlock;

        const handler = {
            onPoolLeave: jest.fn(),
            getInvalidPoolTransactions: jest.fn().mockResolvedValue([invalidTransaction]),
        };

        handlerRegistry.getActivatedHandlerForData.mockReturnValue(handler);

        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
            removeForgedTransaction: jest.fn().mockReturnValue(true),
        };

        const secondSenderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn().mockReturnValue(false),
            getFromLatest: jest.fn().mockReturnValue([invalidTransaction]),
            getFromEarliest: jest.fn().mockReturnValue([invalidTransaction]),
        };

        const newSenderMempool = {
            addTransaction: jest.fn().mockImplementation(() => {
                throw new Error("Transaction error");
            }),
            getSize: jest.fn().mockReturnValue(0),
        };
        createSenderMempool
            .mockReturnValueOnce(senderMempool)
            .mockReturnValueOnce(secondSenderMempool)
            .mockReturnValueOnce(newSenderMempool);

        const mempool = app.resolve(Mempool);

        await mempool.addTransaction(transaction);
        await mempool.addTransaction(invalidTransaction);

        await expect(mempool.applyBlock(block)).resolves.toEqual([invalidTransaction]);

        expect(handler.onPoolLeave).toBeCalledTimes(2);
        expect(handler.onPoolLeave).toBeCalledWith(transaction);
        expect(handler.onPoolLeave).toBeCalledWith(invalidTransaction);
        expect(handler.getInvalidPoolTransactions).toBeCalledTimes(1);
        expect(handler.getInvalidPoolTransactions).toBeCalledWith(transaction);
        expect(newSenderMempool.addTransaction).toBeCalledTimes(1);
        expect(newSenderMempool.addTransaction).toBeCalledWith(invalidTransaction);
        expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining("Removed invalid"));
    });

    it("should return list of invalid transactions when getInvalidTransactions returns transaction and try to readd sender transactions", async () => {
        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const secondTransaction = {
            id: "second-transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender2") },
        } as Interfaces.ITransaction;

        const invalidTransaction = {
            id: "invalid-transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender2") },
        } as Interfaces.ITransaction;

        const block = {
            transactions: [transaction],
        } as Interfaces.IBlock;

        const handler = {
            onPoolLeave: jest.fn(),
            getInvalidPoolTransactions: jest.fn().mockResolvedValue([invalidTransaction]),
        };

        handlerRegistry.getActivatedHandlerForData.mockReturnValue(handler);

        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
            removeForgedTransaction: jest.fn().mockReturnValue(true),
        };

        const secondSenderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn().mockReturnValue(false),
            getFromLatest: jest.fn().mockReturnValue([invalidTransaction, secondTransaction]),
            getFromEarliest: jest.fn().mockReturnValue([secondTransaction, invalidTransaction]),
        };

        const newSenderMempool = {
            addTransaction: jest
                .fn()
                .mockImplementationOnce(() => {})
                .mockImplementation(() => {
                    throw new Error("Transaction error");
                }),
            getSize: jest.fn().mockReturnValue(1),
        };
        createSenderMempool
            .mockReturnValueOnce(senderMempool)
            .mockReturnValueOnce(secondSenderMempool)
            .mockReturnValueOnce(newSenderMempool);

        const mempool = app.resolve(Mempool);

        await mempool.addTransaction(transaction);
        await mempool.addTransaction(secondTransaction);

        await expect(mempool.applyBlock(block)).resolves.toEqual([invalidTransaction]);

        expect(handler.onPoolLeave).toBeCalledTimes(3);
        expect(handler.onPoolLeave).toBeCalledWith(transaction);
        expect(handler.onPoolLeave).toBeCalledWith(secondTransaction);
        expect(handler.onPoolLeave).toBeCalledWith(invalidTransaction);
        expect(handler.getInvalidPoolTransactions).toBeCalledTimes(1);
        expect(handler.getInvalidPoolTransactions).toBeCalledWith(transaction);
        expect(newSenderMempool.addTransaction).toBeCalledTimes(2);
        expect(newSenderMempool.addTransaction).toBeCalledWith(secondTransaction);
        expect(newSenderMempool.addTransaction).toBeCalledWith(invalidTransaction);
        expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining("Removed invalid"));
    });
});

describe("Mempool.flush", () => {
    it("should remove all sender states", async () => {
        const senderMempool = {
            addTransaction: jest.fn(),
            isDisposable: jest.fn(),
        };
        senderMempool.isDisposable.mockReturnValue(false);
        createSenderMempool.mockReturnValueOnce(senderMempool);

        const transaction = {
            id: "transaction-id",
            data: { senderPublicKey: Identities.PublicKey.fromPassphrase("sender1") },
        } as Interfaces.ITransaction;

        const memory = app.resolve(Mempool);
        await memory.addTransaction(transaction);
        memory.flush();
        const has = memory.hasSenderMempool(transaction.data.senderPublicKey);

        expect(has).toBe(false);
        expect(mempoolIndexRegistry.clear).toBeCalled();
    });
});
