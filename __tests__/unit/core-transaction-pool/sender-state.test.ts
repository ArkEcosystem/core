import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

import { SenderState } from "../../../packages/core-transaction-pool/src/sender-state";

jest.mock("@arkecosystem/crypto");

const configuration = { getRequired: jest.fn(), getOptional: jest.fn() };
const handler = { verify: jest.fn(), throwIfCannotEnterPool: jest.fn(), apply: jest.fn(), revert: jest.fn() };
const handlerRegistry = { getActivatedHandlerForData: jest.fn() };
const expirationService = { isExpired: jest.fn(), getExpirationHeight: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
container.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(handlerRegistry);
container.bind(Container.Identifiers.TransactionPoolExpirationService).toConstantValue(expirationService);

beforeEach(() => {
    (Managers.configManager.get as jest.Mock).mockReset();
    (Crypto.Slots.getTime as jest.Mock).mockReset();

    configuration.getRequired.mockReset();
    configuration.getOptional.mockReset();
    handler.verify.mockReset();
    handler.throwIfCannotEnterPool.mockReset();
    handler.apply.mockReset();
    handler.revert.mockReset();
    handlerRegistry.getActivatedHandlerForData.mockReset();
    expirationService.isExpired.mockReset();
    expirationService.getExpirationHeight.mockReset();

    handlerRegistry.getActivatedHandlerForData.mockReturnValue(Promise.resolve(handler));
});

const transaction1 = {
    id: "tx1",
    timestamp: 13600,
    data: { senderPublicKey: "sender's public key", network: 123 },
} as Interfaces.ITransaction;

const transaction2 = {
    id: "tx2",
    timestamp: 13600,
    data: { senderPublicKey: "sender's public key", network: 123 },
} as Interfaces.ITransaction;

const transaction3 = {
    id: "tx3",
    timestamp: 13600,
    data: { senderPublicKey: "sender's public key", network: 123 },
} as Interfaces.ITransaction;

describe("SenderState.isEmpty", () => {
    it("should return true intially", () => {
        const senderState = container.resolve(SenderState);
        const empty = senderState.isEmpty();

        expect(empty).toBe(true);
    });

    it("should return false after transaction was added", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        handler.verify.mockResolvedValue(true);

        const senderState = container.resolve(SenderState);
        await senderState.addTransaction(transaction1);
        const empty = senderState.isEmpty();

        expect(empty).toBe(false);
    });
});

describe("SenderState.addTransaction", () => {
    it("should add transaction", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);

        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handler.verify.mockResolvedValue(true);

        const senderState = container.resolve(SenderState);
        const promise = senderState.addTransaction(transaction1);

        await expect(promise).resolves.toBe(undefined);
    });

    it("should throw when sender exceeded maximum transaction count", async () => {
        configuration.getRequired.mockReturnValueOnce(0); // maxTransactionsPerSender
        configuration.getOptional.mockReturnValueOnce([]); // allowedSenders

        const senderState = container.resolve(SenderState);
        const promise = senderState.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_EXCEEDS_MAX_COUNT");
    });

    it("should not throw when sender exceeded maximum transaction count but included in allowedSenders", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);

        configuration.getRequired.mockReturnValueOnce(0); // maxTransactionsPerSender
        configuration.getOptional.mockReturnValueOnce(["sender's public key"]); // allowedSenders
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handler.verify.mockResolvedValue(true);

        const senderState = container.resolve(SenderState);
        const promise = senderState.addTransaction(transaction1);

        await expect(promise).resolves.toBe(undefined);
    });

    it("should throw when transaction exceeds maximum byte size", async () => {
        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender
        configuration.getRequired.mockReturnValueOnce(0); // maxTransactionBytes

        const senderState = container.resolve(SenderState);
        const promise = senderState.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_TOO_LARGE");
    });

    it("should throw when transaction is from wrong network", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(321); // network.pubKeyHash

        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes

        const senderState = container.resolve(SenderState);
        const promise = senderState.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_WRONG_NETWORK");
    });

    it("should throw when transaction is from future", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(9999);

        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes

        const senderState = container.resolve(SenderState);
        const promise = senderState.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_FROM_FUTURE");
    });

    it("should throw when transaction expired", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);

        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(true);
        expirationService.getExpirationHeight.mockReturnValueOnce(10);

        const senderState = container.resolve(SenderState);
        const promise = senderState.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_EXPIRED");
    });

    it("should throw when transaction fails to verify", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);

        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handler.verify.mockResolvedValue(false);

        const senderState = container.resolve(SenderState);
        const promise = senderState.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_BAD_DATA");
    });

    it("should throw when transaction fails to apply", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);

        configuration.getRequired.mockReturnValueOnce(10); // maxTransactionsPerSender
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handler.verify.mockResolvedValue(true);
        handler.throwIfCannotEnterPool.mockRejectedValueOnce(new Error("Something terrible"));

        const senderState = container.resolve(SenderState);
        const promise = senderState.addTransaction(transaction1);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_APPLY");
    });
});

describe("SenderState.removeTransaction", () => {
    it("should return empty array when removing transaction that wasn't previously added", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        handler.verify.mockResolvedValue(true);

        const senderState = container.resolve(SenderState);
        await senderState.addTransaction(transaction1);
        const removedTransactions = await senderState.removeTransaction(transaction2);
        const leftTransactions = senderState.getTransactionsFromEarliestNonce();

        expect(removedTransactions).toStrictEqual([]);
        expect(leftTransactions).toStrictEqual([transaction1]);
    });

    it("should return all transactions that were added after one being removed", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        handler.verify.mockResolvedValue(true);

        const senderState = container.resolve(SenderState);
        await senderState.addTransaction(transaction1);
        await senderState.addTransaction(transaction2);
        await senderState.addTransaction(transaction3);
        const removedTransactions = await senderState.removeTransaction(transaction2);
        const leftTransactions = senderState.getTransactionsFromEarliestNonce();

        expect(removedTransactions).toStrictEqual([transaction3, transaction2]);
        expect(leftTransactions).toStrictEqual([transaction1]);
    });

    it("should return all added transactions when revert failed", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        handler.verify.mockResolvedValue(true);
        handler.revert.mockRejectedValueOnce(new Error("Something wrong"));

        const senderState = container.resolve(SenderState);
        await senderState.addTransaction(transaction1);
        await senderState.addTransaction(transaction2);
        await senderState.addTransaction(transaction3);
        const removedTransactions = await senderState.removeTransaction(transaction2);
        const leftTransactions = senderState.getTransactionsFromEarliestNonce();

        expect(removedTransactions).toStrictEqual([transaction3, transaction2, transaction1]);
        expect(leftTransactions).toStrictEqual([]);
    });
});

describe("SenderState.acceptForgedTransaction", () => {
    it("should return all transactions that were added before transaction being accepted", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        handler.verify.mockResolvedValue(true);

        const senderState = container.resolve(SenderState);
        await senderState.addTransaction(transaction1);
        await senderState.addTransaction(transaction2);
        await senderState.addTransaction(transaction3);
        const removedTransactions = await senderState.acceptForgedTransaction(transaction2);
        const leftTransactions = senderState.getTransactionsFromEarliestNonce();

        expect(removedTransactions).toStrictEqual([transaction1, transaction2]);
        expect(leftTransactions).toStrictEqual([transaction3]);
    });

    it("should return all added transactions when accepting unknown transaction", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        handler.verify.mockResolvedValue(true);

        const senderState = container.resolve(SenderState);
        await senderState.addTransaction(transaction1);
        await senderState.addTransaction(transaction2);
        const removedTransactions = await senderState.acceptForgedTransaction(transaction3);
        const leftTransactions = senderState.getTransactionsFromEarliestNonce();

        expect(removedTransactions).toStrictEqual([transaction1, transaction2]);
        expect(leftTransactions).toStrictEqual([]);
    });
});
