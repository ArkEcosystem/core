import { Container, Contracts, Enums } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

import { SenderState } from "../../../packages/core-transaction-pool/src/sender-state";

jest.mock("@packages/crypto");

const configuration = {
    getRequired: jest.fn(),
    getOptional: jest.fn(),
};
const handlerRegistry = {
    getActivatedHandlerForData: jest.fn(),
};
const expirationService = {
    isExpired: jest.fn(),
    getExpirationHeight: jest.fn(),
};
const triggers = {
    call: jest.fn(),
};
const emitter = {
    dispatch: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
container.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(handlerRegistry);
container.bind(Container.Identifiers.TransactionPoolExpirationService).toConstantValue(expirationService);
container.bind(Container.Identifiers.TriggerService).toConstantValue(triggers);
container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(emitter);

beforeEach(() => {
    (Managers.configManager.get as jest.Mock).mockReset();
    (Crypto.Slots.getTime as jest.Mock).mockReset();

    configuration.getRequired.mockReset();
    configuration.getOptional.mockReset();
    handlerRegistry.getActivatedHandlerForData.mockReset();
    expirationService.isExpired.mockReset();
    expirationService.getExpirationHeight.mockReset();
    triggers.call.mockReset();
    emitter.dispatch.mockReset();
});

const transaction = {
    id: "tx1",
    timestamp: 13600,
    data: { senderPublicKey: "sender's public key", network: 123 },
    serialized: Buffer.alloc(10),
} as Interfaces.ITransaction;

describe("SenderState.apply", () => {
    it("should throw when transaction exceeds maximum byte size", async () => {
        const senderState = container.resolve(SenderState);

        configuration.getRequired.mockReturnValueOnce(0); // maxTransactionBytes

        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_TOO_LARGE");
    });

    it("should throw when transaction is from wrong network", async () => {
        const senderState = container.resolve(SenderState);

        (Managers.configManager.get as jest.Mock).mockReturnValue(321); // network.pubKeyHash
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes

        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_WRONG_NETWORK");
    });

    it("should throw when transaction is from future", async () => {
        const senderState = container.resolve(SenderState);

        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(9999);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes

        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_FROM_FUTURE");
    });

    it("should throw when transaction expired", async () => {
        const senderState = container.resolve(SenderState);

        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(true);
        expirationService.getExpirationHeight.mockReturnValueOnce(10);

        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_EXPIRED");

        expect(emitter.dispatch).toHaveBeenCalledTimes(1);
        expect(emitter.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.Expired, expect.anything());
    });

    it("should throw when transaction fails to verify", async () => {
        const senderState = container.resolve(SenderState);
        const handler = {};

        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handlerRegistry.getActivatedHandlerForData.mockResolvedValueOnce(handler);
        triggers.call.mockResolvedValueOnce(false); // verifyTransaction

        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_BAD_DATA");

        expect(handlerRegistry.getActivatedHandlerForData).toBeCalledWith(transaction.data);
        expect(triggers.call).toBeCalledWith("verifyTransaction", { handler, transaction });
    });

    it("should throw when state is corrupted", async () => {
        const senderState = container.resolve(SenderState);
        const handler = {};

        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);

        // revert
        handlerRegistry.getActivatedHandlerForData.mockResolvedValueOnce(handler);
        triggers.call.mockRejectedValueOnce(new Error("Corrupt it!")); // revertTransaction

        // apply
        handlerRegistry.getActivatedHandlerForData.mockResolvedValueOnce(handler);
        triggers.call.mockResolvedValueOnce(true); // verifyTransaction

        await senderState.revert(transaction).catch(() => undefined);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_RETRY");

        expect(handlerRegistry.getActivatedHandlerForData).toBeCalledWith(transaction.data);
        expect(triggers.call).toBeCalledWith("revertTransaction", { handler, transaction });

        expect(handlerRegistry.getActivatedHandlerForData).toBeCalledWith(transaction.data);
        expect(triggers.call).toBeCalledWith("verifyTransaction", { handler, transaction });
    });

    it("should throw when transaction fails to apply", async () => {
        const senderState = container.resolve(SenderState);
        const handler = {};

        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handlerRegistry.getActivatedHandlerForData.mockResolvedValueOnce(handler);
        triggers.call.mockResolvedValueOnce(true); // verifyTransaction
        triggers.call.mockResolvedValueOnce(undefined); // throwIfCannotEnterPool
        triggers.call.mockRejectedValueOnce(new Error("Some apply error")); // applyTransaction

        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_APPLY");

        expect(handlerRegistry.getActivatedHandlerForData).toBeCalledWith(transaction.data);
        expect(triggers.call).toBeCalledWith("verifyTransaction", { handler, transaction });
        expect(triggers.call).toBeCalledWith("throwIfCannotEnterPool", { handler, transaction });
        expect(triggers.call).toBeCalledWith("applyTransaction", { handler, transaction });
    });

    it("should call handler to apply transaction", async () => {
        const senderState = container.resolve(SenderState);
        const handler = {};

        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handlerRegistry.getActivatedHandlerForData.mockResolvedValueOnce(handler);
        triggers.call.mockResolvedValueOnce(true); // verifyTransaction
        triggers.call.mockResolvedValueOnce(undefined); // throwIfCannotEnterPool
        triggers.call.mockResolvedValueOnce(undefined); // applyTransaction

        await senderState.apply(transaction);

        expect(handlerRegistry.getActivatedHandlerForData).toBeCalledWith(transaction.data);
        expect(triggers.call).toBeCalledWith("verifyTransaction", { handler, transaction });
        expect(triggers.call).toBeCalledWith("throwIfCannotEnterPool", { handler, transaction });
        expect(triggers.call).toBeCalledWith("applyTransaction", { handler, transaction });
    });
});

describe("SenderState.revert", () => {
    it("should call handler to revert transaction", async () => {
        const senderState = container.resolve(SenderState);
        const handler = {};

        handlerRegistry.getActivatedHandlerForData.mockResolvedValueOnce(handler);
        triggers.call.mockResolvedValueOnce(undefined); // revertTransaction

        await senderState.revert(transaction);

        expect(handlerRegistry.getActivatedHandlerForData).toBeCalledWith(transaction.data);
        expect(triggers.call).toBeCalledWith("revertTransaction", { handler, transaction });
    });
});
