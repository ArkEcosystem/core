/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/expect-expect */
import "jest-extended";

import { Services } from "@packages/core-kernel";
import { Container, Contracts } from "@packages/core-kernel/src";
import {
    bridgechainIndexer,
    businessIndexer,
    MagistrateIndex,
} from "@packages/core-magistrate-transactions/src/wallet-indexes";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Wallet, WalletRepository } from "@packages/core-state/src/wallets";
import {
    addressesIndexer,
    ipfsIndexer,
    locksIndexer,
    publicKeysIndexer,
    resignationsIndexer,
    usernamesIndexer,
} from "@packages/core-state/src/wallets/indexers/indexers";
import { Utils } from "@packages/crypto/src";

import { FixtureGenerator } from "../__utils__/fixture-generator";
import { setUp } from "../setup";

let walletRepo: WalletRepository;
let genesisBlock;
let stateStorage: StateStore;
let fixtureGenerator: FixtureGenerator;
let attributeSet: Services.Attributes.AttributeSet;

beforeAll(async () => {
    const initialEnv = await setUp();

    initialEnv.sandbox.app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({
            name: MagistrateIndex.Businesses,
            indexer: businessIndexer,
        });

    initialEnv.sandbox.app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({
            name: MagistrateIndex.Bridgechains,
            indexer: bridgechainIndexer,
        });

    // TODO: why does this have to be rebound here?
    initialEnv.sandbox.app.rebind(Container.Identifiers.WalletRepository).to(WalletRepository);
    walletRepo = initialEnv.sandbox.app.getTagged(Container.Identifiers.WalletRepository, "state", "blockchain");

    const cryptoConfig: any = initialEnv.sandbox.app
        .get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository)
        .get("crypto");

    genesisBlock = cryptoConfig.genesisBlock;
    stateStorage = initialEnv.stateStore;

    attributeSet = initialEnv.sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes);

    fixtureGenerator = new FixtureGenerator(genesisBlock, attributeSet);
});

beforeEach(() => {
    walletRepo.reset();
});

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe("Wallet Repository", () => {
    it("should throw if indexers are already registered", () => {
        expect(() => walletRepo.initialize()).toThrow("The wallet index is already registered: addresses");
    });

    it("should create a wallet", () => {
        const wallet = walletRepo.createWallet("abcd");
        expect(wallet.address).toEqual("abcd");
        expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should be able to look up indexers", () => {
        const expected = [
            "addresses",
            "publicKeys",
            "usernames",
            "resignations",
            "locks",
            "ipfs",
            "businesses",
            "bridgechains",
        ];
        expect(walletRepo.getIndexNames()).toEqual(expected);
        expect(walletRepo.getIndex("addresses").indexer).toEqual(addressesIndexer);
        expect(walletRepo.getIndex("publicKeys").indexer).toEqual(publicKeysIndexer);
        expect(walletRepo.getIndex("usernames").indexer).toEqual(usernamesIndexer);
        expect(walletRepo.getIndex("resignations").indexer).toEqual(resignationsIndexer);
        expect(walletRepo.getIndex("locks").indexer).toEqual(locksIndexer);
        expect(walletRepo.getIndex("ipfs").indexer).toEqual(ipfsIndexer);
        expect(() => walletRepo.getIndex("iDontExist")).toThrow();
    });

    describe("findByScope", () => {
        it("should throw if no wallet exists", () => {
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Wallets, "1")).toThrowError(
                `Wallet 1 doesn't exist in indexes`,
            );
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Delegates, "1")).toThrowError(
                `Wallet 1 doesn't exist in indexes`,
            );
        });

        // TODO: is this expected behaviour that you cannot search by these scopes
        it("should throw when looking up via locks scope", () => {
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Locks, "1")).toThrowError(
                `Unknown scope ${Contracts.State.SearchScope.Locks}`,
            );
        });

        it("should throw when looking up via an unknown search scope", () => {
            expect(() => walletRepo.findByScope("doesNotExist" as any, "1")).toThrowError(`Unknown scope doesNotExist`);
        });

        it("should retrieve existing wallet when searching Wallet Scope", () => {
            const wallet = walletRepo.createWallet("abcd");
            walletRepo.index(wallet);

            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).not.toThrow();
            expect(walletRepo.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).toEqual(wallet);
        });

        it("should retrieve existing wallet when searching Delegate Scope", () => {
            const wallet = walletRepo.createWallet("abcd");
            walletRepo.index(wallet);

            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toThrowError(
                `Wallet abcd isn't delegate`,
            );

            wallet.setAttribute("delegate", true);
            expect(walletRepo.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toEqual(wallet);
        });
    });

    it("indexing should keep indexers in sync", () => {
        const address = "ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp";
        const wallet = walletRepo.createWallet(address);
        const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        wallet.publicKey = publicKey;

        expect(walletRepo.findByAddress(address)).not.toEqual(wallet);
        walletRepo.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepo.findByPublicKey(publicKey).publicKey).toBeDefined();
        expect(walletRepo.findByPublicKey(publicKey)).toEqual(wallet);

        expect(walletRepo.findByAddress(address).publicKey).toBeUndefined();
        expect(walletRepo.findByAddress(address)).not.toEqual(wallet);

        walletRepo.index(wallet);

        expect(walletRepo.findByAddress(address).publicKey).toBe(publicKey);
        expect(walletRepo.findByAddress(address)).toEqual(wallet);
    });

    it("should get and set wallets by address", () => {
        const address = "abcd";
        const wallet = walletRepo.createWallet(address);

        /**
         * TODO: check this is desired behaviour
         * after creation a wallet is unknown to indexers (until index() is called)
         */
        expect(walletRepo.has(address)).toBeFalse();

        /**
         * TODO: check this is desired behaviour
         * findByAddress and findByPublicKey have the effect of indexing (so the previous check now passes)
         * findByUsername does not have this side-effect, so they should probably have different names.
         */
        expect(walletRepo.findByAddress(address)).toEqual(wallet);
        expect(walletRepo.has(address)).toBeTrue();

        expect(walletRepo.findByIndex("addresses", address)).toEqual(wallet);
        const nonExistingAddress = "abcde";
        expect(walletRepo.has(address)).toBeTrue();
        expect(walletRepo.has(nonExistingAddress)).toBeFalse();
        expect(walletRepo.hasByAddress(address)).toBeTrue();
        expect(walletRepo.hasByAddress(nonExistingAddress)).toBeFalse();
        expect(walletRepo.hasByIndex("addresses", address)).toBeTrue();
        expect(walletRepo.hasByIndex("addresses", nonExistingAddress)).toBeFalse();
        expect(walletRepo.allByAddress()).toEqual([wallet]);
    });

    /**
     * TODO: Check this is desired behaviour.
     * findByUsername (and corresponding findByIndex/findByIndexes) methods throw if it doesn't exist,
     * where as findByAddress and findByPublicKey can be used for wallet creation.
     */
    it("should create a wallet if one is not found during address lookup", () => {
        expect(() => walletRepo.findByAddress("hello")).not.toThrow();
        expect(walletRepo.findByAddress("iDontExist")).toBeInstanceOf(Wallet);
        expect(walletRepo.has("hello")).toBeTrue();
        expect(walletRepo.hasByAddress("iDontExist")).toBeTrue();
        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing address by findByAddress creates a wallet.
         * However looking up a non-existing address using findByIndex() does not.
         */
        const errorMessage = "Wallet iAlsoDontExist doesn't exist in index addresses";
        expect(() => walletRepo.findByIndex("addresses", "iAlsoDontExist")).toThrow(errorMessage);
    });

    it("should get and set wallets by public key", () => {
        const wallet = walletRepo.createWallet("abcde");
        const publicKey = "02337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        walletRepo.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepo.findByPublicKey(publicKey)).toEqual(wallet);
        expect(walletRepo.findByIndex("publicKeys", publicKey)).toEqual(wallet);

        const nonExistingPublicKey = "98727416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";

        expect(walletRepo.has(publicKey)).toBeTrue();
        expect(walletRepo.has(nonExistingPublicKey)).toBeFalse();
        expect(walletRepo.hasByPublicKey(publicKey)).toBeTrue();
        expect(walletRepo.hasByPublicKey(nonExistingPublicKey)).toBeFalse();
        expect(walletRepo.hasByIndex("publicKeys", publicKey)).toBeTrue();
        expect(walletRepo.hasByIndex("publicKeys", nonExistingPublicKey)).toBeFalse();
        expect(walletRepo.allByPublicKey()).toEqual([wallet]);
    });

    it("should create a wallet if one is not found during public key lookup", () => {
        const firstNotYetExistingPublicKey = "0235d486fea0193cbe77e955ab175b8f6eb9eaf784de689beffbd649989f5d6be3";
        expect(() => walletRepo.findByPublicKey(firstNotYetExistingPublicKey)).not.toThrow();
        expect(walletRepo.findByPublicKey(firstNotYetExistingPublicKey)).toBeInstanceOf(Wallet);

        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing publicKey by findByPublicKey creates a wallet.
         * However looking up a non-existing publicKey using findByIndex() does not.
         */
        const secondNotYetExistingPublicKey = "03a46f2547d20b47003c1c376788db5a54d67264df2ae914f70bf453b6a1fa1b3a";
        expect(() => walletRepo.findByIndex("publicKeys", secondNotYetExistingPublicKey)).toThrow();
    });

    it("should get and set wallets by username", () => {
        const username = "testUsername";
        const wallet = walletRepo.createWallet("abcdef");
        /**
         * TODO: check this is desired behaviour
         * A username hasn't been set on the wallet here, it's been set on the indexer.
         * It means it's possible to look up a wallet by a username which is set on the WalletIndex and not the Wallet itself - this should probably throw.
         */
        walletRepo.getIndex("usernames").set(username, wallet);
        expect(walletRepo.findByUsername(username)).toEqual(wallet);
        expect(walletRepo.findByIndex("usernames", username)).toEqual(wallet);

        const nonExistingUsername = "iDontExistAgain";
        expect(walletRepo.has(username)).toBeTrue();
        expect(walletRepo.has(nonExistingUsername)).toBeFalse();
        expect(walletRepo.hasByUsername(username)).toBeTrue();
        expect(walletRepo.hasByUsername(nonExistingUsername)).toBeFalse();
        expect(walletRepo.hasByIndex("usernames", username)).toBeTrue();
        expect(walletRepo.hasByIndex("usernames", nonExistingUsername)).toBeFalse();
        expect(walletRepo.allByUsername()).toEqual([wallet]);
    });

    it("should be able to index forgotten wallets", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        walletRepo.index(wallet1);
        expect(walletRepo.has("wallet1")).toBeTrue();
        walletRepo.index(wallet1);
        expect(walletRepo.has("wallet1")).toBeTrue();
    });

    it("should do nothing if forgotten wallet does not exist", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        walletRepo.index(wallet1);
        wallet1.publicKey = undefined;
        expect(walletRepo.has("wallet2")).toBeFalse();
    });

    it("should index array of wallets using different indexers", () => {
        const wallets: Contracts.State.Wallet[] = [];
        const walletAddresses: string[] = [];
        for (let i = 0; i < 6; i++) {
            const walletAddress = `wallet${i}`;
            walletAddresses.push(walletAddress);
            const wallet = walletRepo.createWallet(walletAddress);
            wallets.push(wallet);
        }

        walletRepo.index(wallets);

        walletAddresses.forEach((address) => expect(walletRepo.has(address)).toBeTrue());

        const publicKey = "02511f16ffb7b7e9afc12f04f317a11d9644e4be9eb5a5f64673946ad0f6336f34";

        walletRepo.getIndex("publicKeys").set(publicKey, wallets[1]);
        walletRepo.getIndex("usernames").set("username", wallets[2]);
        walletRepo.getIndex("resignations").set("resign", wallets[3]);
        walletRepo.getIndex("locks").set("lock", wallets[4]);
        walletRepo.getIndex("ipfs").set("ipfs", wallets[5]);

        wallets.forEach((wallet) => walletRepo.index(wallet));

        walletAddresses.forEach((address) => expect(walletRepo.has(address)).toBeTrue());
    });

    it("should get the nonce of a wallet", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        wallet1.nonce = Utils.BigNumber.make(100);
        wallet1.publicKey = "02511f16ffb7b7e9afc12f04f317a11d9644e4be9eb5a5f64673946ad0f6336f34";
        walletRepo.index(wallet1);

        expect(walletRepo.getNonce(wallet1.publicKey)).toEqual(Utils.BigNumber.make(100));
    });

    it("should return 0 nonce if there is no wallet", () => {
        const publicKey = "03c075494ad044ab8c0b2dc7ccd19f649db844a4e558e539d3ac2610c4b90a5139";
        expect(walletRepo.getNonce(publicKey)).toEqual(Utils.BigNumber.ZERO);
    });

    it("should throw when looking up a username which doesn't exist", () => {
        expect(() => walletRepo.findByUsername("iDontExist")).toThrowError(
            "Wallet iDontExist doesn't exist in index usernames",
        );
        expect(() => walletRepo.findByIndex("usernames", "iDontExist")).toThrowError(
            "Wallet iDontExist doesn't exist in index usernames",
        );
    });
});

describe("Search", () => {
    const searchWalletsByParams = (params?: any) => walletRepo.search(Contracts.State.SearchScope.Wallets, params);

    const searchRepository = searchWalletsByParams;

    describe("wallets", () => {
        const expectSearch = (params, rows = 1, count = 1) => {
            const wallets = searchRepository(params);
            expect(wallets).toBeObject();

            expect(wallets).toHaveProperty("count");
            expect(wallets.count).toBeNumber();
            expect(wallets.count).toBe(count);

            expect(wallets).toHaveProperty("rows");
            expect(wallets.rows).toBeArray();
            expect(wallets.rows).not.toBeEmpty();

            expect(wallets.count).toBe(rows);
        };

        it("should return the local wallets of the connection", () => {
            const spyAllByAddress = jest.spyOn(walletRepo, "allByAddress");
            spyAllByAddress.mockReturnValueOnce([]);

            searchRepository({});

            expect(spyAllByAddress).toHaveBeenCalled();
            spyAllByAddress.mockClear();
        });

        it("should be ok with empty params", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const { count, rows } = searchRepository();
            expect(count).toBe(52);
            expect(rows).toHaveLength(52);
        });

        it("should be ok with params", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const { count, rows } = searchRepository({ offset: 10, limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (no offset)", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const { count, rows } = searchRepository({ limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const { count, rows } = searchRepository({ offset: 0, limit: 12 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(12);
        });

        it("should be ok with params (no limit)", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const { count, rows } = searchRepository({ offset: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(42);
        });

        it("should search wallets by the specified address", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            expectSearch({ address: wallets[0].address });
        });

        it("should search wallets by several addresses", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const addresses = [wallets[1].address, wallets[3].address, wallets[9].address];
            expectSearch({ addresses }, 3, 3);
        });

        describe("when searching by `address` and `addresses`", () => {
            it("should search wallets only by `address`", () => {
                const wallets = fixtureGenerator.generateFullWallets();
                walletRepo.index(wallets);

                const { address } = wallets[0];
                const addresses = [wallets[1].address, wallets[3].address, wallets[9].address];
                expectSearch({ address, addresses }, 1, 1);
            });
        });

        it("should search wallets by the specified publicKey", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            expectSearch({ publicKey: wallets[0].publicKey });
        });

        it("should search wallets by the specified secondPublicKey", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            expectSearch({ secondPublicKey: wallets[0].getAttribute("secondPublicKey") });
        });

        it("should search wallets by the specified vote", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            expectSearch({ vote: wallets[0].getAttribute("vote") });
        });

        it("should search wallets by the specified username", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            expectSearch({ username: wallets[0].getAttribute("delegate.username") });
        });

        it("should search wallets by the specified closed inverval (included) of balance", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                if (i < 13) {
                    wallet.balance = Utils.BigNumber.make(53);
                } else if (i < 36) {
                    wallet.balance = Utils.BigNumber.make(99);
                }
            }
            walletRepo.index(wallets);

            expectSearch(
                {
                    balance: {
                        from: 53,
                        to: 99,
                    },
                },
                36,
                36,
            );
        });

        it("should search wallets by the specified closed interval (included) of voteBalance", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                if (i < 17) {
                    wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(12));
                } else if (i < 29) {
                    wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(17));
                }
            }
            walletRepo.index(wallets);

            expectSearch(
                {
                    voteBalance: {
                        from: 11,
                        to: 18,
                    },
                },
                29,
                29,
            );
        });

        it("should return all locks", () => {
            genesisBlock.data = {
                timestamp: 0,
            };
            const wallets = fixtureGenerator.generateHtlcLocks();
            walletRepo.index(wallets);

            const spyStateStore = jest.spyOn(stateStorage, "getLastBlock");
            // @ts-ignore
            spyStateStore.mockReturnValue(genesisBlock);

            const locks = walletRepo.search(Contracts.State.SearchScope.Locks, {});
            expect(wallets.length).toEqual(52);
            expect(locks.rows).toHaveLength(102); // First wallet have 50 locks
        });

        it("should return all locks with amount params", () => {
            genesisBlock.data = {
                timestamp: 0,
            };
            const wallets = fixtureGenerator.generateHtlcLocks();
            walletRepo.index(wallets);

            const spyStateStore = jest.spyOn(stateStorage, "getLastBlock");
            // @ts-ignore
            spyStateStore.mockReturnValue(genesisBlock);

            const locks = walletRepo.search(Contracts.State.SearchScope.Locks, { amount: "" });
            expect(wallets.length).toEqual(52);
            expect(locks.rows).toHaveLength(102); // First wallet have 50 locks
        });

        it("should return only wallets which have correct lock ids", () => {
            genesisBlock.data = {
                timestamp: 0,
            };
            const wallets = fixtureGenerator.generateHtlcLocks();
            walletRepo.index(wallets);
            wallets[0].setAttribute("htlc.locks", {
                nothing: {},
            });

            const spyStateStore = jest.spyOn(stateStorage, "getLastBlock");
            // @ts-ignore
            spyStateStore.mockReturnValue(genesisBlock);

            const locks = walletRepo.search(Contracts.State.SearchScope.Locks, { amount: "" });
            expect(wallets.length).not.toEqual(0);
            expect(locks.rows).toHaveLength(wallets.length - 1);
        });

        it("should set attributes on wallet using manipulator", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            wallets[0].setAttribute("delegate", {
                username: `username-${wallets[0].address}`,
                voteBalance: Utils.BigNumber.make(200),
                forgedRewards: Utils.BigNumber.make(50),
                forgedFees: Utils.BigNumber.make(50),
                forgedTotal: Utils.BigNumber.make(50),
            });
            expect(wallets[0].getAttribute("delegate.forgedTotal")).not.toEqual(Utils.BigNumber.make(100));

            walletRepo.index(wallets);
            const searchResult = walletRepo.search(Contracts.State.SearchScope.Delegates, {
                forgedTotal: {
                    from: Utils.BigNumber.make(100),
                },
            });

            expect(wallets[0].getAttribute("delegate.forgedTotal")).not.toEqual(Utils.BigNumber.make(100));
            expect(searchResult.rows).toEqual([wallets[0]]);
        });
    });

    describe("Delegates", () => {
        it("should search return all delegates", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            for (let i = 0; i < wallets.length; i++) {
                wallets[i].setAttribute("delegate.rank", i + 1);
            }
            wallets.sort(() => Math.floor(Math.random() * 3) - 1);
            walletRepo.index(wallets);

            const delegates = walletRepo.search(Contracts.State.SearchScope.Delegates, {});

            expect(wallets.length).not.toEqual(0);
            expect(delegates.rows).toHaveLength(wallets.length);

            for (let i = 1; i < delegates.rows.length; i++) {
                const next: Contracts.State.Wallet = delegates.rows[i] as any;
                const prev: Contracts.State.Wallet = delegates.rows[i - 1] as any;

                const nextRank = next.getAttribute<number>("delegate.rank");
                const prevRank = prev.getAttribute<number>("delegate.rank");

                expect(nextRank).toBeGreaterThan(prevRank);
            }
        });

        it("should search by address", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const delegates = walletRepo.search(Contracts.State.SearchScope.Delegates, {
                address: wallets[0].address,
            });

            expect(wallets.length).not.toEqual(0);
            expect(delegates.count).toEqual(1);
            expect(delegates.rows).toEqual([wallets[0]]);
        });

        it("should search by username", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            wallets[0].setAttribute("delegate.username", "test");
            walletRepo.index(wallets);

            const delegates = walletRepo.search(Contracts.State.SearchScope.Delegates, {
                usernames: ["test"],
            });

            expect(wallets.length).not.toEqual(0);
            expect(delegates.count).toEqual(1);
            expect(delegates.rows).toEqual([wallets[0]]);
        });

        it("should search for resigned delegates", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            wallets[0].setAttribute("delegate.resigned", true);
            walletRepo.index(wallets);

            const delegates = walletRepo.search(Contracts.State.SearchScope.Delegates, {
                type: "resigned",
            });

            expect(wallets.length).not.toEqual(0);
            expect(delegates.count).toEqual(1);
            expect(delegates.rows).toEqual([wallets[0]]);
        });

        it("should search for delegates who have never forged", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            for (const wallet of wallets) {
                wallet.setAttribute("delegate.producedBlocks", 1);
            }
            wallets[0].setAttribute("delegate.producedBlocks", 0);
            walletRepo.index(wallets);
            const delegates = walletRepo.search(Contracts.State.SearchScope.Delegates, {
                type: "never-forged",
            });

            expect(wallets.length).not.toEqual(0);
            expect(delegates.count).toEqual(1);
            expect(delegates.rows).toEqual([wallets[0]]);
        });
    });

    describe("findAllByVote", () => {
        const vote = "dummy-sender-public-key";

        const findAllByVote = (vote: string, params: any = {}) => {
            return searchRepository({ ...params, ...{ vote } });
        };

        beforeEach(() => {
            const wallets = fixtureGenerator.generateVotes();
            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                if (i < 17) {
                    wallet.setAttribute("vote", vote);
                }

                wallet.balance = Utils.BigNumber.make(0);
            }
            walletRepo.index(wallets);
        });

        it("should be ok without params", () => {
            const { count, rows } = findAllByVote(vote);
            expect(count).toBe(17);
            expect(rows).toHaveLength(17);
        });

        it("should be ok with params", () => {
            const { count, rows } = findAllByVote(vote, {
                offset: 10,
                limit: 10,
            });
            expect(count).toBe(17);
            expect(rows).toHaveLength(7);
        });

        it("should be ok with params (no offset)", () => {
            const { count, rows } = findAllByVote(vote, { limit: 10 });
            expect(count).toBe(17);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const { count, rows } = findAllByVote(vote, {
                offset: 0,
                limit: 1,
            });
            expect(count).toBe(17);
            expect(rows).toHaveLength(1);
        });

        it("should be ok with params (no limit)", () => {
            const { count, rows } = findAllByVote(vote, { offset: 30 });
            expect(count).toBe(17);
            expect(rows).toHaveLength(0);
        });
    });

    describe("count", () => {
        it("should be ok", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            expect(walletRepo.count(Contracts.State.SearchScope.Wallets)).toBe(52);
        });
    });

    describe("top", () => {
        const top = (params: any = {}) => {
            return walletRepo.top(Contracts.State.SearchScope.Wallets, params);
        };

        beforeEach(() => {
            for (const o of [
                { address: "dummy-1", balance: Utils.BigNumber.make(1000) },
                { address: "dummy-2", balance: Utils.BigNumber.make(2000) },
                { address: "dummy-3", balance: Utils.BigNumber.make(3000) },
            ]) {
                const wallet = new Wallet(o.address, new Services.Attributes.AttributeMap(attributeSet));
                wallet.balance = o.balance;
                walletRepo.index(wallet);
            }
        });

        it("should be ok without params", () => {
            const { count, rows } = walletRepo.top(Contracts.State.SearchScope.Wallets);

            expect(count).toBe(3);
            expect(rows.length).toBe(3);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(3000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(2000));
            expect(rows[2].balance).toEqual(Utils.BigNumber.make(1000));
        });

        it("should be ok with params", () => {
            const { count, rows } = top({ offset: 1, limit: 2 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(2000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(1000));
        });

        it("should be ok with params (offset = 0)", () => {
            const { count, rows } = top({ offset: 0, limit: 2 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(3000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(2000));
        });

        it("should be ok with params (no offset)", () => {
            const { count, rows } = top({ limit: 2 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(3000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(2000));
        });

        it("should be ok with params (no limit)", () => {
            const { count, rows } = top({ offset: 1 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(2000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(1000));
        });
    });
});

describe("Delegate Wallets", () => {
    describe("search", () => {
        const delegates = [
            { username: "delegate-0", forgedFees: Utils.BigNumber.make(10), forgedRewards: Utils.BigNumber.make(10) },
            { username: "delegate-1", forgedFees: Utils.BigNumber.make(20), forgedRewards: Utils.BigNumber.make(20) },
            { username: "delegate-2", forgedFees: Utils.BigNumber.make(30), forgedRewards: Utils.BigNumber.make(30) },
        ];

        const search = (params = {}): Contracts.Search.ListResult<Wallet> => {
            return walletRepo.search(Contracts.State.SearchScope.Delegates, params);
        };

        beforeEach(() => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);
        });

        it("should return the local wallets of the connection that are delegates", () => {
            const wallets = [delegates[0], {}, delegates[1], { username: "" }, delegates[2], {}].map((delegate) => {
                const wallet = new Wallet("", new Services.Attributes.AttributeMap(attributeSet));
                wallet.setAttribute("delegate", delegate);
                return wallet;
            });

            jest.spyOn(walletRepo, "allByUsername").mockReturnValue(wallets);

            const { rows } = search();

            expect(rows).toEqual(expect.arrayContaining(wallets));
            expect(walletRepo.allByUsername).toHaveBeenCalled();
        });

        it("should be ok without params", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            for (const wallet of wallets) {
                wallet.setAttribute("delegate.rank", 0);
            }

            const { count, rows } = search({});
            expect(count).toBe(52);
            expect(rows).toHaveLength(52);
            expect(
                (rows as any).sort((a, b) => a.getAttribute("delegate.rank") < b.getAttribute("delegate.rank")),
            ).toEqual(rows);
        });

        it("should be ok with params", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const { count, rows } = search({ offset: 10, limit: 10, orderBy: "rate:desc" });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
            expect((rows as any).sort((a, b) => a.rate > b.rate)).toEqual(rows);
        });

        it("should be ok with params (no offset)", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const { count, rows } = search({ limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const { count, rows } = search({ offset: 0, limit: 12 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(12);
        });

        it("should be ok with params (no limit)", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const { count, rows } = search({ offset: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(42);
        });

        describe("by `username`", () => {
            it("should search by exact match", () => {
                const username = "username-AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD";
                const { count, rows } = search({ username });

                expect(count).toBe(1);
                expect(rows).toHaveLength(1);
                expect(rows[0].getAttribute("delegate.username")).toEqual(username);
            });

            it("should search that username contains the string", () => {
                const { count, rows } = search({ username: "username" });

                expect(count).toBe(52);
                expect(rows).toHaveLength(52);
            });

            describe('when a username is "undefined"', () => {
                it("should return it", () => {
                    // Index a wallet with username "undefined"
                    walletRepo.allByAddress()[0].setAttribute("delegate", { username: "undefined" });

                    const username = "undefined";
                    const { count, rows } = search({ username });

                    expect(count).toBe(1);
                    expect(rows).toHaveLength(1);
                    expect(rows[0].getAttribute("delegate.username")).toEqual(username);
                });
            });

            describe("when the username does not exist", () => {
                it("should return no results", () => {
                    const { count, rows } = search({
                        username: "unknown-dummy-username",
                    });

                    expect(count).toBe(0);
                    expect(rows).toHaveLength(0);
                });
            });

            it("should be ok with params", () => {
                const { count, rows } = search({
                    username: "username",
                    offset: 10,
                    limit: 10,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(10);
            });

            it("should be ok with params (no offset)", () => {
                const { count, rows } = search({
                    username: "username",
                    limit: 10,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(10);
            });

            it("should be ok with params (offset = 0)", () => {
                const { count, rows } = search({
                    username: "username",
                    offset: 0,
                    limit: 12,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(12);
            });

            it("should be ok with params (no limit)", () => {
                const { count, rows } = search({
                    username: "username",
                    offset: 10,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(42);
            });
        });

        describe("by `usernames`", () => {
            it("should search by exact match", () => {
                const usernames = [
                    "username-AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
                    "username-APRiwbs17FdbaF8DYU9js2jChRehQc2e6P",
                    "username-AReCSCQRssLGF4XyhTjxhQm6mBFAWTaDTz",
                ];
                const { count, rows } = search({ usernames });

                expect(count).toBe(3);
                expect(rows).toHaveLength(3);

                for (const row of rows) {
                    expect(usernames.includes(row.getAttribute("delegate.username"))).toBeTrue();
                }
            });

            describe('when a username is "undefined"', () => {
                it("should return it", () => {
                    // Index a wallet with username "undefined"
                    walletRepo.allByAddress()[0].setAttribute("delegate", { username: "undefined" });

                    const usernames = ["undefined"];
                    const { count, rows } = search({ usernames });

                    expect(count).toBe(1);
                    expect(rows).toHaveLength(1);
                    expect(rows[0].getAttribute("delegate.username")).toEqual(usernames[0]);
                });
            });

            describe("when the username does not exist", () => {
                it("should return no results", () => {
                    const { count, rows } = search({
                        usernames: ["unknown-dummy-username"],
                    });

                    expect(count).toBe(0);
                    expect(rows).toHaveLength(0);
                });
            });

            it("should be ok with params", () => {
                const { count, rows } = search({
                    usernames: [
                        "username-AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
                        "username-APRiwbs17FdbaF8DYU9js2jChRehQc2e6P",
                    ],
                    offset: 1,
                    limit: 10,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(1);
            });

            it("should be ok with params (no offset)", () => {
                const { count, rows } = search({
                    usernames: [
                        "username-AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
                        "username-APRiwbs17FdbaF8DYU9js2jChRehQc2e6P",
                    ],
                    limit: 1,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(1);
            });

            it("should be ok with params (offset = 0)", () => {
                const { count, rows } = search({
                    usernames: [
                        "username-AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
                        "username-APRiwbs17FdbaF8DYU9js2jChRehQc2e6P",
                    ],
                    offset: 0,
                    limit: 2,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(2);
            });

            it("should be ok with params (no limit)", () => {
                const { count, rows } = search({
                    usernames: [
                        "username-AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
                        "username-APRiwbs17FdbaF8DYU9js2jChRehQc2e6P",
                    ],
                    offset: 1,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(1);
            });
        });

        describe("when searching by `username` and `usernames`", () => {
            it("should search delegates only by `username`", () => {
                const username = "username-AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD";
                const usernames = [
                    "username-APRiwbs17FdbaF8DYU9js2jChRehQc2e6P",
                    "username-AReCSCQRssLGF4XyhTjxhQm6mBFAWTaDTz",
                ];

                const { count, rows } = search({ username, usernames });

                expect(count).toBe(1);
                expect(rows).toHaveLength(1);
            });
        });

        describe("when searching without params", () => {
            it("should return all results", () => {
                const { count, rows } = search({});

                expect(count).toBe(52);
                expect(rows).toHaveLength(52);
            });

            describe('when a username is "undefined"', () => {
                it("should return all results", () => {
                    // Index a wallet with username "undefined"
                    walletRepo.allByAddress()[0].setAttribute("delegate", { username: "undefined" });

                    const { count, rows } = search({});
                    expect(count).toBe(52);
                    expect(rows).toHaveLength(52);
                });
            });
        });
    });
});
