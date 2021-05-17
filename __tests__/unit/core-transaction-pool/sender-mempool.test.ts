import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";

import { SenderMempool } from "../../../packages/core-transaction-pool/src/sender-mempool";

const configuration = { getRequired: jest.fn(), getOptional: jest.fn() };
const senderState = { apply: jest.fn(), revert: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
container.bind(Container.Identifiers.TransactionPoolSenderState).toConstantValue(senderState);

beforeEach(() => {
    configuration.getRequired.mockReset();
    configuration.getOptional.mockReset();
    senderState.apply.mockReset();
    senderState.revert.mockReset();
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
const transaction3 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("3")
    .fee("900")
    .sign("sender's secret")
    .build();

describe("SenderMempool.isDisposable", () => {
    it("should return true initially", () => {
        const senderMempool = container.resolve(SenderMempool);
        const empty = senderMempool.isDisposable();

        expect(empty).toBe(true);
    });

    it("should return false after transaction was added", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        const empty = senderMempool.isDisposable();

        expect(empty).toBe(false);
    });
});

describe("SenderMempool.getSize", () => {
    it("should return added transactions count", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        await senderMempool.addTransaction(transaction2);
        await senderMempool.addTransaction(transaction3);
        const size = senderMempool.getSize();

        expect(size).toBe(3);
    });
});

describe("SenderMempool.getFromEarliest", () => {
    it("should return transactions in order they were added", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        await senderMempool.addTransaction(transaction2);
        await senderMempool.addTransaction(transaction3);
        const addedTransactions = senderMempool.getFromEarliest();

        expect(addedTransactions).toStrictEqual([transaction1, transaction2, transaction3]);
    });
});

describe("SenderMempool.getFromLatest", () => {
    it("should return transactions in reverse order they were added", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        await senderMempool.addTransaction(transaction2);
        await senderMempool.addTransaction(transaction3);
        const addedTransactions = senderMempool.getFromLatest();

        expect(addedTransactions).toStrictEqual([transaction3, transaction2, transaction1]);
    });
});

describe("SenderMempool.addTransaction", () => {
    it("should apply transaction to sender state", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);

        expect(senderState.apply).toBeCalledWith(transaction1);
    });

    it("should throw when sender exceeded maximum transaction count", async () => {
        configuration.getRequired.mockReturnValueOnce(0); // maxTransactionsPerSender
        configuration.getOptional.mockReturnValueOnce([]); // allowedSenders

        const senderMempool = container.resolve(SenderMempool);
        const promise = senderMempool.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_EXCEEDS_MAX_COUNT");
    });

    it("should apply transaction to sender state when sender exceeded maximum transaction count but is included in allowedSenders", async () => {
        configuration.getRequired.mockReturnValueOnce(0); // maxTransactionsPerSender
        configuration.getOptional.mockReturnValueOnce([Identities.PublicKey.fromPassphrase("sender's secret")]); // allowedSenders

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);

        expect(senderState.apply).toBeCalledWith(transaction1);
    });
});

describe("SenderMempool.removeTransaction", () => {
    it("should revert transaction that was previously applied to sender state", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        await senderMempool.removeTransaction(transaction1.id);

        expect(senderState.revert).toBeCalledWith(transaction1);
    });

    it("should return empty array when removing transaction that wasn't previously added", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        const removedTransactions = await senderMempool.removeTransaction(transaction2.id);
        const remainingTransactions = senderMempool.getFromEarliest();

        expect(removedTransactions).toStrictEqual([]);
        expect(remainingTransactions).toStrictEqual([transaction1]);
    });

    it("should return all transactions that were added after one being removed", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        await senderMempool.addTransaction(transaction2);
        await senderMempool.addTransaction(transaction3);

        const removedTransactions = await senderMempool.removeTransaction(transaction2.id);
        const remainingTransactions = senderMempool.getFromEarliest();

        expect(removedTransactions).toStrictEqual([transaction3, transaction2]);
        expect(remainingTransactions).toStrictEqual([transaction1]);
    });

    it("should return all added transactions when revert failed", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender
        senderState.revert.mockRejectedValueOnce(new Error("Something wrong"));

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        await senderMempool.addTransaction(transaction2);
        await senderMempool.addTransaction(transaction3);

        const removedTransactions = await senderMempool.removeTransaction(transaction2.id);
        const remainingTransactions = senderMempool.getFromEarliest();

        expect(removedTransactions).toStrictEqual([transaction3, transaction2, transaction1]);
        expect(remainingTransactions).toStrictEqual([]);
    });
});

describe("SenderMempool.removeForgedTransaction", () => {
    it("should return all transactions that were added before transaction being accepted", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        await senderMempool.addTransaction(transaction2);
        await senderMempool.addTransaction(transaction3);

        const removedTransactions = await senderMempool.removeForgedTransaction(transaction2.id);
        const remainingTransactions = senderMempool.getFromEarliest();

        expect(removedTransactions).toStrictEqual([transaction1, transaction2]);
        expect(remainingTransactions).toStrictEqual([transaction3]);
    });

    it("should return no transactions when accepting unknown transaction", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender

        const senderMempool = container.resolve(SenderMempool);
        await senderMempool.addTransaction(transaction1);
        await senderMempool.addTransaction(transaction2);

        const removedTransactions = await senderMempool.removeForgedTransaction(transaction3.id);
        const remainingTransactions = senderMempool.getFromEarliest();

        expect(removedTransactions).toStrictEqual([]);
        expect(remainingTransactions).toStrictEqual([transaction1, transaction2]);
    });
});
