import { CryptoSuite } from "@packages/core-crypto";
import { Container, Contracts, Enums } from "@packages/core-kernel";
import { Services } from "@packages/core-kernel/dist";
import { Sandbox } from "@packages/core-test-framework/src";
import {
    ApplyTransactionAction,
    RevertTransactionAction,
    ThrowIfCannotEnterPoolAction,
    VerifyTransactionAction,
} from "@packages/core-transaction-pool/src/actions";
import { SenderState } from "@packages/core-transaction-pool/src/sender-state";
import { Interfaces } from "@packages/crypto";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

crypto.CryptoManager.HeightTracker.setHeight(2);
crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = true;
const configuration = { getRequired: jest.fn(), getOptional: jest.fn() };
const handler = { verify: jest.fn(), throwIfCannotEnterPool: jest.fn(), apply: jest.fn(), revert: jest.fn() };
const handlerRegistry = { getActivatedHandlerForData: jest.fn() };
const expirationService = { isExpired: jest.fn(), getExpirationHeight: jest.fn() };
const eventDispatcherService = { dispatch: jest.fn() };

let sandbox: Sandbox;

const networkConfigSpy = jest.spyOn(crypto.CryptoManager.NetworkConfigManager, "get");
const getTimeSpy = jest.spyOn(crypto.CryptoManager.LibraryManager.Crypto.Slots, "getTime");

beforeEach(() => {
    sandbox = new Sandbox(crypto);

    sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
    sandbox.app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(handlerRegistry);
    sandbox.app.bind(Container.Identifiers.TransactionPoolExpirationService).toConstantValue(expirationService);
    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcherService);
    sandbox.app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();

    sandbox.app
        .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("applyTransaction", new ApplyTransactionAction());

    sandbox.app
        .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("revertTransaction", new RevertTransactionAction());

    sandbox.app
        .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("throwIfCannotEnterPool", new ThrowIfCannotEnterPoolAction());

    sandbox.app
        .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("verifyTransaction", new VerifyTransactionAction());

    networkConfigSpy.mockReset();
    getTimeSpy.mockReset();

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
        networkConfigSpy.mockReturnValue(321); // network.pubKeyHash

        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes

        const senderState = sandbox.app.resolve(SenderState);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_WRONG_NETWORK");
    });

    it("should throw when transaction is from future", async () => {
        networkConfigSpy.mockReturnValue(123); // network.pubKeyHash
        getTimeSpy.mockReturnValue(9999);

        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes

        const senderState = sandbox.app.resolve(SenderState);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_FROM_FUTURE");
    });

    it("should throw when transaction expired", async () => {
        networkConfigSpy.mockReturnValue(123); // network.pubKeyHash
        getTimeSpy.mockReturnValue(13600);

        configuration.getRequired.mockReturnValueOnce(1024); // maxTransactionBytes
        expirationService.isExpired.mockReturnValueOnce(true);
        expirationService.getExpirationHeight.mockReturnValueOnce(10);

        const senderState = sandbox.app.resolve(SenderState);
        const promise = senderState.apply(transaction);

        await expect(promise).rejects.toBeInstanceOf(Contracts.TransactionPool.PoolError);
        await expect(promise).rejects.toHaveProperty("type", "ERR_EXPIRED");

        expect(eventDispatcherService.dispatch).toHaveBeenCalledTimes(1);
        expect(eventDispatcherService.dispatch).toHaveBeenCalledWith(Enums.TransactionEvent.Expired, expect.anything());
    });

    it("should throw when transaction fails to verify", async () => {
        networkConfigSpy.mockReturnValue(123); // network.pubKeyHash
        getTimeSpy.mockReturnValue(13600);

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

        networkConfigSpy.mockReturnValue(123); // network.pubKeyHash
        getTimeSpy.mockReturnValue(13600);

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
        networkConfigSpy.mockReturnValue(123); // network.pubKeyHash
        getTimeSpy.mockReturnValue(13600);

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
        networkConfigSpy.mockReturnValue(123); // network.pubKeyHash
        getTimeSpy.mockReturnValue(13600);
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
