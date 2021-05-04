import { LockSearchService } from "@packages/core-api/src/services/lock-search-service";
import { Container, Services, Utils as AppUtils } from "@packages/core-kernel";
import { Wallets } from "@packages/core-state";

import { Locks } from "./__fixtures__";

const walletRepository = {
    hasByIndex: jest.fn(),
    findByIndex: jest.fn(),
    getIndex: jest.fn(),
    findByAddress: jest.fn(),
};

const stateStore = {
    getLastBlock: jest.fn(),
};

const standardCriteriaService = {
    testStandardCriterias: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);
container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
container.bind(Container.Identifiers.StandardCriteriaService).toConstantValue(standardCriteriaService);
container.bind(Container.Identifiers.PaginationService).to(Services.Search.PaginationService);

const lockSearchService: LockSearchService = container.resolve(LockSearchService);

let attributeMap;

beforeEach(() => {
    const attributeSet = new Services.Attributes.AttributeSet();
    attributeSet.set("htlc");
    attributeSet.set("htlc.locks");
    attributeSet.set("htlc.lockedBalance");

    attributeMap = new Services.Attributes.AttributeMap(attributeSet);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("LockSearchService", () => {
    describe("getLock", () => {
        it("should return lock by wallet", () => {
            const walletWithLock = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo", attributeMap);
            walletWithLock.setPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");

            walletWithLock.setAttribute("htlc", {
                locks: Locks.walletLockAttributes,
                lockedBalance: AppUtils.BigNumber.ONE,
            });

            walletRepository.hasByIndex.mockReturnValue(true);
            walletRepository.findByIndex.mockReturnValue(walletWithLock);
            AppUtils.expirationCalculator.calculateLockExpirationStatus = jest.fn().mockReturnValue(false);

            expect(
                lockSearchService.getLock("8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d"),
            ).toEqual(Locks.lockResource);

            expect(walletRepository.hasByIndex).toHaveBeenCalled();
            expect(walletRepository.findByIndex).toHaveBeenCalled();
            expect(AppUtils.expirationCalculator.calculateLockExpirationStatus).toHaveBeenCalled();
        });

        it("should return undefined if lock is not found", () => {
            walletRepository.hasByIndex.mockReturnValue(false);

            expect(
                lockSearchService.getLock("8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d"),
            ).toBeUndefined();
        });
    });

    describe("getLocksPage", () => {
        beforeEach(() => {
            const walletWithLock = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo", attributeMap);
            walletWithLock.setPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");

            walletWithLock.setAttribute("htlc", {
                locks: Locks.walletLockAttributes,
                lockedBalance: AppUtils.BigNumber.ONE,
            });

            walletRepository.getIndex.mockReturnValue({
                entries: jest
                    .fn()
                    .mockReturnValue([
                        ["8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d", walletWithLock],
                    ]),
            });
        });

        it("should check all locks in locks index", () => {
            standardCriteriaService.testStandardCriterias.mockReturnValue(true);
            AppUtils.expirationCalculator.calculateLockExpirationStatus = jest.fn().mockReturnValue(false);

            const result = lockSearchService.getLocksPage(
                {
                    offset: 0,
                    limit: 100,
                },
                [],
                [],
            );

            expect(result.results).toEqual([Locks.lockResource]);
        });

        it("should return empty array if all tested criterias are false", () => {
            standardCriteriaService.testStandardCriterias.mockReturnValue(false);
            AppUtils.expirationCalculator.calculateLockExpirationStatus = jest.fn().mockReturnValue(false);

            const result = lockSearchService.getLocksPage(
                {
                    offset: 0,
                    limit: 100,
                },
                [],
                [],
            );

            expect(result.results).toEqual([]);
        });
    });

    describe("getWalletLocksPage", () => {
        beforeEach(() => {
            const walletWithLock = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo", attributeMap);
            walletWithLock.setPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");

            walletWithLock.setAttribute("htlc", {
                locks: Locks.walletLockAttributes,
                lockedBalance: AppUtils.BigNumber.ONE,
            });

            walletRepository.findByAddress.mockReturnValue(walletWithLock);
        });

        it("should check and return all wallet locks", () => {
            standardCriteriaService.testStandardCriterias.mockReturnValue(true);
            AppUtils.expirationCalculator.calculateLockExpirationStatus = jest.fn().mockReturnValue(false);

            const result = lockSearchService.getWalletLocksPage(
                {
                    offset: 0,
                    limit: 100,
                },
                [],
                "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
                [],
            );

            expect(result.results).toEqual([Locks.lockResource]);
        });

        it("should return empty array if all tested criterias are false", () => {
            standardCriteriaService.testStandardCriterias.mockReturnValue(false);
            AppUtils.expirationCalculator.calculateLockExpirationStatus = jest.fn().mockReturnValue(false);

            const result = lockSearchService.getWalletLocksPage(
                {
                    offset: 0,
                    limit: 100,
                },
                [],
                "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
                [],
            );

            expect(result.results).toEqual([]);
        });
    });
});
