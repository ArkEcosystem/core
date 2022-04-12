import { DelegateSearchService, Resources, WalletSearchService } from "@arkecosystem/core-api";
import { DelegatesController } from "@arkecosystem/core-api/src/controllers/delegates";
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

const delegateSearchService = {
    getDelegatesPage: jestfn<DelegateSearchService["getDelegatesPage"]>(),
    getDelegate: jestfn<DelegateSearchService["getDelegate"]>(),
};

const walletSearchService = {
    getWallet: jestfn<WalletSearchService["getWallet"]>(),
    getActiveWalletsPage: jestfn<WalletSearchService["getActiveWalletsPage"]>(),
};

const blockHistoryService = {
    listByCriteriaJoinTransactions: jestfn<Contracts.Shared.BlockHistoryService["listByCriteriaJoinTransactions"]>(),
    listByCriteria: jestfn<Contracts.Shared.BlockHistoryService["listByCriteria"]>(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(apiConfiguration);
container.bind(Identifiers.DelegateSearchService).toConstantValue(delegateSearchService);
container.bind(Identifiers.WalletSearchService).toConstantValue(walletSearchService);
container.bind(Container.Identifiers.BlockHistoryService).toConstantValue(blockHistoryService);

const delegateWalletResource: Resources.WalletResource = {
    address: "AKdr5d9AMEnsKYxpDcoHdyyjSCKVx3r9Nj",
    publicKey: "020431436cf94f3c6a6ba566fe9e42678db8486590c732ca6c3803a10a86f50b92",
    balance: Utils.BigNumber.make("591828336750"),
    nonce: Utils.BigNumber.make("375627"),
    attributes: {
        vote: "03f25207238ef72cc3a0482af05a5296996da80c92dd0c1eb80e911281eedaf237",
        delegate: {
            username: "biz_classic",
            voteBalance: Utils.BigNumber.make("303991427568137"),
            rank: 2,
        },
    },
};

const delegateResource: Resources.DelegateResource = {
    username: "biz_classic",
    address: "AKdr5d9AMEnsKYxpDcoHdyyjSCKVx3r9Nj",
    publicKey: "020431436cf94f3c6a6ba566fe9e42678db8486590c732ca6c3803a10a86f50b92",
    votes: Utils.BigNumber.make("303991427568137"),
    rank: 2,
    isResigned: false,
    blocks: {
        produced: 242504,
        last: {
            id: "0d51a4f17168766717cc9cbd83729a50913f7085b14c0c3fe774a020d4197688",
            height: 13368988,
            timestamp: {
                epoch: 108163200,
                human: "2020-08-24T10:20:00.000Z",
                unix: 1598264400,
            },
        },
    },
    production: {
        approval: 2.01,
    },
    forged: {
        fees: Utils.BigNumber.make("1173040419815"),
        rewards: Utils.BigNumber.make("48500800000000"),
        total: Utils.BigNumber.make("49673840419815"),
    },
};

const voterWalletResource: Resources.WalletResource = {
    address: "ATL9kyo71wjPPXqvGMUD89t5RazmQfQMc6",
    publicKey: "03a4a2ca6fd5bda092177f02ce6672922c51391d843bf25560dbfccae2fa683771",
    balance: Utils.BigNumber.make("25130683837728"),
    nonce: Utils.BigNumber.make("8"),
    attributes: {
        vote: delegateResource.publicKey,
    },
};

describe("DelegatesController", () => {
    describe("Index", () => {
        it("should get criteria from query and return delegates page from DelegateSearchService", () => {
            const delegatesPage: Contracts.Search.ResultsPage<Resources.DelegateResource> = {
                results: [delegateResource],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            };
            delegateSearchService.getDelegatesPage.mockReturnValueOnce(delegatesPage);

            const delegatesController = container.resolve(DelegatesController);
            const result = delegatesController.index({
                query: {
                    page: 1,
                    limit: 100,
                    orderBy: ["production.approval:desc", "rank:asc"],
                    isResigned: false,
                },
            });

            expect(delegateSearchService.getDelegatesPage).toBeCalledWith(
                { offset: 0, limit: 100 },
                ["production.approval:desc", "rank:asc"],
                { isResigned: false },
            );

            expect(result).toBe(delegatesPage);
        });
    });

    describe("Show", () => {
        it("should get delegate id from pathname and return delegate from DelegateSearchService", () => {
            walletSearchService.getWallet.mockReturnValue(delegateWalletResource);
            delegateSearchService.getDelegate.mockReturnValueOnce(delegateResource);

            const delegatesController = container.resolve(DelegatesController);
            const result = delegatesController.show({
                params: {
                    id: "AKdr5d9AMEnsKYxpDcoHdyyjSCKVx3r9Nj",
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith("AKdr5d9AMEnsKYxpDcoHdyyjSCKVx3r9Nj");
            expect(delegateSearchService.getDelegate).toBeCalledWith(delegateWalletResource.address);
            expect(result).toEqual({ data: delegateResource });
        });

        it("should return 404 when wallet wasn't found", () => {
            walletSearchService.getWallet.mockReturnValue(undefined);

            const delegatesController = container.resolve(DelegatesController);
            const result = delegatesController.show({
                params: {
                    id: "non-existing-wallet-id",
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith("non-existing-wallet-id");
            expect(result).toBeInstanceOf(Boom);
        });

        it("should return 404 when wallet isn't delegate", () => {
            walletSearchService.getWallet.mockReturnValue(voterWalletResource);
            delegateSearchService.getDelegate.mockReturnValueOnce(undefined);

            const delegatesController = container.resolve(DelegatesController);
            const result = delegatesController.show({
                params: {
                    id: "ATL9kyo71wjPPXqvGMUD89t5RazmQfQMc6",
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith("ATL9kyo71wjPPXqvGMUD89t5RazmQfQMc6");
            expect(delegateSearchService.getDelegate).toBeCalledWith(voterWalletResource.address);
            expect(result).toBeInstanceOf(Boom);
        });
    });

    describe("Voters", () => {
        it("should get delegate id from pathname and criteria from query and return voter wallets from WalletSearchService", () => {
            walletSearchService.getWallet.mockReturnValueOnce(delegateWalletResource);
            delegateSearchService.getDelegate.mockReturnValueOnce(delegateResource);

            const voterWalletsPage: Contracts.Search.ResultsPage<Resources.WalletResource> = {
                results: [voterWalletResource],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            };
            walletSearchService.getActiveWalletsPage.mockReturnValueOnce(voterWalletsPage);

            const delegatesController = container.resolve(DelegatesController);
            const result = delegatesController.voters({
                params: {
                    id: "biz_classic",
                },
                query: {
                    page: 1,
                    limit: 100,
                    orderBy: ["balance:desc", "address:asc"],
                    balance: { from: 300 },
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith("biz_classic");
            expect(delegateSearchService.getDelegate).toBeCalledWith(delegateWalletResource.address);

            expect(walletSearchService.getActiveWalletsPage).toBeCalledWith(
                { offset: 0, limit: 100 },
                ["balance:desc", "address:asc"],
                { balance: { from: 300 } },
                { attributes: { vote: delegateResource.publicKey } },
            );

            expect(result).toBe(voterWalletsPage);
        });

        it("should return 404 when wallet wasn't found", () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

            const delegatesController = container.resolve(DelegatesController);
            const result = delegatesController.voters({
                params: {
                    id: "non-existing-wallet-id",
                },
                query: {
                    page: 1,
                    limit: 100,
                    orderBy: ["balance:desc", "address:asc"],
                    balance: { from: 300 },
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith("non-existing-wallet-id");
            expect(result).toBeInstanceOf(Boom);
        });

        it("should return 404 when wallet isn't delegate", () => {
            walletSearchService.getWallet.mockReturnValueOnce(voterWalletResource);
            delegateSearchService.getDelegate.mockReturnValueOnce(undefined);

            const delegatesController = container.resolve(DelegatesController);
            const result = delegatesController.voters({
                params: {
                    id: "ATL9kyo71wjPPXqvGMUD89t5RazmQfQMc6",
                },
                query: {
                    page: 1,
                    limit: 100,
                    orderBy: ["balance:desc", "address:asc"],
                    balance: { from: 300 },
                },
            });

            expect(walletSearchService.getWallet).toBeCalledWith("ATL9kyo71wjPPXqvGMUD89t5RazmQfQMc6");
            expect(delegateSearchService.getDelegate).toBeCalledWith(voterWalletResource.address);
            expect(result).toBeInstanceOf(Boom);
        });
    });

    describe("Blocks", () => {
        it("should take delegate id from pathname and return raw blocks from BlockHistoryService", async () => {
            const block1 = {} as any;

            walletSearchService.getWallet.mockReturnValueOnce(delegateWalletResource);
            delegateSearchService.getDelegate.mockReturnValueOnce(delegateResource);

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                raw(resource) {
                    return resource;
                },
            });

            blockHistoryService.listByCriteria.mockResolvedValueOnce({
                results: [block1],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const delegatesController = container.resolve(DelegatesController);
            const result = await delegatesController.blocks(
                {
                    params: {
                        id: "biz_classic",
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "height:desc",
                        transform: false,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith("biz_classic");
            expect(delegateSearchService.getDelegate).toBeCalledWith(delegateWalletResource.address);

            expect(blockHistoryService.listByCriteria).toBeCalledWith(
                { generatorPublicKey: delegateResource.publicKey },
                [{ direction: "desc", property: "height" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                totalCount: 1,
                results: [block1],
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should take delegate id from pathname and return transformed blocks from BlockHistoryService", async () => {
            const block1 = {} as any;

            walletSearchService.getWallet.mockReturnValueOnce(delegateWalletResource);
            delegateSearchService.getDelegate.mockReturnValueOnce(delegateResource);

            apiConfiguration.getOptional.mockReturnValueOnce(true);

            app.resolve.mockReturnValue({
                transform(resource) {
                    return resource.data;
                },
            });

            blockHistoryService.listByCriteriaJoinTransactions.mockResolvedValueOnce({
                results: [{ data: block1, transactions: [] }],
                totalCount: 1,
                meta: { totalCountIsEstimate: true },
            });

            const delegatesController = container.resolve(DelegatesController);
            const result = await delegatesController.blocks(
                {
                    params: {
                        id: "biz_classic",
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "height:desc",
                        transform: true,
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith("biz_classic");
            expect(delegateSearchService.getDelegate).toBeCalledWith(delegateWalletResource.address);

            expect(blockHistoryService.listByCriteriaJoinTransactions).toBeCalledWith(
                { generatorPublicKey: delegateResource.publicKey },
                { typeGroup: Enums.TransactionTypeGroup.Core, type: Enums.TransactionType.MultiPayment },
                [{ direction: "desc", property: "height" }],
                { limit: 100, offset: 0 },
                { estimateTotalCount: true },
            );

            expect(result).toEqual({
                totalCount: 1,
                results: [block1],
                meta: { totalCountIsEstimate: true },
            });
        });

        it("should return 404 when wallet wasn't found", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

            const delegatesController = container.resolve(DelegatesController);
            const result = await delegatesController.blocks(
                {
                    params: {
                        id: "non-existing-wallet-id",
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "height:desc",
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith("non-existing-wallet-id");
            expect(result).toBeInstanceOf(Boom);
        });

        it("should return 404 when wallet isn't delegate", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(voterWalletResource);
            delegateSearchService.getDelegate.mockReturnValueOnce(undefined);

            const delegatesController = container.resolve(DelegatesController);
            const result = await delegatesController.blocks(
                {
                    params: {
                        id: "ATL9kyo71wjPPXqvGMUD89t5RazmQfQMc6",
                    },
                    query: {
                        page: 1,
                        limit: 100,
                        orderBy: "height:desc",
                    },
                },
                undefined,
            );

            expect(walletSearchService.getWallet).toBeCalledWith("ATL9kyo71wjPPXqvGMUD89t5RazmQfQMc6");
            expect(delegateSearchService.getDelegate).toBeCalledWith(voterWalletResource.address);
            expect(result).toBeInstanceOf(Boom);
        });
    });
});
