import { WalletSearchService } from "@arkecosystem/core-api/src/services/wallet-search-service";
import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

const jestfn = <T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>,
) => {
    return jest.fn(implementation);
};

const walletRepository = {
    hasByAddress: jestfn<Contracts.State.WalletRepository["hasByAddress"]>(),
    findByAddress: jestfn<Contracts.State.WalletRepository["findByAddress"]>(),
    hasByPublicKey: jestfn<Contracts.State.WalletRepository["hasByPublicKey"]>(),
    findByPublicKey: jestfn<Contracts.State.WalletRepository["findByPublicKey"]>(),
    hasByUsername: jestfn<Contracts.State.WalletRepository["hasByUsername"]>(),
    findByUsername: jestfn<Contracts.State.WalletRepository["findByUsername"]>(),
    allByAddress: jest.fn(),
    allByPublicKey: jest.fn(),
};

const standardCriteriaService = {
    testStandardCriterias: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);
container.bind(Container.Identifiers.StandardCriteriaService).toConstantValue(standardCriteriaService);
container.bind(Container.Identifiers.PaginationService).to(Services.Search.PaginationService);
const walletSearchService = container.resolve(WalletSearchService);

beforeEach(() => {
    jest.resetAllMocks();
});

const wallet = {
    getAddress: () => {
        return "APTzMNCTPsDj6VcL8egi2weXJFgHGmCZGp";
    },
    getPublicKey: () => {
        return "028fe98e42e159f2450a52371dfb23ae69a39fc5fee6545690b7f51bfcee933357";
    },
    getBalance: () => {
        return Utils.BigNumber.make("5972178214140");
    },
    getNonce: () => {
        return Utils.BigNumber.make("1");
    },
    getAttributes: () => ({
        delegate: {
            username: "binance_staking",
            voteBalance: Utils.BigNumber.make("352045954555224"),
            forgedFees: Utils.BigNumber.make("13830924525"),
            forgedRewards: Utils.BigNumber.make("5947800000000"),
            producedBlocks: 29739,
            rank: 1,
            lastBlock: {
                version: 0,
                timestamp: 108954760,
                height: 13467897,
                previousBlockHex: "c872ff925814623f40a8d0979299017d084cca9e9a8ad8a9a1ae53f627fa43ee",
                previousBlock: "c872ff925814623f40a8d0979299017d084cca9e9a8ad8a9a1ae53f627fa43ee",
                numberOfTransactions: 0,
                totalAmount: Utils.BigNumber.make("0"),
                totalFee: Utils.BigNumber.make("0"),
                reward: Utils.BigNumber.make("200000000"),
                payloadLength: 0,
                payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                generatorPublicKey: "028fe98e42e159f2450a52371dfb23ae69a39fc5fee6545690b7f51bfcee933357",
                blockSignature:
                    "3044022058fcaaa7b3245521fb2c08d3a0bd45abf3143bbe22defe747564bc3815b59cca02203874227b83740cf2f51965b7e18573a02d8aa6de1180052062aba3c99d2c4260",
                idHex: "2ffb6ca0defd7ee0b258b55335b54198c4b18c138ff820138366267427d9ebe1",
                id: "2ffb6ca0defd7ee0b258b55335b54198c4b18c138ff820138366267427d9ebe1",
            },
            round: 264077,
        },
    }),
};

const walletResource = {
    address: wallet.getAddress(),
    publicKey: wallet.getPublicKey(),
    balance: wallet.getBalance(),
    nonce: wallet.getNonce(),
    attributes: wallet.getAttributes(),
};

describe("WalletSearchService", () => {
    describe("getWallet", () => {
        it("should return wallet resource by address", () => {
            walletRepository.hasByAddress.mockReturnValueOnce(true);
            walletRepository.findByAddress.mockReturnValueOnce(wallet as any);

            const result = walletSearchService.getWallet(wallet.getAddress());

            expect(walletRepository.hasByAddress).toBeCalledWith(wallet.getAddress());
            expect(walletRepository.findByAddress).toBeCalledWith(wallet.getAddress());
            expect(result).toEqual(walletResource);
        });

        it("should return wallet resource by public key", () => {
            walletRepository.hasByAddress.mockReturnValueOnce(false);
            walletRepository.hasByPublicKey.mockReturnValueOnce(true);
            walletRepository.findByPublicKey.mockReturnValueOnce(wallet as any);

            const result = walletSearchService.getWallet(wallet.getPublicKey());

            expect(walletRepository.hasByPublicKey).toBeCalledWith(wallet.getPublicKey());
            expect(walletRepository.findByPublicKey).toBeCalledWith(wallet.getPublicKey());
            expect(result).toEqual(walletResource);
        });

        it("should return wallet resource by delegate username", () => {
            walletRepository.hasByAddress.mockReturnValueOnce(false);
            walletRepository.hasByPublicKey.mockReturnValueOnce(false);
            walletRepository.hasByUsername.mockReturnValueOnce(true);
            walletRepository.findByUsername.mockReturnValueOnce(wallet as any);

            const result = walletSearchService.getWallet("binance_staking");

            expect(walletRepository.hasByUsername).toBeCalledWith("binance_staking");
            expect(walletRepository.findByUsername).toBeCalledWith("binance_staking");
            expect(result).toEqual(walletResource);
        });

        it("should return undefined when wallet does not exist", () => {
            walletRepository.hasByAddress.mockReturnValueOnce(false);
            walletRepository.hasByPublicKey.mockReturnValueOnce(false);
            walletRepository.hasByUsername.mockReturnValueOnce(false);

            const result = walletSearchService.getWallet("none");

            expect(result).toBe(undefined);
        });
    });

    describe("getWalletsPage", () => {
        it("should return wallets page with wallet on positive criteria tests", () => {
            walletRepository.allByAddress.mockReturnValue([wallet]);
            standardCriteriaService.testStandardCriterias.mockReturnValue(true);

            const result = walletSearchService.getWalletsPage(
                {
                    offset: 0,
                    limit: 100,
                },
                [],
                [],
            );

            expect(result.results).toEqual([walletResource]);
        });

        it("should return wallets page with empty array on negative criteria tests", () => {
            walletRepository.allByAddress.mockReturnValue([wallet]);
            standardCriteriaService.testStandardCriterias.mockReturnValue(false);

            const result = walletSearchService.getWalletsPage(
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

    describe("getActiveWalletsPage", () => {
        it("should return wallets page with wallet on positive criteria tests", () => {
            walletRepository.allByPublicKey.mockReturnValue([wallet]);
            standardCriteriaService.testStandardCriterias.mockReturnValue(true);

            const result = walletSearchService.getActiveWalletsPage(
                {
                    offset: 0,
                    limit: 100,
                },
                [],
                [],
            );

            expect(result.results).toEqual([walletResource]);
        });

        it("should return wallets page with empty array on negative criteria tests", () => {
            walletRepository.allByPublicKey.mockReturnValue([wallet]);
            standardCriteriaService.testStandardCriterias.mockReturnValue(false);

            const result = walletSearchService.getActiveWalletsPage(
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
});
