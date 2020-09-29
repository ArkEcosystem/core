import { LockSearchService, Resources } from "@arkecosystem/core-api";
import { LocksController } from "@arkecosystem/core-api/src/controllers/locks";
import { Identifiers } from "@arkecosystem/core-api/src/identifiers";
import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Enums, Utils } from "@arkecosystem/crypto";
import { Boom } from "@hapi/boom";

const jestfn = <T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>,
) => {
    return jest.fn(implementation);
};

const app = {
    resolve: jestfn<Application["resolve"]>(),
};

const apiConfiguration = {
    getOptional: jestfn<Providers.PluginConfiguration["getOptional"]>(),
};

const transactionHistoryService = {
    listByCriteria: jestfn<Contracts.Shared.TransactionHistoryService["listByCriteria"]>(),
};

const lockSearchService = {
    getLock: jestfn<LockSearchService["getLock"]>(),
    getLocksPage: jestfn<LockSearchService["getLocksPage"]>(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(apiConfiguration);
container.bind(Identifiers.LockSearchService).toConstantValue(lockSearchService);
container.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

beforeEach(() => {
    jest.resetAllMocks();
});

const lockResource1: Resources.LockResource = {
    lockId: "700bef5e3c2fcbbac83472b7320a635cf02fddb14e12d83f911f05faea8e540c",
    senderPublicKey: "02fd0f9eb5ce005710616258c6742f372577698f172fdca0418c5cd1e9698fc002",
    isExpired: false,
    amount: Utils.BigNumber.make("1000"),
    secretHash: "9929b94c6caf437576b458334b10605b4471086bda5dfdac6e3108043e349324",
    recipientId: "AXm433vapiwt83xfh8x9ciNxYkVd76pbNe",
    timestamp: {
        epoch: 108158400,
        unix: 1598259600,
        human: "2020-08-24T09:00:00.000Z",
    },
    expirationType: Enums.HtlcLockExpirationType.EpochTimestamp,
    expirationValue: 108158500,
    vendorField: "ArkPool payments",
};

describe("LocksController", () => {
    describe("Index", () => {
        it("should get criteria from query and return locks page from LockSearchService", () => {
            const locksPage: Contracts.Search.ResultsPage<Resources.LockResource> = {
                results: [lockResource1],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            };
            lockSearchService.getLocksPage.mockReturnValueOnce(locksPage);

            const locksController = container.resolve(LocksController);
            const result = locksController.index({
                query: {
                    page: 1,
                    limit: 100,
                    orderBy: ["amount:desc", "timestamp.epoch:desc"],
                    senderPublicKey: "02fd0f9eb5ce005710616258c6742f372577698f172fdca0418c5cd1e9698fc002",
                },
            });

            expect(lockSearchService.getLocksPage).toBeCalledWith(
                { offset: 0, limit: 100 },
                ["amount:desc", "timestamp.epoch:desc"],
                { senderPublicKey: "02fd0f9eb5ce005710616258c6742f372577698f172fdca0418c5cd1e9698fc002" },
            );

            expect(result).toBe(locksPage);
        });
    });

    describe("Show", () => {
        it("should get lockId from pathname and return lock from LockSearchService", () => {
            lockSearchService.getLock.mockReturnValueOnce(lockResource1);

            const locksController = container.resolve(LocksController);
            const result = locksController.show({
                params: {
                    id: lockResource1.lockId,
                },
            });

            expect(lockSearchService.getLock).toBeCalledWith(lockResource1.lockId);
            expect(result).toEqual({ data: lockResource1 });
        });

        it("should return 404 if lock wasn't found", () => {
            lockSearchService.getLock.mockReturnValueOnce(undefined);

            const locksController = container.resolve(LocksController);
            const result = locksController.show({
                params: {
                    id: "non-existing-lock-id",
                },
            });

            expect(lockSearchService.getLock).toBeCalledWith("non-existing-lock-id");
            expect(result).toBeInstanceOf(Boom);
        });
    });

    describe("Unlocked", () => {
        it("should get lockIds from payload and return claim and refund transactions from TransactionHistoryService", async () => {
            const lock1Id = "9929b94c6caf437576b458334b10605b4471086bda5dfdac6e3108043e349324";
            const lock2Id = "a17e0cb719ee3e6149db9620e6a667f0b582765aeeb63b1bef83baa860734fdc";

            const lock1Claim = {} as any;
            const lock2Refund = {} as any;

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                transform(resource) {
                    return resource;
                },
            });

            transactionHistoryService.listByCriteria.mockResolvedValueOnce({
                results: [lock1Claim, lock2Refund],
                totalCount: 2,
                meta: { totalCountIsEstimate: true },
            });

            const locksController = container.resolve(LocksController);
            const result = await locksController.unlocked(
                {
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "amount:desc",
                    },
                    payload: {
                        ids: [lock1Id, lock2Id],
                    },
                },
                undefined,
            );

            expect(apiConfiguration.getOptional).toBeCalledWith("options.estimateTotalCount", true);

            expect(transactionHistoryService.listByCriteria).toBeCalledWith(
                [
                    {
                        typeGroup: Enums.TransactionTypeGroup.Core,
                        type: Enums.TransactionType.HtlcClaim,
                        asset: [{ claim: { lockTransactionId: lock1Id } }, { claim: { lockTransactionId: lock2Id } }],
                    },
                    {
                        typeGroup: Enums.TransactionTypeGroup.Core,
                        type: Enums.TransactionType.HtlcRefund,
                        asset: [{ refund: { lockTransactionId: lock1Id } }, { refund: { lockTransactionId: lock2Id } }],
                    },
                ],
                [{ direction: "desc", property: "amount" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                totalCount: 2,
                results: [lock1Claim, lock2Refund],
                meta: { totalCountIsEstimate: true },
            });
        });
    });
});
