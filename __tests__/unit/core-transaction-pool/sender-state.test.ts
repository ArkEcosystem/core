import { Container, Contracts } from "@packages/core-kernel";
import { Crypto, Interfaces, Managers } from "@packages/crypto";

import { SenderState } from "@packages/core-transaction-pool/src/sender-state";
import { Sandbox } from "@packages/core-test-framework";
import { Services } from "@packages/core-kernel/dist";
import {
    ApplyTransactionAction,
    RevertTransactionAction,
    ThrowIfCannotEnterPoolAction, VerifyTransactionAction,
} from "@packages/core-transaction-pool/src/actions";

jest.mock("@packages/crypto");

const configuration = { getRequired: jest.fn(), getOptional: jest.fn() };
const handler = { verify: jest.fn(), throwIfCannotEnterPool: jest.fn(), apply: jest.fn(), revert: jest.fn() };
const handlerRegistry = { getActivatedHandlerForData: jest.fn() };
const expirationService = { isExpired: jest.fn(), getExpirationHeight: jest.fn() };

let sandbox: Sandbox;

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
    sandbox.app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(handlerRegistry);
    sandbox.app.bind(Container.Identifiers.TransactionPoolExpirationService).toConstantValue(expirationService);
    sandbox.app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();

    sandbox.app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("applyTransaction", new ApplyTransactionAction());

    sandbox.app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("revertTransaction", new RevertTransactionAction());

    sandbox.app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("throwIfCannotEnterPool", new ThrowIfCannotEnterPoolAction());

    sandbox.app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("verifyTransaction", new VerifyTransactionAction());

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

const transaction = {
    id: "tx1",
    timestamp: 13600,
    data: { senderPublicKey: "sender's public key", network: 123 },
} as Interfaces.ITransaction;

describe("SenderState.apply", () => {
    it("should throw when transaction exceeds maximum byte size", async () => {
        configuration.getRequired.mockReturnValueOnce(0); // maxTransactionBytes

        const senderState = sandbox.app.resolve(SenderState);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_TOO_LARGE");
    });

    it("should throw when transaction is from wrong network", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(321); // network.pubKeyHash
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes

        const senderState = sandbox.app.resolve(SenderState);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_WRONG_NETWORK");
    });

    it("should throw when transaction is from future", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(9999);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes

        const senderState = sandbox.app.resolve(SenderState);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_FROM_FUTURE");
    });

    it("should throw when transaction expired", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(true);
        expirationService.getExpirationHeight.mockReturnValueOnce(10);

        const senderState = sandbox.app.resolve(SenderState);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_EXPIRED");
    });

    it("should throw when transaction fails to verify", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handler.verify.mockResolvedValue(false);

        const senderState = sandbox.app.resolve(SenderState);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_BAD_DATA");
    });

    it("should throw when state is corrupted", async () => {
        handler.revert.mockRejectedValueOnce(new Error("Corrupt it"));

        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handler.verify.mockResolvedValue(true);

        const senderState = sandbox.app.resolve(SenderState);
        await senderState.revert(transaction).catch(() => undefined);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_RETRY");
    });

    it("should throw when transaction fails to apply", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handler.verify.mockResolvedValue(true);
        handler.throwIfCannotEnterPool.mockRejectedValueOnce(new Error("Something terrible"));

        const senderState = sandbox.app.resolve(SenderState);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_APPLY");
    });

    it("should call handler to apply transaction", async () => {
        (Managers.configManager.get as jest.Mock).mockReturnValue(123); // network.pubKeyHash
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(13600);
        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(false);
        handler.verify.mockResolvedValue(true);

        const senderState = sandbox.app.resolve(SenderState);
        await senderState.apply(transaction);

        expect(handler.throwIfCannotEnterPool).toBeCalledWith(transaction);
        expect(handler.apply).toBeCalledWith(transaction);
    });
});

describe("SenderState.revert", () => {
    it("should call handler to revert transaction", async () => {
        const senderState = sandbox.app.resolve(SenderState);
        await senderState.revert(transaction);

        expect(handler.revert).toBeCalledWith(transaction);
    });
});
