import { LockSearchService, Resources, WalletSearchService } from "@arkecosystem/core-api";
import { WalletsController } from "@arkecosystem/core-api/src/controllers/wallets";
import { Identifiers } from "@arkecosystem/core-api/src/identifiers";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

const jestfn = <T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>,
) => {
    return jest.fn(implementation);
};

const walletSearchService = {
    getWallet: jestfn<WalletSearchService["getWallet"]>(),
    getWalletsPage: jestfn<WalletSearchService["getWalletsPage"]>(),
};

const lockSearchService = {
    getWalletLocksPage: jestfn<LockSearchService["getWalletLocksPage"]>(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(null);
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(null);
container.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(null);
container.bind(Identifiers.WalletSearchService).toConstantValue(walletSearchService);
container.bind(Identifiers.LockSearchService).toConstantValue(lockSearchService);

beforeEach(() => {
    jest.resetAllMocks();
});

const walletResource1 = {
    address: "ATrkBiUXGDKduaSjqez2Ar7T9rQW6cnaeu",
    publicKey: "03c6e98f9aff65c517c824c9b21b6e1bc053a19f81d95d4f76426b1f5e651e64db",
    balance: Utils.BigNumber.make("31477465932829"),
    nonce: Utils.BigNumber.make("5"),
    attributes: {
        vote: "0305147df6c772248ffc57d7ebc1c4294f03b6b5a27ebc6e1a09825e4ee5fb786f",
    },
};

describe("WalletsController.index", () => {
    it("should get criteria from query and return wallets page from WalletSearchService", () => {
        const walletsPage: Contracts.Search.Page<Resources.WalletResource> = {
            totalCount: 1,
            meta: { totalCountIsEstimate: false },
            results: [walletResource1],
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

describe("WalletsController.top", () => {
    // it is exact duplicate of WalletsController.index

    it("should get criteria from query and return wallets page from WalletSearchService", () => {
        const walletsPage: Contracts.Search.Page<Resources.WalletResource> = {
            totalCount: 1,
            meta: { totalCountIsEstimate: false },
            results: [walletResource1],
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

describe("WalletsController.search", () => {});
