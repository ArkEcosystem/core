import { LockSearchService, Resources, WalletSearchService } from "@arkecosystem/core-api";
import { WalletsController } from "@arkecosystem/core-api/src/controllers/wallets";
import { Identifiers } from "@arkecosystem/core-api/src/identifiers";
import { Application, Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
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

const walletSearchService = {
    getWallet: jestfn<WalletSearchService["getWallet"]>(),
    getWalletsPage: jestfn<WalletSearchService["getWalletsPage"]>(),
};

const lockSearchService = {
    getWalletLocksPage: jestfn<LockSearchService["getWalletLocksPage"]>(),
};

const transactionHistoryService = {
    listByCriteria: jestfn<Contracts.Shared.TransactionHistoryService["listByCriteria"]>(),
    listByCriteriaJoinBlock: jestfn<Contracts.Shared.TransactionHistoryService["listByCriteriaJoinBlock"]>(),
};

const paginationService = {
    getEmptyPage: jestfn<Services.Search.PaginationService["getEmptyPage"]>(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(apiConfiguration);
container.bind(Identifiers.WalletSearchService).toConstantValue(walletSearchService);
container.bind(Identifiers.LockSearchService).toConstantValue(lockSearchService);
container.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);
container.bind(Container.Identifiers.PaginationService).toConstantValue(paginationService);

beforeEach(() => {
    jest.resetAllMocks();
});

const walletResource1: Resources.WalletResource = {
    address: "ATrkBiUXGDKduaSjqez2Ar7T9rQW6cnaeu",
    publicKey: "03c6e98f9aff65c517c824c9b21b6e1bc053a19f81d95d4f76426b1f5e651e64db",
    balance: Utils.BigNumber.make("31477465932829"),
    nonce: Utils.BigNumber.make("5"),
    attributes: {},
};

const walletResource2Cold: Resources.WalletResource = {
    address: "AdawBmuTYzjNgrYgDEbZVzPbYLvYnBin2Y",
    balance: Utils.BigNumber.make("1000"),
    nonce: Utils.BigNumber.make("0"),
    attributes: {},
};

const wallet1LockResource1: Resources.LockResource = {
    lockId: "700bef5e3c2fcbbac83472b7320a635cf02fddb14e12d83f911f05faea8e540c",
    senderPublicKey: "03c6e98f9aff65c517c824c9b21b6e1bc053a19f81d95d4f76426b1f5e651e64db",
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

describe("WalletsController", () => {
    describe("Index", () => {
        it("should get criteria from query and return wallets page from WalletSearchService", () => {
            const walletsPage: Contracts.Search.ResultsPage<Resources.WalletResource> = {
                results: [walletResource1],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            };
            walletSearchService.getWalletsPage.mockReturnValueOnce(walletsPage);

            const walletsController = container.resolve(WalletsController);
            const result = walletsController.index({
                query: {
                    page: 1,
                    limit: 100,
                    orderBy: ["balance:desc", "address:asc"],
                    address: "ATrkBiUXGDKduaSjqez2Ar7T9rQW6cnaeu",
                },
            });

            expect(walletSearchService.getWalletsPage).toBeCalledWith(
                { offset: 0, limit: 100 },
                ["balance:desc", "address:asc"],
                { address: "ATrkBiUXGDKduaSjqez2Ar7T9rQW6cnaeu" },
            );

            expect(result).toBe(walletsPage);
        });
    });

    describe("Top", () => {
        // it is exact duplicate of WalletsController.index

        it("should get criteria from query and return wallets page from WalletSearchService", () => {
            const walletsPage: Contracts.Search.ResultsPage<Resources.WalletResource> = {
                results: [walletResource1],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            };
            walletSearchService.getWalletsPage.mockReturnValueOnce(walletsPage);

            const walletsController = container.resolve(WalletsController);
            const result = walletsController.top({
                query: {
                    page: 1,
                    limit: 100,
                    orderBy: ["balance:desc", "address:asc"],
                    address: "ATrkBiUXGDKduaSjqez2Ar7T9rQW6cnaeu",
                },
            });

            expect(walletSearchService.getWalletsPage).toBeCalledWith(
                { offset: 0, limit: 100 },
                ["balance:desc", "address:asc"],
                { address: "ATrkBiUXGDKduaSjqez2Ar7T9rQW6cnaeu" },
            );

            expect(result).toBe(walletsPage);
        });
    });

    describe("Show", () => {
        it("should get wallet id from pathname and criteria from query and return wallet from WalletSearchService", () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const walletsController = container.resolve(WalletsController);
            const result = walletsController.show({
                params: {
                    id: walletResource1.address,
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.address);
            expect(result).toEqual({ data: walletResource1 });
        });

        it("should return 404 when wallet wasn't found", () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

            const walletsController = container.resolve(WalletsController);
            const result = walletsController.show({
                params: {
                    id: "non-existing-wallet-id",
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith("non-existing-wallet-id");
            expect(result).toBeInstanceOf(Boom);
        });
    });

    describe("Locks", () => {
        it("should get wallet id from pathname and criteria from query and return locks page from LockSearchService", () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const locksPage: Contracts.Search.ResultsPage<Resources.LockResource> = {
                results: [wallet1LockResource1],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            };
            lockSearchService.getWalletLocksPage.mockReturnValueOnce(locksPage);

            const walletsController = container.resolve(WalletsController);
            const result = walletsController.locks({
                params: {
                    id: walletResource1.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    orderBy: ["timestamp.unix:desc"],
                    isExpired: false,
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.publicKey);

            expect(lockSearchService.getWalletLocksPage).toBeCalledWith(
                { limit: 100, offset: 0 },
                ["timestamp.unix:desc"],
                walletResource1.address,
                { isExpired: false },
            );

            expect(result).toBe(locksPage);
        });

        it("should return 404 when wallet wasn't found", () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

            const walletsController = container.resolve(WalletsController);
            const result = walletsController.locks({
                params: {
                    id: "non-existing-wallet-id",
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith("non-existing-wallet-id");
            expect(result).toBeInstanceOf(Boom);
        });
    });

    describe("Transactions", () => {
        it("should get wallet id from pathname and return raw transactions from TransactionHistoryService", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const tx1 = {} as any;

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                raw(resource) {
                    return resource;
                },
            });

            transactionHistoryService.listByCriteria.mockResolvedValueOnce({
                results: [tx1],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactions(
                {
                    params: {
                        id: walletResource1.publicKey,
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "amount:desc",
                        transform: false,
                        type: Enums.TransactionType.MultiPayment,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.publicKey);

            expect(apiConfiguration.getOptional).toBeCalledWith("options.estimateTotalCount", true);

            expect(transactionHistoryService.listByCriteria).toBeCalledWith(
                {
                    type: Enums.TransactionType.MultiPayment,
                    address: walletResource1.address,

                    // not filtered out from criteria
                    page: 1,
                    limit: 100,
                    orderBy: "amount:desc",
                    transform: false,
                },
                [{ direction: "desc", property: "amount" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                totalCount: 1,
                results: [tx1],
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should get wallet id from pathname and return transformed transactions from TransactionHistoryService", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const tx1 = {} as any;
            const tx1Block = {} as any;

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                transform(resource) {
                    return resource.data;
                },
            });

            transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
                results: [{ data: tx1, block: tx1Block }],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactions(
                {
                    params: {
                        id: walletResource1.publicKey,
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "amount:desc",
                        transform: true,
                        type: Enums.TransactionType.MultiPayment,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.publicKey);

            expect(apiConfiguration.getOptional).toBeCalledWith("options.estimateTotalCount", true);

            expect(transactionHistoryService.listByCriteriaJoinBlock).toBeCalledWith(
                {
                    type: Enums.TransactionType.MultiPayment,
                    address: walletResource1.address,

                    // not filtered out from criteria
                    page: 1,
                    limit: 100,
                    orderBy: "amount:desc",
                    transform: true,
                },
                [{ direction: "desc", property: "amount" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                totalCount: 1,
                results: [tx1],
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should return 404 when wallet wasn't found", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactions(
                {
                    params: {
                        id: "non-existing-wallet-id",
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith("non-existing-wallet-id");
            expect(result).toBeInstanceOf(Boom);
        });
    });

    describe("TransactionsSent", () => {
        it("should get wallet id from pathname and return raw transactions from TransactionHistoryService", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const tx1 = {} as any;

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                raw(resource) {
                    return resource;
                },
            });

            transactionHistoryService.listByCriteria.mockResolvedValueOnce({
                results: [tx1],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactionsSent(
                {
                    params: {
                        id: walletResource1.publicKey,
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "amount:desc",
                        transform: false,
                        type: Enums.TransactionType.MultiPayment,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.publicKey);

            expect(apiConfiguration.getOptional).toBeCalledWith("options.estimateTotalCount", true);

            expect(transactionHistoryService.listByCriteria).toBeCalledWith(
                {
                    type: Enums.TransactionType.MultiPayment,
                    senderPublicKey: walletResource1.publicKey,

                    // not filtered out from criteria
                    page: 1,
                    limit: 100,
                    orderBy: "amount:desc",
                    transform: false,
                },
                [{ direction: "desc", property: "amount" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                results: [tx1],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should get wallet id from pathname and return transformed transactions from TransactionHistoryService", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const tx1 = {} as any;
            const tx1Block = {} as any;

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                transform(resource) {
                    return resource.data;
                },
            });

            transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
                results: [{ data: tx1, block: tx1Block }],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactionsSent(
                {
                    params: {
                        id: walletResource1.publicKey,
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "amount:desc",
                        transform: true,
                        type: Enums.TransactionType.MultiPayment,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.publicKey);

            expect(apiConfiguration.getOptional).toBeCalledWith("options.estimateTotalCount", true);

            expect(transactionHistoryService.listByCriteriaJoinBlock).toBeCalledWith(
                {
                    type: Enums.TransactionType.MultiPayment,
                    senderPublicKey: walletResource1.publicKey,

                    // not filtered out from criteria
                    page: 1,
                    limit: 100,
                    orderBy: "amount:desc",
                    transform: true,
                },
                [{ direction: "desc", property: "amount" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                totalCount: 1,
                results: [tx1],
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should return 404 when wallet wasn't found", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactionsSent(
                {
                    params: {
                        id: "non-existing-wallet-id",
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith("non-existing-wallet-id");
            expect(result).toBeInstanceOf(Boom);
        });

        it("should return empty page when wallet is cold wallet", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource2Cold);

            const emptyPage = { results: [], totalCount: 0, meta: { totalCountIsEstimate: false } };
            paginationService.getEmptyPage.mockReturnValueOnce(emptyPage);

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactionsSent(
                {
                    params: {
                        id: walletResource2Cold.address,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource2Cold.address);
            expect(paginationService.getEmptyPage).toBeCalled();
            expect(result).toBe(emptyPage);
        });
    });

    describe("TransactionsReceived", () => {
        it("should get wallet id from pathname and return raw transactions from TransactionHistoryService", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const tx1 = {} as any;

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                raw(resource) {
                    return resource;
                },
            });

            transactionHistoryService.listByCriteria.mockResolvedValueOnce({
                results: [tx1],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactionsReceived(
                {
                    params: {
                        id: walletResource1.publicKey,
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "amount:desc",
                        transform: false,
                        type: Enums.TransactionType.MultiPayment,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.publicKey);

            expect(apiConfiguration.getOptional).toBeCalledWith("options.estimateTotalCount", true);

            expect(transactionHistoryService.listByCriteria).toBeCalledWith(
                {
                    type: Enums.TransactionType.MultiPayment,
                    recipientId: walletResource1.address,

                    // not filtered out from criteria
                    page: 1,
                    limit: 100,
                    orderBy: "amount:desc",
                    transform: false,
                },
                [{ direction: "desc", property: "amount" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                totalCount: 1,
                results: [tx1],
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should get wallet id from pathname and return transformed transactions from TransactionHistoryService", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const tx1 = {} as any;
            const tx1Block = {} as any;

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                transform(resource) {
                    return resource.data;
                },
            });

            transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
                results: [{ data: tx1, block: tx1Block }],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactionsReceived(
                {
                    params: {
                        id: walletResource1.publicKey,
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "amount:desc",
                        transform: true,
                        type: Enums.TransactionType.MultiPayment,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.publicKey);

            expect(apiConfiguration.getOptional).toBeCalledWith("options.estimateTotalCount", true);

            expect(transactionHistoryService.listByCriteriaJoinBlock).toBeCalledWith(
                {
                    type: Enums.TransactionType.MultiPayment,
                    recipientId: walletResource1.address,

                    // not filtered out from criteria
                    page: 1,
                    limit: 100,
                    orderBy: "amount:desc",
                    transform: true,
                },
                [{ direction: "desc", property: "amount" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                results: [tx1],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should return 404 when wallet wasn't found", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.transactionsReceived(
                {
                    params: {
                        id: "non-existing-wallet-id",
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith("non-existing-wallet-id");
            expect(result).toBeInstanceOf(Boom);
        });
    });

    describe("Votes", () => {
        it("should get wallet id from pathname and return raw transactions from TransactionHistoryService", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const tx1 = {} as any;

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                raw(resource) {
                    return resource;
                },
            });

            transactionHistoryService.listByCriteria.mockResolvedValueOnce({
                results: [tx1],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.votes(
                {
                    params: {
                        id: walletResource1.publicKey,
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "amount:desc",
                        transform: false,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.publicKey);

            expect(apiConfiguration.getOptional).toBeCalledWith("options.estimateTotalCount", true);

            expect(transactionHistoryService.listByCriteria).toBeCalledWith(
                {
                    senderPublicKey: walletResource1.publicKey,
                    typeGroup: Enums.TransactionTypeGroup.Core,
                    type: Enums.TransactionType.Vote,

                    // not filtered out from criteria
                    page: 1,
                    limit: 100,
                    orderBy: "amount:desc",
                    transform: false,
                },
                [{ direction: "desc", property: "amount" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                results: [tx1],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should get wallet id from pathname and return transformed transactions from TransactionHistoryService", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource1);

            const tx1 = {} as any;
            const tx1Block = {} as any;

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                transform(resource) {
                    return resource.data;
                },
            });

            transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
                results: [{ data: tx1, block: tx1Block }],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.votes(
                {
                    params: {
                        id: walletResource1.publicKey,
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "amount:desc",
                        transform: true,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource1.publicKey);

            expect(apiConfiguration.getOptional).toBeCalledWith("options.estimateTotalCount", true);

            expect(transactionHistoryService.listByCriteriaJoinBlock).toBeCalledWith(
                {
                    senderPublicKey: walletResource1.publicKey,
                    typeGroup: Enums.TransactionTypeGroup.Core,
                    type: Enums.TransactionType.Vote,

                    // not filtered out from criteria
                    page: 1,
                    limit: 100,
                    orderBy: "amount:desc",
                    transform: true,
                },
                [{ direction: "desc", property: "amount" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                results: [tx1],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should return 404 when wallet wasn't found", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.votes(
                {
                    params: {
                        id: "non-existing-wallet-id",
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith("non-existing-wallet-id");
            expect(result).toBeInstanceOf(Boom);
        });

        it("should return empty page when wallet is cold wallet", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(walletResource2Cold);

            const emptyPage = {
                results: [],
                totalCount: 0,
                meta: { totalCountIsEstimate: false },
            };
            paginationService.getEmptyPage.mockReturnValueOnce(emptyPage);

            const walletsController = container.resolve(WalletsController);
            const result = await walletsController.votes(
                {
                    params: {
                        id: walletResource2Cold.address,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith(walletResource2Cold.address);
            expect(paginationService.getEmptyPage).toBeCalled();
            expect(result).toBe(emptyPage);
        });
    });
});
