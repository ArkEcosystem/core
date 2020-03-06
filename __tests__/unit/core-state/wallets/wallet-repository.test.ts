/* eslint-disable jest/expect-expect */
import "jest-extended";

import { Services } from "@packages/core-kernel";
import { Container, Contracts } from "@packages/core-kernel/src";
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
    const cryptoConfig: any = initialEnv.sandbox.app
        .get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository)
        .get("crypto");

    genesisBlock = cryptoConfig.genesisBlock;
    walletRepo = initialEnv.walletRepo;
    stateStorage = initialEnv.stateStore;

    attributeSet = initialEnv.sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes);

    // TODO: pass attribute set from sandbox
    fixtureGenerator = new FixtureGenerator(genesisBlock, attributeSet);
});

beforeEach(() => {
    walletRepo.reset();
});

afterEach(() => jest.clearAllMocks());

describe("Wallet Repository", () => {
    it("should create a wallet", () => {
        const wallet = walletRepo.createWallet("abcd");
        expect(wallet.address).toEqual("abcd");
        expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should be able to look up indexers", () => {
        const expected = [
            "businesses",
            "bridgechains",
            "addresses",
            "publicKeys",
            "usernames",
            "resignations",
            "locks",
            "ipfs",
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
        it("should throw when looking up via bridgechain, business or locks scope", () => {
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Bridgechains, "1")).toThrowError(
                `Unknown scope ${Contracts.State.SearchScope.Bridgechains}`,
            );
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Businesses, "1")).toThrowError(
                `Unknown scope ${Contracts.State.SearchScope.Businesses}`,
            );
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

    it("should get, set and forget wallets by address", () => {
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

        walletRepo.forgetByAddress(address);
        expect(walletRepo.has(address)).toBeFalse();
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

    it("should get, set and forget wallets by public key", () => {
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

        walletRepo.forgetByPublicKey(publicKey);
        expect(walletRepo.has(publicKey)).toBeFalse();
    });

    it("should create a wallet if one is not found during public key lookup", () => {
        const firstNotYetExistingPublicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        expect(() => walletRepo.findByPublicKey(firstNotYetExistingPublicKey)).not.toThrow();
        expect(walletRepo.findByPublicKey(firstNotYetExistingPublicKey)).toBeInstanceOf(Wallet);

        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing publicKey by findByPublicKey creates a wallet.
         * However looking up a non-existing publicKey using findByIndex() does not.
         */
        const secondNotYetExistingPublicKey = "32337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        expect(() => walletRepo.findByIndex("publicKeys", secondNotYetExistingPublicKey)).toThrow();
    });

    it("should get, set and forget wallets by username", () => {
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

        walletRepo.forgetByUsername(username);
        expect(walletRepo.has(username)).toBeFalse();
    });

    it("should be able to index forgotten wallets", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        walletRepo.index(wallet1);
        expect(walletRepo.has("wallet1")).toBeTrue();
        walletRepo.forgetByIndex("addresses", "wallet1");
        walletRepo.index(wallet1);
        expect(walletRepo.has("wallet1")).toBeTrue();
    });

    it("should index array of wallets and forget using different indexers", () => {
        const wallets: Contracts.State.Wallet[] = [];
        const walletAddresses: string[] = [];
        for (let i = 0; i < 6; i++) {
            const walletAddress = `wallet${i}`;
            walletAddresses.push(walletAddress);
            const wallet = walletRepo.createWallet(walletAddress);
            wallets.push(wallet);
        }

        walletRepo.index(wallets);
        walletAddresses.forEach(address => expect(walletRepo.has(address)).toBeTrue());

        const publicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";

        walletRepo.getIndex("publicKeys").set(publicKey, wallets[1]);
        walletRepo.getIndex("usernames").set("username", wallets[2]);
        walletRepo.getIndex("resignations").set("resign", wallets[3]);
        walletRepo.getIndex("locks").set("lock", wallets[4]);
        walletRepo.getIndex("ipfs").set("ipfs", wallets[5]);

        wallets.forEach(wallet => walletRepo.index(wallet));

        walletRepo.forgetByIndex("addresses", walletAddresses[0]);
        walletRepo.forgetByIndex("publicKeys", publicKey);
        walletRepo.forgetByIndex("usernames", "username");
        walletRepo.forgetByIndex("resignations", "resign");
        walletRepo.forgetByIndex("locks", "locks");
        walletRepo.forgetByIndex("ipfs", "ipfs");

        walletAddresses.forEach(address => expect(walletRepo.has(address)).toBeFalse());
    });

    it("should get the nonce of a wallet", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        wallet1.nonce = Utils.BigNumber.make(100);
        wallet1.publicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        walletRepo.index(wallet1);

        expect(walletRepo.getNonce(wallet1.publicKey)).toEqual(Utils.BigNumber.make(100));
    });

    it("should return 0 nonce if there is no wallet", () => {
        const publicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
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
            const wallets = fixtureGenerator.generateWallets();
            walletRepo.index(wallets);

            const { count, rows } = searchRepository();
            expect(count).toBe(52);
            expect(rows).toHaveLength(52);
        });

        it("should be ok with params", () => {
            const wallets = fixtureGenerator.generateWallets();
            walletRepo.index(wallets);

            const { count, rows } = searchRepository({ offset: 10, limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (no offset)", () => {
            const wallets = fixtureGenerator.generateWallets();
            walletRepo.index(wallets);

            const { count, rows } = searchRepository({ limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const wallets = fixtureGenerator.generateWallets();
            walletRepo.index(wallets);

            const { count, rows } = searchRepository({ offset: 0, limit: 12 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(12);
        });

        it("should be ok with params (no limit)", () => {
            const wallets = fixtureGenerator.generateWallets();
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

        it.skip("should search wallets by the specified closed inverval (included) of balance", () => {
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
            expect(wallets.length).not.toEqual(0);
            expect(locks.rows).toHaveLength(wallets.length);
        });
    });

    describe("Delegates", () => {
        it("should search return all delegates", () => {
            const wallets = fixtureGenerator.generateFullWallets();
            walletRepo.index(wallets);

            const delegates = walletRepo.search(Contracts.State.SearchScope.Delegates, {});
            expect(wallets.length).not.toEqual(0);
            expect(delegates.rows).toHaveLength(wallets.length);
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

    describe("BridgeChains", () => {
        it("should search return all businesses", () => {
            const wallets = fixtureGenerator.generateBridgeChainWallets();
            walletRepo.index(wallets);

            const bridgechains = walletRepo.search(Contracts.State.SearchScope.Bridgechains, {});
            expect(wallets.length).not.toEqual(0);
            expect(bridgechains.rows).toHaveLength(wallets.length);
        });
    });

    describe("Businesses", () => {
        it("should search return all businesses", () => {
            const wallets = fixtureGenerator.generateBusinesses();
            walletRepo.index(wallets);

            const businesses = walletRepo.search(Contracts.State.SearchScope.Businesses, {});
            expect(wallets.length).not.toEqual(0);
            expect(businesses.rows).toHaveLength(wallets.length);
        });

        it("should search by address", () => {
            const wallets = fixtureGenerator.generateBusinesses();
            walletRepo.index(wallets);

            const businesses = walletRepo.search(Contracts.State.SearchScope.Businesses, {
                address: wallets[0].address,
            });

            expect(wallets.length).not.toEqual(0);
            expect(businesses.count).toEqual(1);
            expect(businesses.rows).toEqual([wallets[0]]);
        });
    });

    describe("count", () => {
        it("should be ok", () => {
            const wallets = fixtureGenerator.generateWallets();
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
            const { count, rows } = top();

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
