import { Container } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

import { ExpirationService } from "../../../packages/core-transaction-pool/src/expiration-service";

jest.mock("@arkecosystem/crypto");

const configuration = { getRequired: jest.fn() };
const stateStore = { getLastHeight: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);

beforeEach(() => {
    (Crypto.Slots.getTime as jest.Mock).mockClear();
    (Managers.configManager.getMilestone as jest.Mock).mockClear();
    configuration.getRequired.mockClear();
    stateStore.getLastHeight.mockClear();
});

describe("ExpirationService.canExpire", () => {
    it("should return true when checking v1 transaction", () => {
        const transaction = { data: { timestamp: 3600 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const result = expirationService.canExpire(transaction);

        expect(result).toBe(true);
    });

    it("should return true when checking v2 transaction with expiration field", () => {
        const transaction = { data: { version: 2, expiration: 100 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const result = expirationService.canExpire(transaction);

        expect(result).toBe(true);
    });

    it("should return false when checking v2 transaction without expiration field", () => {
        const transaction = { data: { version: 2 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const result = expirationService.canExpire(transaction);

        expect(result).toBe(false);
    });
});

describe("ExpirationService.isExpired", () => {
    it("should always return false when checking v2 transaction without expiration field", () => {
        const transaction = { data: { version: 2 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = expirationService.isExpired(transaction);

        expect(expired).toBe(false);
    });

    it("should return true if transaction expired when checking v2 transaction with expiration field", () => {
        stateStore.getLastHeight.mockReturnValue(100);

        const transaction = { data: { version: 2, expiration: 50 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = expirationService.isExpired(transaction);

        expect(expired).toBe(true);
    });

    it("should return false if transaction not expired when checking v2 transaction with expiration field", () => {
        stateStore.getLastHeight.mockReturnValue(100);

        const transaction = { data: { version: 2, expiration: 150 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = expirationService.isExpired(transaction);

        expect(expired).toBe(false);
    });

    it("should return true if transaction expires in next block when checking v2 transaciton with expiration field", () => {
        stateStore.getLastHeight.mockReturnValue(100);

        const transaction = { data: { version: 2, expiration: 101 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = expirationService.isExpired(transaction);

        expect(expired).toBe(true);
    });

    it("should return true if transaction expired when checking v1 transaction", () => {
        (Managers.configManager.getMilestone as jest.Mock).mockReturnValue({ blocktime: 60 });
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(60 * 180);
        configuration.getRequired.mockReturnValue(60);
        stateStore.getLastHeight.mockReturnValue(180);

        const transaction = { data: { timestamp: 3600 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = expirationService.isExpired(transaction);

        expect(expired).toBe(true);
    });

    it("should return false if transaction not expired when checking v1 transaction", () => {
        (Managers.configManager.getMilestone as jest.Mock).mockReturnValue({ blocktime: 60 });
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(60 * 100);
        configuration.getRequired.mockReturnValue(60);
        stateStore.getLastHeight.mockReturnValue(100);

        const transaction = { data: { timestamp: 3600 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = expirationService.isExpired(transaction);

        expect(expired).toBe(false);
    });
});

describe("ExpirationService.getExpirationHeight", () => {
    it("should throw when checking v2 transaction without expiration field", () => {
        const transaction = { data: { version: 2 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const check = () => expirationService.getExpirationHeight(transaction);

        expect(check).toThrow();
    });

    it("should return value stored in expiration field when checking v2 transaciton with expiration field", () => {
        const transaction = { data: { version: 2, expiration: 100 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expirationHeight = expirationService.getExpirationHeight(transaction);

        expect(expirationHeight).toBe(100);
    });

    it("should calculate expiration height when checking v1 transaction", () => {
        (Managers.configManager.getMilestone as jest.Mock).mockReturnValue({ blocktime: 60 });
        (Crypto.Slots.getTime as jest.Mock).mockReturnValue(60 * 120);
        configuration.getRequired.mockReturnValue(60);
        stateStore.getLastHeight.mockReturnValue(120);

        const transaction = { data: { timestamp: 3600 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expirationHeight = expirationService.getExpirationHeight(transaction);

        expect(expirationHeight).toBe(120);
    });
});
