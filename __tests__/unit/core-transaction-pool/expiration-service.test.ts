import { Container, Utils } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

import { ExpirationService } from "../../../packages/core-transaction-pool/src/expiration-service";

const configuration = { getRequired: jest.fn() };
const stateStore = { getLastHeight: jest.fn() };
const app = { get: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);

beforeEach(() => {
    jest.resetAllMocks();
    configuration.getRequired.mockReset();
    stateStore.getLastHeight.mockReset();

    const getTimeStampForBlock = (height: number) => {
        switch (height) {
            case 1:
                return 0;
            default:
                throw new Error(`Test scenarios should not hit this line`);
        }
    };

    jest.spyOn(Utils.forgingInfoCalculator, "getBlockTimeLookup").mockResolvedValue(getTimeStampForBlock);
});

describe("ExpirationService.canExpire", () => {
    it("should return true when checking v1 transaction", () => {
        const transaction = { data: { timestamp: 3600 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const result = expirationService.canExpire(transaction);

        expect(result).toBe(true);
    });

    it("should return false when checking v2 transaction with 0 expiration", () => {
        const transaction = { data: { version: 2, expiration: 0 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const result = expirationService.canExpire(transaction);

        expect(result).toBe(false);
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
    it("should always return false when checking v2 transaction without expiration field", async () => {
        const transaction = { data: { version: 2 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = await expirationService.isExpired(transaction);

        expect(expired).toBe(false);
    });

    it("should return true if transaction expired when checking v2 transaction with expiration field", async () => {
        stateStore.getLastHeight.mockReturnValue(100);

        const transaction = { data: { version: 2, expiration: 50 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = await expirationService.isExpired(transaction);

        expect(expired).toBe(true);
    });

    it("should return false if transaction not expired when checking v2 transaction with expiration field", async () => {
        stateStore.getLastHeight.mockReturnValue(100);

        const transaction = { data: { version: 2, expiration: 150 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = await expirationService.isExpired(transaction);

        expect(expired).toBe(false);
    });

    it("should return true if transaction expires in next block when checking v2 transaciton with expiration field", async () => {
        stateStore.getLastHeight.mockReturnValue(100);

        const transaction = { data: { version: 2, expiration: 101 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = await expirationService.isExpired(transaction);

        expect(expired).toBe(true);
    });

    it("should return true if transaction expired when checking v1 transaction", async () => {
        jest.spyOn(Managers.configManager, "get").mockReturnValue([{ height: 1, blocktime: 60 }]);
        jest.spyOn(Crypto.Slots, "getTime").mockReturnValue(60 * 180);
        configuration.getRequired.mockReturnValue(60);
        stateStore.getLastHeight.mockReturnValue(180);

        const transaction = { data: { timestamp: 3600 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = await expirationService.isExpired(transaction);

        expect(expired).toBe(true);
    });

    it("should return false if transaction not expired when checking v1 transaction", async () => {
        jest.spyOn(Managers.configManager, "get").mockReturnValue([{ height: 1, blocktime: 60 }]);

        jest.spyOn(Crypto.Slots, "getTime").mockReturnValue(60 * 100);

        configuration.getRequired.mockReturnValue(60);
        stateStore.getLastHeight.mockReturnValue(100);

        const transaction = { data: { timestamp: 3600 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expired = await expirationService.isExpired(transaction);

        expect(expired).toBe(false);
    });
});

describe("ExpirationService.getExpirationHeight", () => {
    it("should throw when checking v2 transaction without expiration field", async () => {
        const transaction = { data: { version: 2 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const check = async () => await expirationService.getExpirationHeight(transaction);

        await expect(check()).rejects.toThrowError();
    });

    it("should return value stored in expiration field when checking v2 transaction with expiration field", async () => {
        const transaction = { data: { version: 2, expiration: 100 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expirationHeight = await expirationService.getExpirationHeight(transaction);

        expect(expirationHeight).toBe(100);
    });

    it("should calculate expiration height when checking v1 transaction", async () => {
        jest.spyOn(Managers.configManager, "get").mockReturnValue([{ height: 1, blocktime: 60 }]);

        jest.spyOn(Crypto.Slots, "getTime").mockReturnValue(60 * 120);

        configuration.getRequired.mockReturnValue(60);
        stateStore.getLastHeight.mockReturnValue(120);

        const transaction = { data: { timestamp: 3600 } } as Interfaces.ITransaction;
        const expirationService = container.resolve(ExpirationService);
        const expirationHeight = await expirationService.getExpirationHeight(transaction);

        expect(expirationHeight).toBe(120);
    });
});
